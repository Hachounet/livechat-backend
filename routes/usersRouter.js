const { Router } = require("express");
const passport = require("passport");

const usersRouter = Router();

usersRouter.get("/:id", getUsersInfosPage);

usersRouter.put("/:id", updateUserInfosPage);

usersRouter.delete("/:id", deleteUserPage);

usersRouter.get("/:id/friends", getUserFriendsPage);

usersRouter.put("/:id/status", updateUserStatusPage);
