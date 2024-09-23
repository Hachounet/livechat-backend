const { Router } = require("express");
const passport = require("passport");

const searchRouter = Router();

searchRouter.get("/users?query=xyz", getUsersListPage);

searchRouter.get("/groups?query=xyz", getGroupListPage);
