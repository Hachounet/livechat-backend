const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const asyncHandler = require("express-async-handler");

const errorMessage = require("../errorMessages");

exports.getUsersListPage = asyncHandler(async (req, res, next) => {
  const userName = req.query.query;

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
  });

  return res.status(200).json({ success: true, users });
});

exports.getGroupListPage = asyncHandler(async (req, res, next) => {
  const groupName = req.query.query;

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
    },
  });

  return res.status(200).json({ success: true, groups });
});
