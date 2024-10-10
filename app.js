const dotenv = require("dotenv");
dotenv.config();

const { getFriendsIds } = require("./helpers/socketHelpers");
const express = require("express");
const { PrismaClient } = require("@prisma/client");

const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const helmet = require("helmet");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();
const authRouter = require("./routes/authRouter");
const friendsRouter = require("./routes/friendsRouter");
const groupsRouter = require("./routes/groupsRouter");
const PMRouter = require("./routes/PMRouter");
const searchRouter = require("./routes/searchRouter");
const usersRouter = require("./routes/usersRouter");

const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:5173"];

const corsOptions = {
  origin: "https://livechat-frontend-theta.vercel.app/",
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
  credentials: true,
  allowedHeaders: ["Authorization", "Content-Type"],
};

app.use(cors(corsOptions));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "https://livechat-frontend-theta.vercel.app/",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use("/auth", authRouter);
app.use("/friends", friendsRouter);
app.use("/groups", groupsRouter);
app.use("/messages", PMRouter);
app.use("/search", searchRouter);
app.use("/users", usersRouter);

app.use((err, req, res, next) => {
  if (process.env.NODE_ENV === "development") {
    console.log("Error details", {
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      body: req.body,
      query: req.query,
    });
  }

  const statusCode = err.status || 500; // Default to 500 if not provided
  let errorMessage = err.message || "An unknown error occurred.";

  res.status(statusCode).json({
    success: false,
    error: {
      message: errorMessage,
    },
  });
});

const getUserIdFromToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.id;
  } catch (err) {
    return null;
  }
};

io.on("connection", (socket) => {
  let userId;

  socket.on("joinRoom", async (token) => {
    userId = getUserIdFromToken(token);

    if (userId) {
      socket.join(userId);

      await prisma.user.update({
        where: { id: userId },
        data: { status: "ONLINE" },
      });

      const friendsIds = await getFriendsIds(userId);

      friendsIds.friends.forEach((friendId) => {
        socket.to(friendId).emit("statusChanged", { userId, status: "online" });
      });
    } else {
      console.error("Invalid token");
    }
  });

  socket.on("updateAvatar", async (data) => {
    const { avatarUrl } = data;
    const friendsIds = await getFriendsIds(userId);

    friendsIds.friends.forEach((friendId) => {
      socket.to(friendId).emit("avatarUpdated", { userId, avatarUrl });
    });
  });

  socket.on("addFriend", async (data) => {
    const { addedFriendId } = data;

    // Info of user who accept friend request
    const userInfo = await prisma.user.findUnique({ where: { id: userId } });
    io.to(addedFriendId).emit("friendAdded", { newFriend: userInfo });
  });

  socket.on("deleteFriend", async (data) => {
    const { deletedFriendId } = data;

    io.to(deletedFriendId).emit("friendDeleted", { userId });
  });

  socket.on("changePseudo", async (data) => {
    const { pseudo } = data;
    const friendsIds = await getFriendsIds(userId);

    friendsIds.friends.forEach((friendId) => {
      io.to(friendId).emit("pseudoChanged", { userId, pseudo });
    });

    socket.emit("pseudoChanged", { userId, pseudo });
  });

  socket.on("changeStatus", (data) => {
    const { userId, status } = data;
    socket.to(userId).emit("statusChanged", { userId, status });
  });

  socket.on("statusChanged", async (data) => {
    const { token, status } = data;
    const userId = getUserIdFromToken(token);

    const friendsIds = await getFriendsIds(userId);

    friendsIds.friends.forEach((friendId) => {
      socket.to(friendId).emit("statusChanged", { userId, status });
    });
  });

  socket.on("privateMessageSent", async (data) => {
    const { recipientId, message } = data;

    socket.to(recipientId).emit("privateMessageReceived", message);
  });

  socket.on("joinGroup", (groupId) => {
    socket.join(`group-${groupId}`);
  });

  socket.on("leaveGroup", (groupId) => {
    socket.leave(`group-${groupId}`);
  });

  socket.on("sendGroupMessage", async (data) => {
    const { groupId, message } = data;

    socket.to(`group-${groupId}`).emit("groupMessageReceived", message);
  });

  socket.on("startTypingPrivate", (contactId) => {
    if (userId) {
      socket.to(contactId).emit("startTypingPrivate", userId);
    }
  });

  socket.on("stopTypingPrivate", (contactId) => {
    if (userId) {
      socket.to(contactId).emit("stopTypingPrivate", userId);
    }
  });

  socket.on("startTyping", (groupId) => {
    if (userId) {
      socket.to(`group-${groupId}`).emit("startTyping", userId);
    }
  });

  socket.on("stopTyping", (groupId) => {
    if (userId) {
      socket.to(`group-${groupId}`).emit("stopTyping", userId);
    }
  });

  socket.on("disconnect", async () => {
    if (userId) {
      socket.to(userId).emit("statusChanged", { userId, status: "offline" });

      await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          status: "OFFLINE",
        },
      });

      const friendsIds = await getFriendsIds(userId);
      friendsIds.friends.forEach((friendId) => {
        socket
          .to(friendId)
          .emit("statusChanged", { userId, status: "offline" });
      });
    }
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server launched on port ${PORT}`);
});
