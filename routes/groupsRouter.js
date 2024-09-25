const { Router } = require("express");
const { authenticateJWT } = require("../auth/passport");
const { isAdmin } = require("../auth/groupAdminMiddleware");
const uploadMiddleware = require("../upload/uploadMiddleware");
const {
  createNewGroup,
  editGroup,
  inviteGroup,
  getInvitationGroups,
  postCancelInvitationsPage,
  joinGroup,
  leaveGroup,
  deleteGroup,
  sendMessageGroupPage,
  getMessagesGroupPage,
  sendFileGroupPage,
} = require("../controllers/groupsController");

const groupsRouter = Router();

groupsRouter.post("/createnewgroup", authenticateJWT, createNewGroup);

groupsRouter.put("/edit/:groupId", authenticateJWT, isAdmin, editGroup);

groupsRouter.post(
  "/invite/:groupId/:userId",
  authenticateJWT,
  isAdmin,
  inviteGroup,
);

groupsRouter.get("/invitations", isAdmin, getInvitationGroups);

groupsRouter.post("/invitations/:groupId", isAdmin, postCancelInvitationsPage);

groupsRouter.post("/join/:groupId", authenticateJWT, joinGroup);

groupsRouter.delete("/leave/:groupId", authenticateJWT, leaveGroup);

groupsRouter.delete("/delete/:groupId", authenticateJWT, isAdmin, deleteGroup);

groupsRouter.post("/messages/:groupId", authenticateJWT, sendMessageGroupPage); // Only text - no img

groupsRouter.get("/messages/:groupId", authenticateJWT, getMessagesGroupPage);

groupsRouter.post(
  "/files/:groupId",
  authenticateJWT,
  uploadMiddleware("imgs").single("img"),
  sendFileGroupPage,
); // Only img - no text

module.exports = groupsRouter;
