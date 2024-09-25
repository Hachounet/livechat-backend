const { Router } = require("express");
const { authenticateJWT } = require("../auth/passport");

const {
  getUsersListPage,
  getGroupListPage,
} = require("../controllers/searchController");

const searchRouter = Router();

searchRouter.get("/", (req, res) => {
  res.status(200).json({ message: "iuhaozdih" });
});

searchRouter.get("/users", authenticateJWT, getUsersListPage);

searchRouter.get("/groups", authenticateJWT, getGroupListPage);

module.exports = searchRouter;
