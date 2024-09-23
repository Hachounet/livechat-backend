const { Router } = require("express");
const passport = require("passport");

const groupsRouter = Router();

groupsRouter.post("/createnewgroup", createNewGroup);

groupsRouter.get("/public", searchPublicGroups);

groupsRouter.put("/edit/:groupId", editGroup);

groupsRouter.post("/invite", inviteGroup);

groupsRouter.post("/join/:groupId", joinGroup);

groupsRouter.delete("/leave/:groupId", leaveGroup);

groupsRouter.delete("/delete/:groupId", deleteGroup);

groupsRouter.post("/messages/:groupId", sendMessageGroupPage);

groupsRouter.get("/messages/:groupId", getMessagesGroupPage);
