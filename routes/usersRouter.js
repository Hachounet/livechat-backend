const { Router } = require("express");
const { authenticateJWT } = require("../auth/passport");
const uploadMiddleware = require("../upload/uploadMiddleware");

const {
  getUserFriendsPage,
  updateUserInfosPage,
  updateAvatarUserPage,
  deleteUserPage,
  getUsersInfosPage,
  updateUserStatusPage,
  updatePasswordUser,
} = require("../controllers/usersController");

const usersRouter = Router();

usersRouter.get("/", authenticateJWT, getUsersInfosPage);

usersRouter.put("/", authenticateJWT, updateUserInfosPage);

usersRouter.put(
  "/avatar",
  authenticateJWT,
  uploadMiddleware("avatars").single("avatar"),
  updateAvatarUserPage,
);

usersRouter.delete("/delete", authenticateJWT, deleteUserPage);

usersRouter.get("/friends/:groupId", authenticateJWT, getUserFriendsPage);

usersRouter.put("/status", authenticateJWT, updateUserStatusPage);

usersRouter.put("/password", authenticateJWT, updatePasswordUser);

module.exports = usersRouter;
