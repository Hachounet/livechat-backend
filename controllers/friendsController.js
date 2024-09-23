const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const asyncHandler = require("express-async-handler");

const errorMessage = require("../errorMessages");

exports.sendFriendRequest = asyncHandler(async (req, res, next) => {
  console.log("test");
  const friendId = req.params.id;
  const userId = req.user.id;

  const existingRequest = await prisma.friendRequest.findUnique({
    where: {
      senderId_receiverId: {
        senderId: userId,
        receiverId: friendId,
      },
    },
  });

  if (existingRequest)
    return res
      .status(400)
      .json({ success: false, message: "Friend request already sent." });
  // Probably disable with frontend ?

  const friendRequest = await prisma.friendRequest.create({
    data: {
      senderId: userId,
      receiverId: friendId,
    },
  });

  res.status(200).json({
    success: true,
    message: "Friend request sent successfully.",
    friendRequest,
  });
});

exports.acceptOrDenyFriendRequest = asyncHandler(async (req, res, next) => {
  const friendId = req.params.id;
  const userId = req.user.id;
  const choice = req.body.choice;

  if (typeof choice !== "boolean") {
    return res.status(400).json({
      success: false,
      message: "Invalid choice. Must be true or false.",
    });
  }

  const friendRequest = await prisma.friendRequest.findUnique({
    where: {
      senderId_receiverId: {
        senderId: friendId,
        receiverId: userId,
      },
    },
  });

  if (!friendRequest || friendRequest.status !== "PENDING") {
    return res.status(404).json({
      success: false,
      message: "Friend request not found or already processed.",
    });
  }

  if (choice === true) {
    await prisma.$transaction([
      prisma.friendRequest.update({
        where: { id: friendRequest.id },
        data: { status: "ACCEPTED" },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { friends: { push: friendId } },
      }),
      prisma.user.update({
        where: { id: friendId },
        data: {
          friends: { push: userId },
        },
      }),
    ]);

    return res
      .status(200)
      .json({ success: true, message: "Friend request accepted." });
  } else {
    await prisma.friendRequest.update({
      where: { id: friendRequest.id },
      data: { status: "DENIED" },
    });

    return res.status(200).json({
      success: true,
      message: "Friend request denied.",
    });
  }
});

exports.getFriendsRequests = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;

  const friendsRequests = await prisma.friendRequest.findMany({
    where: {
      OR: [{ sendId: userId }, { receiverId: userId }],
    },
    include: {
      sender: {
        select: {
          id: true,
          pseudo: true,
          avatarUrl: true,
        },
      },
      receiver: {
        select: {
          id: true,
          pseudo: true,
          avatarUrl: true,
        },
      },
    },
  });

  res.status(200).json({ friendsRequests });
});
