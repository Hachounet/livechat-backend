const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const errorMessage = require("../errorMessages");

exports.postLoginPage = asyncHandler(async (req, res, next) => {
  console.log("WIP");
});

exports.postLogoutPage = asyncHandler(async (req, res, next) => {
  console.log("WIP");
});

exports.postSignupPage = asyncHandler(async (req, res, next) => {
  console.log("WIP");
});
