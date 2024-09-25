const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const asyncHandler = require("express-async-handler");

const errorMessage = require("../errorMessages");

exports.createNewGroup = asyncHandler(async (req, res, next) => {
  const groupName = req.body.groupName;
  const isPublic = req.body.isPublic;
  const userId = req.user.id;

  if (!groupName || groupName.trim().length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "Group name cannot be empty." });
  }

  const newGroup = await prisma.group.create({
    data: {
      name: groupName,
      isPublic: isPublic,
      ownerId: userId,
    },
  });

  return res
    .status(201)
    .json({ success: true, message: "Group created.", newGroup });
});

exports.editGroup = asyncHandler(async (req, res, next) => {
  const groupId = req.params.groupId;
  const { isPublic, groupName } = req.body;

  const editedGroup = await prisma.group.update({
    where: {
      id: groupId,
    },
    data: {
      isPublic,
      name: groupName,
    },
  });

  return res
    .status(200)
    .json({ success: true, message: "Group infos edited.", editedGroup });
});

exports.inviteGroup = asyncHandler(async (req, res, next) => {
  const groupId = req.params.groupId;
  const invitedUserId = req.params.userId;
  const inviterId = req.user.id;

  const group = await prisma.group.findUnique({
    where: {
      id: groupId,
    },
  });

  if (!group || group.ownerId !== inviterId) {
    return res.status(403).json({
      success: false,
      message: "You are not allowed to invite users to this group.",
    });
  }

  const existingMembership = await prisma.groupMembership.findUnique({
    where: {
      groupId_userId: { groupId, userId: invitedUserId },
    },
  });

  if (existingMembership) {
    return res.status(400).json({
      success: false,
      message: "This user is already a member of the group.",
    });
  }

  const groupRequest = await prisma.groupRequest.create({
    data: {
      groupId: groupId,
      userId: invitedUserId,
      status: "PENDING",
    },
  });

  return res.status(200).json({
    success: true,
    message: "Invitation sent successfully.",
    groupRequest,
  });
});

exports.getInvitationGroups = asyncHandler(async (req, res, next) => {
  const groupId = req.params.groupId;
  const userId = req.user.id;
  const group = await prisma.group.findUnique({
    where: {
      id: groupId,
      ownerId: userId,
    },
  });

  if (!group || group.ownerId !== userId) {
    return res.status(401).json({
      success: false,
      message: "You are not allowed to see pending invitations for this group.",
    });
  }

  const pendingInvitations = await prisma.groupRequest.findMany({
    where: {
      groupId: groupId,
      status: "PENDING",
    },
    include: {
      user: {
        select: {
          id: true,
          pseudo: true,
          avatarUrl: true,
        },
      },
    },
  });

  res.status(200).json({ success: true, pendingInvitations });
});

exports.postCancelInvitationsPage = asyncHandler(async (req, res, next) => {
  const { choice, invitedUserId } = req.body;
  const groupId = req.params.groupId;

  if (choice !== "REJECTED") {
    return res
      .status(400)
      .json({ success: false, message: "Choice is not correct value type." });
  }

  const group = await prisma.group.findUnique({
    where: {
      id: groupId,
    },
  });

  if (!group || group.ownerId !== userId) {
    return res.status(401).json({
      success: false,
      message: "You are not allowed to manage invitations for this group.",
    });
  }
  const invitation = await prisma.groupRequest.findUnique({
    where: {
      groupId_invitedUserId: { groupId, userId: invitedUserId },
    },
  });

  if (!invitation) {
    return res
      .status(404)
      .json({ success: false, message: "Invitation not found." });
  }
  const updatedInvitation = await prisma.groupRequest.update({
    where: {
      id: invitation.id,
    },
    data: {
      status: choice,
    },
  });

  return res.status(200).json({
    success: true,
    message: `Invitation has been ${choice}.`,
    updatedInvitation,
  });
});

// User join a group, either by accepting invitation or by joining public group
exports.joinGroup = asyncHandler(async (req, res, next) => {
  const groupId = req.params.groupId;
  const userId = req.user.id;

  const group = await prisma.group.findUnique({
    where: { id: groupId },
  });

  if (!group) {
    return res
      .status(404)
      .json({ success: false, message: "Group not found." });
  }

  const existingMembership = await prisma.groupMembership.findUnique({
    where: {
      groupId_userId: { groupId, userId },
    },
  });

  if (existingMembership) {
    return res.status(400).json({
      success: false,
      message: "You are already a member of this group.",
    });
  }

  if (!group.isPublic) {
    const invitation = await prisma.groupRequest.findUnique({
      where: {
        groupId_userId: { groupId, userId },
      },
      select: { status: true },
    });

    if (!invitation || invitation.status !== "PENDING") {
      return res.status(403).json({
        success: false,
        message: "You need a valid invitation to join this private group.",
      });
    }

    await prisma.groupRequest.update({
      where: {
        groupId_userId: { groupId, userId },
      },
      data: {
        status: "ACCEPTED",
      },
    });
  }

  const newMembership = await prisma.groupMembership.create({
    data: {
      groupId,
      userId,
    },
  });

  return res.status(200).json({
    success: true,
    message: "You have successfully joined the group.",
    newMembership,
  });
});

exports.leaveGroup = asyncHandler(async (req, res, next) => {
  const groupId = req.params.groupId;
  const userId = req.user.id;

  const group = await prisma.group.findUnique({
    where: { id: groupId },
  });

  if (!group) {
    return res
      .status(404)
      .json({ success: false, message: "Group not found." });
  }

  const existingMembership = await prisma.groupMembership.findUnique({
    where: {
      groupId_userId: { groupId, userId },
    },
  });

  if (!existingMembership) {
    return res.status(400).json({
      success: false,
      message: "You are not a member of this group.",
    });
  }

  await prisma.groupMembership.delete({
    where: {
      groupId_userId: { groupId, userId },
    },
  });

  return res.status(200).json({
    success: true,
    message: "You have successfully left the group.",
  });
});

exports.deleteGroup = asyncHandler(async (req, res, next) => {
  const groupId = req.params.id;
  const userId = req.user.id;

  const group = await prisma.group.findUnique({
    where: { id: groupId },
  });

  if (!group) {
    return res
      .status(404)
      .json({ success: false, message: "Group not found." });
  }

  if (group.ownerId !== userId) {
    return res.status(403).json({
      success: false,
      message: "You are not authorized to delete this group.",
    });
  }

  await prisma.message.deleteMany({
    where: { groupId },
  });

  await prisma.groupMembership.deleteMany({
    where: { groupId },
  });

  await prisma.group.delete({
    where: { id: groupId },
  });

  return res.status(200).json({
    success: true,
    message: "Group deleted successfully.",
  });
});

exports.sendMessageGroupPage = asyncHandler(async (req, res, next) => {
  const groupId = req.params.groupId;
  const userId = req.user.id;
  const { content } = req.body;

  const group = await prisma.group.findUnique({
    where: { id: groupId },
  });

  if (!group) {
    return res
      .status(404)
      .json({ success: false, message: "Group not found." });
  }

  const membership = await prisma.groupMembership.findUnique({
    where: {
      groupId_userId: { groupId, userId },
    },
  });

  if (!membership) {
    return res.status(403).json({
      success: false,
      message: "You are not a member of this group.",
    });
  }

  const newMessage = await prisma.message.create({
    data: {
      content,
      senderId: userId,
      groupId,
    },
  });

  return res.status(200).json({
    success: true,
    message: "Message sent successfully.",
    newMessage,
  });
});

exports.getMessagesGroupPage = asyncHandler(async (req, res, next) => {
  const groupId = req.params.groupId;
  const userId = req.user.id;

  const group = await prisma.group.findUnique({
    where: { id: groupId },
  });

  if (!group) {
    return res
      .status(404)
      .json({ success: false, message: "Group not found." });
  }

  const membership = await prisma.groupMembership.findUnique({
    where: {
      groupId_userId: { groupId, userId },
    },
  });

  if (!membership) {
    return res.status(403).json({
      success: false,
      message: "You are not a member of this group.",
    });
  }

  const messages = await prisma.message.findMany({
    where: { groupId },
    orderBy: { createdAt: "asc" },
    include: {
      file: true,
    },
  });

  return res.status(200).json({
    success: true,
    messages,
  });
});

exports.sendFileGroupPage = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const groupId = req.params.groupId;

  const group = await prisma.group.findUnique({
    where: { id: groupId },
  });

  if (!group) {
    return res
      .status(404)
      .json({ success: false, message: "Group not found." });
  }

  const membership = await prisma.groupMembership.findUnique({
    where: {
      groupId_userId: { groupId, userId },
    },
  });

  if (!membership) {
    return res.status(403).json({
      success: false,
      message: "You are not a member of this group.",
    });
  }

  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "No file uploaded." });
  }

  const fileUrl = req.file.path;
  const fileName = req.file.filename;

  const newFile = await prisma.file.create({
    data: {
      url: fileUrl,
      uploaderId: userId,
      cloudinaryId: fileName,
    },
  });

  const newMessage = await prisma.message.create({
    data: {
      groupId,
      senderId: userId,
      fileId: newFile.id,
    },
  });

  return res.status(200).json({ success: true, newMessage });
});
