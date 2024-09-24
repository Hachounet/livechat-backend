const { Router } = require("express");
const { authenticateJWT } = require("../auth/passport");

const {
  getUsersListPage,
  getGroupListPage,
} = require("../controllers/searchController");

const searchRouter = Router();

searchRouter.get("/users?query=xyz", authenticateJWT, getUsersListPage);

searchRouter.get("/groups?query=xyz", authenticateJWT, getGroupListPage);
