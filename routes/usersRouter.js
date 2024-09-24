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
  "/",
  authenticateJWT,
  uploadMiddleware("avatars").single("avatar"),
  updateAvatarUserPage,
);

usersRouter.delete("/delete", authenticateJWT, deleteUserPage);

usersRouter.get("/friends", authenticateJWT, getUserFriendsPage);

usersRouter.put("/status", authenticateJWT, updateUserStatusPage);

usersRouter.put("/password", authenticateJWT, updatePasswordUser);
