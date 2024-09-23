const { Router } = require("express");
const passport = require("passport");

const {
  postLoginPage,
  postLogoutPage,
  postSignUpPage,
} = require("../controllers/authController");

const authRouter = Router();

authRouter.post("/login", postLoginPage);

authRouter.post("/logout", postLogoutPage);

authRouter.post("/signup", postSignUpPage);
