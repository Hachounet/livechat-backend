const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const errorMessage = require("../errorMessages");

exports.postUploadFilePage = asyncHandler(async (req, res, next) => {
  console.log("test");
});

exports.getFilePage = asyncHandler(async (req, res, next) => {
  console.log("test");
});
