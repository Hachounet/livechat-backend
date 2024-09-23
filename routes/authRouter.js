const { Router } = require("express");
const passport = require("passport");

const {
  postLoginPage,
  postSignUpPage,
} = require("../controllers/authController");

const authRouter = Router();

authRouter.post("/login", postLoginPage);

authRouter.post("/signup", postSignUpPage);
