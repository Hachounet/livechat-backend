const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const asyncHandler = require("express-async-handler");
const errorMessage = require("../errorMessages");
const bcrypt = require("bcryptjs");

// Get user info page
exports.getUsersInfosPage = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      pseudo: true,
      avatarUrl: true,
      id: true,
    },
  });

  if (!user) {
    return res
      .status(400)
      .json({ success: false, message: errorMessage.USER_NOT_FOUND });
  }

  return res.status(200).json({ success: true, user });
});

// Update user info page
exports.updateUserInfosPage = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const { email, pseudo } = req.body;

  if (pseudo) {
    const existingUser = await prisma.user.findUnique({
      where: { pseudo },
    });

    if (existingUser && existingUser.id !== userId) {
      return res.status(400).json({
        success: false,
        message: "This pseudo is already taken.",
      });
    }
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { email, pseudo },
  });

  if (!user) {
    return res
      .status(400)
      .json({ success: false, message: errorMessage.UPDATE_FAILED });
  }

  return res.status(201).json({ success: true, message: "Profile updated." });
});

exports.updateAvatarUserPage = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;

  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "No file uploaded." });
  }

  const avatarUrl = req.file.path;

  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      avatarUrl: avatarUrl,
    },
  });

  res
    .status(201)
    .json({ success: true, avatarUrl, message: "Avatar uploaded." });
});

// Delete user page
exports.deleteUserPage = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;

  try {
    await prisma.user.delete({ where: { id: userId } });
    return res.status(200).json({
      success: true,
      message: "Account deleted. Redirection to homepage...",
    });
  } catch (error) {
    return res
      .status(400)
      .json({ success: false, message: errorMessage.DELETE_FAILED });
  }
});

exports.getUserFriendsPage = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const groupId = req.params.groupId || null; // Rendre groupId optionnel

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { friends: true },
  });

  if (!user) {
    return res.status(400).json({ success: false, message: "User not found." });
  }

  if (user.friends.length === 0) {
    return res.status(200).json({ success: true, friends: [] });
  }

  const friends = await prisma.user.findMany({
    where: {
      id: { in: user.friends },
    },
    select: {
      id: true,
      pseudo: true,
      avatarUrl: true,
      status: true,

      ...(groupId && {
        groupRequests: {
          where: {
            groupId: groupId,
            status: { in: ["PENDING", "ACCEPTED"] },
          },
          select: {
            status: true,
          },
        },
      }),
    },
  });

  return res.status(200).json({ success: true, friends });
});

exports.updateUserStatusPage = asyncHandler(async (req, res, next) => {
  const { status } = req.body;
  const userId = req.user.id;

  if (!status || (status !== "ONLINE" && status !== "OFFLINE")) {
    return res
      .status(400)
      .json({ message: 'Status must be either "ONLINE" or "OFFLINE"' });
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { status: status },
  });

  const friends = await prisma.user.findMany({
    where: {
      id: { in: updatedUser.friends },
    },
    select: {
      id: true,
    },
  });

  return res.status(200).json({
    message: "Status updated successfully",
    user: {
      id: updatedUser.id,
      status: updatedUser.status,
    },
  });
});

exports.updatePasswordUser = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "Please provide both old and new passwords.",
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { hash: true },
  });

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found." });
  }

  const isMatch = await bcrypt.compare(oldPassword, user.hash);
  if (!isMatch) {
    return res
      .status(400)
      .json({ success: false, message: "Old password is incorrect." });
  }

  const newHashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: userId },
    data: { hash: newHashedPassword },
  });

  return res
    .status(200)
    .json({ success: true, message: "Password updated successfully." });
});
