const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const asyncHandler = require("express-async-handler");

const errorMessage = require("../errorMessages");

exports.createNewGroup = asyncHandler(async (req, res, next) => {
  console.log("test");
});

exports.searchPublicGroups = asyncHandler(async (req, res, next) => {
  console.log("test");
});

exports.editGroup = asyncHandler(async (req, res, next) => {
  console.log("test");
});

exports.inviteGroup = asyncHandler(async (req, res, next) => {
  console.log("test");
});

exports.joinGroup = asyncHandler(async (req, res, next) => {
  console.log("test");
});

exports.leaveGroup = asyncHandler(async (req, res, next) => {
  console.log("test");
});

exports.deleteGroup = asyncHandler(async (req, res, next) => {
  console.log("test");
});

exports.sendMessageGroupPage = asyncHandler(async (req, res, next) => {
  console.log("test");
});

exports.getMessagesGroupPage = asyncHandler(async (req, res, next) => {
  console.log("test");
});
