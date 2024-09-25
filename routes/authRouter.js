const { Router } = require("express");

const {
  postLoginPage,
  postSignUpPage,
} = require("../controllers/authController");

const authRouter = Router();

authRouter.post("/login", postLoginPage);

authRouter.post("/signup", postSignUpPage);

module.exports = authRouter;
