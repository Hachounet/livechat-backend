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
  denyGroup,
  leaveGroup,
  deleteGroup,
  sendMessageGroupPage,
  getMessagesGroupPage,
  sendFileGroupPage,
  getAllGroups,
  getAllGroupsRequests,
  excludeGroupMember,
} = require("../controllers/groupsController");

const groupsRouter = Router();
//Get all group requests ( waiting, denyed, accepted)
groupsRouter.get("/allrequests", authenticateJWT, getAllGroupsRequests);

// Get all groups related to user ( member or admin)
groupsRouter.get("/allgroups", authenticateJWT, getAllGroups);

// Create a group
groupsRouter.post("/createnewgroup", authenticateJWT, createNewGroup);

// Edit group infos
groupsRouter.put("/edit/:groupId", authenticateJWT, isAdmin, editGroup);

// Invite friend in private group
groupsRouter.post(
  "/invite/:groupId/:userId",
  authenticateJWT,
  isAdmin,
  inviteGroup,
);

// Get all pending invitations
groupsRouter.get("/invitations", isAdmin, getInvitationGroups);

// Cancel a pending invitation already sent by admin
groupsRouter.post(
  "/invitations/:groupId/:invitedUserId",
  authenticateJWT,
  isAdmin,
  postCancelInvitationsPage,
);

// Join a public or private group
groupsRouter.post("/join/:groupId", authenticateJWT, joinGroup);

// Deny a private invitation to a group
groupsRouter.post("/deny/:groupId", authenticateJWT, denyGroup);

groupsRouter.post(
  "/exclude/:groupId/:userId",
  authenticateJWT,
  excludeGroupMember,
);

// Leave a public or private group
groupsRouter.delete("/leave/:groupId", authenticateJWT, leaveGroup);

// Delete a group
groupsRouter.delete("/delete/:groupId", authenticateJWT, isAdmin, deleteGroup);

// Send text msg
groupsRouter.post("/messages/:groupId", authenticateJWT, sendMessageGroupPage); // Only text - no img

// Get all previous msgs
groupsRouter.get("/messages/:groupId", authenticateJWT, getMessagesGroupPage);

// Send img msg
groupsRouter.post(
  "/files/:groupId",
  authenticateJWT,
  uploadMiddleware("imgs").single("img"),
  sendFileGroupPage,
);

module.exports = groupsRouter;
