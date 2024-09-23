const { Router } = require("express");
const passport = require("passport");

const PMRouter = Router();

exports.postPrivateMessageOneFriend = asyncHandler(async (req, res, next) => {
  console.log("test");
});

exports.getPrivateMessagesOneFriend = asyncHandler(async (req, res, next) => {
  console.log("test");
});
