const { PrismaClient, GroupRequestStatus } = require("@prisma/client");
const prisma = new PrismaClient();
const asyncHandler = require("express-async-handler");

const errorMessage = require("../errorMessages");

exports.getAllGroupsRequests = asyncHandler(async (req, res, next) => {
  //Only give groupRequests related to current user.
  // This is not the controller for an group admin looking to check previously send invitation to another user
  const userId = req.user.id;

  const groupRequests = await prisma.groupRequest.findMany({
    where: {
      userId: userId,
    },
    select: {
      group: {
        select: {
          id: true,
          name: true,
          isPublic: true,
        },
      },
      status: true,
    },
  });

  return res
    .status(200)
    .json({ success: true, userId: userId, groupRequests: groupRequests });
});

exports.getAllGroups = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;

  const groupMemberships = await prisma.groupMembership.findMany({
    where: {
      userId: userId,
    },
    select: {
      group: {
        select: {
          id: true,
          name: true,
          ownerId: true,
          isPublic: true,
          groupRequests: {
            where: {
              userId: userId,
            },
            select: {
              userId: true,
              status: true,
            },
          },
        },
      },
    },
  });

  return res
    .status(200)
    .json({ success: true, userId: userId, groupMemberships });
});

exports.createNewGroup = asyncHandler(async (req, res, next) => {
  const groupName = req.body.groupName;
  const isPublic = req.body.isPublic;
  const userId = req.user.id;

  if (
    !groupName ||
    groupName.trim().length < 3 ||
    groupName.trim().length > 20
  ) {
    return res.status(400).json({
      success: false,
      message: "Group name must be between 3 and 20 characters.",
    });
  }

  const newGroup = await prisma.group.create({
    data: {
      name: groupName,
      isPublic: isPublic,
      ownerId: userId,
    },
  });

  const newMembership = await prisma.groupMembership.create({
    data: {
      groupId: newGroup.id,
      userId: userId,
      role: "ADMIN",
    },
  });

  return res.status(201).json({
    success: true,
    message: "Group created.",
    newGroup,
    newMembership,
  });
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
      status: GroupRequestStatus.PENDING,
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
  const invitedUserId = req.params.invitedUserId;
  const userId = req.user.id;
  const groupId = req.params.groupId;

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
      groupId_userId: { groupId, userId: invitedUserId },
    },
  });

  if (!invitation) {
    return res
      .status(404)
      .json({ success: false, message: "Invitation not found." });
  }

  await prisma.groupRequest.delete({
    where: {
      groupId_userId: { groupId, userId: invitedUserId },
    },
  });

  return res.status(200).json({
    success: true,
    message: "Invitation has been successfully deleted.",
  });
});

exports.excludeGroupMember = asyncHandler(async (req, res, next) => {
  const groupId = req.params.groupId;
  const excludedMemberId = req.params.userId;
  const userId = req.user.id;

  const memberToExclude = await prisma.groupMembership.findFirst({
    where: {
      groupId: groupId,
      userId: excludedMemberId,
    },
  });

  if (!memberToExclude) {
    return res
      .status(404)
      .json({ message: "User is not a member of this group" });
  }

  await prisma.groupMembership.delete({
    where: {
      groupId_userId: {
        userId: excludedMemberId,
        groupId: groupId,
      },
    },
  });

  await prisma.groupRequest.deleteMany({
    where: {
      groupId: groupId,
      userId: excludedMemberId,
    },
  });

  return res.status(200).json({
    success: true,
    message: "User successfully excluded from the group",
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

exports.denyGroup = asyncHandler(async (req, res, next) => {
  const groupId = req.params.groupId;
  const userId = req.user.id;

  const request = await prisma.groupRequest.findFirst({
    where: {
      groupId: groupId,
      userId: userId,
      status: "PENDING",
    },
  });

  if (!request) {
    return res.status(404).json({
      success: false,
      message: "You have no pending invitation for this group.",
    });
  } else {
    await prisma.groupRequest.delete({
      where: {
        id: request.id,
      },
    });

    return res
      .status(200)
      .json({ success: true, message: "Invitation denied." });
  }
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
  const groupId = req.params.groupId;

  await prisma.message.deleteMany({
    where: { groupId: groupId },
  });

  await prisma.groupMembership.deleteMany({
    where: { groupId: groupId },
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
    select: { name: true, isPublic: true },
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
    where: { groupId: groupId },
    orderBy: { createdAt: "asc" },
    include: {
      file: true,
    },
  });

  const users = await prisma.group.findUnique({
    where: {
      id: groupId,
    },
    select: {
      members: {
        select: {
          user: {
            select: {
              id: true,
              pseudo: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
  });

  return res.status(200).json({
    success: true,
    userId: userId,
    messages: messages,
    group: group,
    users: users,
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
      content: "",
      groupId: groupId,
      senderId: userId,
      fileId: newFile.id,
    },
  });

  const createdMessageWithFile = await prisma.message.findUnique({
    where: {
      id: newMessage.id,
    },
    include: {
      file: true,
    },
  });

  return res.status(200).json({
    success: true,
    newMessage: createdMessageWithFile,
    userId: req.user.id,
  });
});
