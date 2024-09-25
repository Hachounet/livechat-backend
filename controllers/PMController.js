const { PrismaClient } = require("@prisma/client");
const asyncHandler = require("express-async-handler");
const prisma = new PrismaClient();

exports.postPrivateMessageOneFriend = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const receiverId = req.params.receiverId;
  const message = req.body.msg;

  if (!message || message.trim().length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "Message cannot be empty." });
  }

  const receiver = await prisma.user.findUnique({
    where: {
      id: receiverId,
    },
  });

  if (!receiver) {
    return res
      .status(404)
      .json({ success: false, message: "Receiver not found." });
  }

  const newMessage = await prisma.message.create({
    data: {
      sendId: userId,
      receiverId: receiverId,
      content: message,
    },
  });

  return res
    .status(201)
    .json({ success: true, message: "Message sent !", newMessage });
});

exports.postImageOneFriend = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const receiverId = req.params.receiverId;

  const receiver = await prisma.user.findUnique({
    where: {
      id: receiverId,
    },
  });

  if (!receiver) {
    return res.status(404).json({ success: false, message: "User not found." });
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
      fileId: newFile.id,
      senderId: userId,
      receiverId: receiverId,
    },
  });

  return res.status(200).json({ success: true, newMessage });
});

exports.getPrivateMessagesOneFriend = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const receiverId = req.params.receiverId;

  const receiver = await prisma.user.findUnique({
    where: {
      id: receiverId,
    },
  });

  if (!receiver) {
    return res
      .status(404)
      .json({ success: false, message: "Receiver not found." });
  }

  const previousMessages = await prisma.message.findMany({
    where: {
      OR: [
        {
          senderId: userId,
          receiverId: receiverId,
        },
        {
          senderId: receiverId,
          receiverId: userId,
        },
      ],
    },
    orderBy: {
      createdAt: "asc", // Tri par date de création
    },
    include: {
      file: true,
    },
  });

  return res.status(200).json({
    success: true,
    messages: previousMessages,
  });
});
