const { Router } = require("express");
const uploadMiddleware = require("../upload/uploadMiddleware");
const { authenticateJWT } = require("../auth/passport");
const {
  postPrivateMessageOneFriend,
  postImageOneFriend,
  getPrivateMessagesOneFriend,
} = require("../controllers/PMController");

const PMRouter = Router();

PMRouter.post("/:receiverId", authenticateJWT, postPrivateMessageOneFriend);

PMRouter.post(
  "/:receiverId/image",
  authenticateJWT,
  uploadMiddleware("imgs").single("img"),
  postImageOneFriend,
);

PMRouter.get("/:receiverId", authenticateJWT, getPrivateMessagesOneFriend);

module.exports = PMRouter;
