const { Router } = require("express");
const passport = require("passport");
const { authenticateJWT } = require("../auth/passport");
const {
  sendFriendRequest,
  acceptOrDenyFriendRequest,
  getFriendsRequests,
  deleteFriend,
} = require("../controllers/friendsController");

const friendsRouter = Router();

friendsRouter.post("/request/:id", authenticateJWT, sendFriendRequest);
friendsRouter.put("/request/:id", authenticateJWT, acceptOrDenyFriendRequest);

friendsRouter.get("/requests", authenticateJWT, getFriendsRequests);

friendsRouter.post("/delete", authenticateJWT, deleteFriend);

module.exports = friendsRouter;
