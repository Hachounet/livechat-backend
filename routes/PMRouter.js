const { Router } = require("express");
const uploadMiddleware = require("../upload/uploadMiddleware");

const {
  postPrivateMessageOneFriend,
  postImageOneFriend,
  getPrivateMessagesOneFriend,
} = require("../controllers/PMController");

const PMRouter = Router();

PMRouter.post("/:receiverId", postPrivateMessageOneFriend);

PMRouter.post(
  "/:receiverId",
  uploadMiddleware("imgs").single("img"),
  postImageOneFriend,
);

PMRouter.get("/:receiverId", getPrivateMessagesOneFriend);
