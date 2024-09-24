const { Router } = require("express");
const { authenticateJWT } = require("../auth/passport");
const { isAdmin } = require("../auth/groupAdminMiddleware");

const groupsRouter = Router();

groupsRouter.post("/createnewgroup", authenticateJWT, createNewGroup);

groupsRouter.put("/edit/:groupId", authenticateJWT, isAdmin, editGroup);

groupsRouter.post(
  "/invite/:groupId/:userId",
  authenticateJWT,
  isAdmin,
  inviteGroup,
);

groupsRouter.post("/join/:groupId", authenticateJWT, joinGroup);

groupsRouter.delete("/leave/:groupId", authenticateJWT, leaveGroup);

groupsRouter.delete("/delete/:groupId", authenticateJWT, isAdmin, deleteGroup);

groupsRouter.post("/messages/:groupId", authenticateJWT, sendMessageGroupPage);

groupsRouter.get("/messages/:groupId", authenticateJWT, getMessagesGroupPage);
