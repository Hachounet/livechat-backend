const dotenv = require("dotenv");
dotenv.config();

const errorMessages = require("./errorMessages");
const express = require("express");
const { PrismaClient } = require("@prisma/client");
const path = require("path");
const helmet = require("helmet");
const cors = require("cors");

const authRouter = require("./routes/authRouter");
const friendsRouter = require("./routes/friendsRouter");
const groupsRouter = require("./routes/groupsRouter");
const PMRouter = require("./routes/PMRouter");
const searchRouter = require("./routes/searchRouter");
const usersRouter = require("./routes/usersRouter");

const prisma = new PrismaClient();
const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["*"];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow request without origin (Postman or serv to serv)
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS."));
    }
  },
  methods: "GET, HEAD, PUT, PATCH, POST, DELETE",
  credentials: true,
  allowedHeaders: ["Authorization", "Content-Type"],
};

app.use(cors(corsOptions));
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

// Err handling
// Universal Error Handler Middleware
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

  // Default error message
  let errorMessage = err.message || "An unknown error occurred.";

  // Handle specific Prisma errors
  if (err.code === "P2002") {
    const target = err.meta.target[0];
    if (target === "email") {
      errorMessage = errorMessages.EMAIL_ALREADY_EXISTS;
    } else if (target === "pseudo") {
      errorMessage = errorMessages.PSEUDO_ALREADY_EXISTS;
    }
  }

  if (err.code === "P2025") {
    // Prisma: Record not found
    errorMessage = errorMessages.RECORD_NOT_FOUND;
  }

  // Handle validation errors
  if (err.name === "ValidationError") {
    errorMessage = errorMessages.VALIDATION_ERROR;
  }

  // Handle authentication and authorization errors
  if (err.name === "UnauthorizedError") {
    errorMessage = errorMessages.UNAUTHORIZED;
  }

  if (err.name === "ForbiddenError") {
    errorMessage = errorMessages.FORBIDDEN;
  }

  // Handle JWT token errors
  if (err.name === "TokenExpiredError") {
    errorMessage = errorMessages.TOKEN_EXPIRED;
  }

  if (err.name === "JsonWebTokenError") {
    errorMessage = errorMessages.INVALID_TOKEN;
  }

  // Default response to the client
  res.status(statusCode).json({
    success: false,
    error: {
      message: errorMessage,
    },
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server launched on port ${PORT}`);
});
