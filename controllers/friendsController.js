const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const asyncHandler = require("express-async-handler");

const errorMessage = require("../errorMessages");

exports.sendFriendRequest = asyncHandler(async (req, res, next) => {
  console.log("test");
});

exports.acceptOrDenyFriendRequest = asyncHandler(async (req, res, next) => {
  console.log("test");
});

exports.getFriendsRequests = asyncHandler(async (req, res, next) => {
  console.log("test");
});
