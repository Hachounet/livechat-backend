const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const asyncHandler = require("express-async-handler");

const errorMessage = require("../errorMessages");

exports.getUsersListPage = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const userName = req.query.query;
  console.log(userName);
  if (!userName) {
    return res
      .status(400)
      .json({ success: false, message: "Query is required." });
  }

  const users = await prisma.user.findMany({
    where: {
      pseudo: {
        contains: userName,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      pseudo: true,
      avatarUrl: true,
      friends: true,
    },
  });
  console.log(users);
  return res.status(200).json({ success: true, userId, users });
});

exports.getGroupListPage = asyncHandler(async (req, res, next) => {
  const groupName = req.query.query;
  const userId = req.user.id;

  if (!groupName) {
    return res
      .status(400)
      .json({ success: false, message: "Query is required." });
  }

  const groups = await prisma.group.findMany({
    where: {
      name: {
        contains: groupName,
        mode: "insensitive",
      },
      isPublic: true,
    },
  });

  const userInfo = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      groupMemberships: true,
      groupRequests: true,
      ownedGroups: true,
    },
  });

  return res.status(200).json({ success: true, groups, userInfo, userId });
});
