const { Router } = require("express");
const passport = require("passport");

const PMRouter = Router();

PMRouter.post("/:receiverId", postPrivateMessageOneFriend);

PMRouter.get("/:receiverId", getPrivateMessagesOneFriend);
