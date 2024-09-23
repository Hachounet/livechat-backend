const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const asyncHandler = require("express-async-handler");

const errorMessage = require("../errorMessages");

exports.getUsersListPage = asyncHandler(async (req, res, next) => {
  console.log("test");
});

exports.getGroupListPage = asyncHandler(async (req, res, next) => {
  console.log("test");
});
