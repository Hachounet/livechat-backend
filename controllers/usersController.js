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
      avatarUrl: true, // Fix: added true to select fields
      birthdate: true,
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
  const { email, pseudo, birthdate } = req.body;

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { email, pseudo, birthdate },
    });

    return res.status(201).json({ success: true, message: "Profile updated." });
  } catch (error) {
    return res
      .status(400)
      .json({ success: false, message: errorMessage.UPDATE_FAILED });
  }
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

  res.status(201).json({ success: true, avatarUrl });
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

// Get user friends page (pending implementation)
exports.getUserFriendsPage = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;

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
      email: true,
    },
  });

  return res.status(200).json({ success: true, friends });
});

exports.updateUserStatusPage = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const { liveStatus } = req.body;

  const validStatuses = ["ONLINE", "OCCUPIED", "OFFLINE"];
  if (!validStatuses.includes(liveStatus)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid status provided." });
  }

  const status = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      status: liveStatus,
    },
    select: {
      status,
    },
  });

  return res.status(201).json({
    success: true,
    message: "Status updated !",
    status: status.status,
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
