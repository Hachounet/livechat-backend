const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const asyncHandler = require("express-async-handler");
const { validationResult } = require("express-validator");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const errorMessage = require("../errorMessages");
const validateSignUp = require("../helpers/validateSignUp");

exports.postLoginPage = asyncHandler(async (req, res, next) => {
  const errors = [];

  const user = await prisma.user.findUnique({
    where: {
      email: req.body.email,
    },
  });

  if (!user) {
    errors.push({ msg: errorMessage.INVALID_EMAIL });
  }

  let isPasswordValid = true;
  if (user) {
    isPasswordValid = await bcryptjs.compare(req.body.pw, user.hash);
    if (!isPasswordValid) {
      errors.push({ msg: errorMessage.INVALID_PASSWORD });
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  const accessToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });

  return res.status(200).json({ message: "User logged in", accessToken });
});

exports.postSignupPage = [
  validateSignUp,
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    bcryptjs.hash(req.body.pw, 10, async (err, hashedPassword) => {
      if (err) {
        return next(err);
      }
      const newUser = await prisma.user.create({
        data: {
          email: req.body.email,
          pseudo: req.body.pseudo,
          hash: hashedPassword,
          birthdate: req.body.birthdate,
        },
      });

      const fakeFriends = await prisma.user.findMany({
        where: {
          fakeAccount: true,
        },
      });

      const friendshipRequests = fakeFriends.map((fakeFriend) => {
        return prisma.friendRequest.create({
          data: {
            senderId: newUser.id,
            receiverId: fakeFriend.id,
            status: "ACCEPTED",
          },
        });
      });

      await Promise.all(friendshipRequests);

      return res
        .status(200)
        .json({ success: true, message: "Account successfully created !" });
    });
  }),
];
