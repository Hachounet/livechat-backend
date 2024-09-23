const { Router } = require("express");
const passport = require("passport");

const {
  sendFriendRequest,
  acceptOrDenyFriendRequest,
  getFriendsRequests,
} = require("../controllers/friendsController");

const friendsRouter = Router();

friendsRouter.post("/request/:id", sendFriendRequest);

friendsRouter.put("/request/:id", acceptOrDenyFriendRequest);

friendsRouter.get("/requests", getFriendsRequests);
