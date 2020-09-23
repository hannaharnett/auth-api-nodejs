require("dotenv").config();

const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const utils = require("./utils");

const app = express();
const port = process.env.PORT || 4000;

// static user details
const userData = {
  userId: "867956",
  password: "123456",
  name: "Bob Arne",
  username: "bobarne",
  isAdmin: true,
};

app.use(cors());
app.use(express.json());

//middleware that checks if JWT token exists and verifies it if it does exist.
app.use(function (req, res, next) {
  var token = req.headers["authorization"];
  if (!token) return next(); //if no token, continue

  token = token.replace("Bearer ", "");
  jwt.verify(token, process.env.JWT_SECRET, function (err, user) {
    if (err) {
      return res.status(401).json({
        error: true,
        message: "Invalid user.",
      });
    } else {
      req.user = user;
      next();
    }
  });
});

// request handlers
app.get("/", (req, res) => {
  if (!req.user)
    return res
      .status(401)
      .json({ success: false, message: "Invalid user to access it." });
  res.send("Welcome " + req.user.name);
});

// validate the user credentials
app.post("/users/signin", function (req, res) {
  const user = req.body.username;
  const pwd = req.body.password;

  // 400 - if no username/password
  if (!user || !pwd) {
    return res.status(400).json({
      error: true,
      message: "Username or Password is required.",
    });
  }

  // 401 - if the credential does not match
  if (user !== userData.username || pwd !== userData.password) {
    return res.status(401).json({
      error: true,
      message: "Username or Password is wrong.",
    });
  }

  const token = utils.generateToken(userData);
  const userObj = utils.getUser(userData);
  return res.json({ user: userObj, token });
});

// verify the token and return it if it's valid
app.get("/verifyToken", function (req, res) {
  var token = req.query.token;
  if (!token) {
    return res.status(400).json({
      error: true,
      message: "Token is required.",
    });
  }
  // check token that was passed
  jwt.verify(token, process.env.JWT_SECRET, function (err, user) {
    if (err)
      return res.status(401).json({
        error: true,
        message: "Invalid token.",
      });

    // 401 - if the userId does not match
    if (user.userId !== userData.userId) {
      return res.status(401).json({
        error: true,
        message: "Invalid user.",
      });
    }

    var userObj = utils.getCleanUser(userData);
    return res.json({ user: userObj, token });
  });
});

app.listen(port, () => {
  console.log("Server started on: " + port);
});
