const asyncHandler = require("express-async-handler");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.isAdmin = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const groupId = req.params.groupId;

  const group = await prisma.group.findUnique({
    where: {
      id: groupId,
    },
  });

  if (!group) {
    return res
      .status(404)
      .json({ success: false, message: "Group not found." });
  }

  if (group.ownerId === userId) {
    return next();
  } else {
    return res
      .status(401)
      .json({ success: false, message: "Operation not allowed." });
  }
});
