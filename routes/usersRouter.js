const { Router } = require("express");
const { authenticateJWT } = require("../auth/passport");

const usersRouter = Router();

usersRouter.get("/", authenticateJWT, getUsersInfosPage);

usersRouter.put("/", authenticateJWT, updateUserInfosPage);

usersRouter.delete("/delete", authenticateJWT, deleteUserPage);

usersRouter.get("/friends", authenticateJWT, getUserFriendsPage);

usersRouter.put("/status", authenticateJWT, updateUserStatusPage);

usersRouter.put("/password", authenticateJWT, updatePasswordUser);
