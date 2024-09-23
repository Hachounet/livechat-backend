const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const asyncHandler = require("express-async-handler");

const errorMessage = require("../errorMessages");

exports.getUsersInfosPage = asyncHandler(async (req, res, next) => {
  console.log("test");
});

exports.updateUserInfosPage = asyncHandler(async (req, res, next) => {
  console.log("test");
});

exports.deleteUserPage = asyncHandler(async (req, res, next) => {
  console.log("test");
});

exports.getUserFriendsPage = asyncHandler(async (req, res, next) => {
  console.log("test");
});

exports.updateUserStatusPage = asyncHandler(async (req, res, next) => {
  console.log("test");
});
