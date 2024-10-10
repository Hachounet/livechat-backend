const { PrismaClient } = require("@prisma/client");
const asyncHandler = require("express-async-handler");
const prisma = new PrismaClient();
// const { io } = require("../app");

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
      senderId: userId,
      receiverId: receiverId,
      content: message,
    },
  });

  // io.emit("newPrivateMessage", {
  //   senderId: newMessage.senderId,
  //   receiverId: newMessage.receiverId,
  //   content: newMessage.content,
  //   timestamp: newMessage.createdAt,
  // });

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

  const createdMessageWithFile = await prisma.message.findUnique({
    where: {
      id: newMessage.id,
    },
    include: {
      file: true, // Inclut les détails du fichier
    },
  });

  return res.status(200).json({
    success: true,
    newMessage: createdMessageWithFile,
    userId: req.user.id,
  });
});

exports.getPrivateMessagesOneFriend = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const receiverId = req.params.receiverId;

  const receiver = await prisma.user.findUnique({
    where: {
      id: receiverId,
    },
    select: {
      pseudo: true,
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
      createdAt: "asc", 
    },
    include: {
      file: true,

      receiver: {
        select: {
          pseudo: true,
        },
      },
    },
  });

  return res.status(200).json({
    success: true,
    messages: previousMessages,
    userId: req.user.id,
    receiverPseudo: receiver,
  });
});
