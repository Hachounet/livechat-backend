const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const asyncHandler = require("express-async-handler");
const { validationResult, body } = require("express-validator");
const { DateTime } = require("luxon");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const errorMessages = require("../errorMessages");

function checkForJSAttack(value) {
  const regex = /<script.*?>.*?<\/script>/i;
  if (regex.test(value)) {
    throw new Error("Username cannot contain JavaScript code.");
  }
  const invalidChars = /[^a-zA-Z0-9-_]/;
  if (invalidChars.test(value)) {
    throw new Error(
      "Username can only contain alphanumeric characters, dashes and underscores.",
    );
  }
  return true;
}

function validateBirthdate(value) {
  const birthdate = DateTime.fromISO(value);
  const today = DateTime.now();
  const age = today.diff(birthdate, "years").years;

  if (!birthdate.isValid) {
    throw new Error(errorMessages.INVALID_DATE);
  }
  if (age < 13) {
    throw new Error(errorMessages.UNDERAGE);
  }
  return true;
}

const validateSignUp = [
  body("pseudo")
    .trim()
    .escape()
    .notEmpty()
    .withMessage(`Pseudo ${errorMessages.NOT_EMPTY}`)
    .isLength({ min: 3, max: 20 })
    .withMessage(`Pseudo ${errorMessages.LENGTH_3_TO_20}`)
    .custom(checkForJSAttack),
  body("email")
    .trim()
    .escape()
    .notEmpty()
    .withMessage(`Email ${errorMessages.NOT_EMPTY}`)
    .normalizeEmail()
    .isEmail()
    .withMessage(`${errorMessages.MAIL_FORMAT}`),
  body("birthdate")
    .notEmpty()
    .withMessage(`Birthdate ${errorMessages.NOT_EMPTY}`)
    .custom(validateBirthdate),
  body("pw")
    .notEmpty()
    .withMessage(`Password ${errorMessages.NOT_EMPTY}`)
    .trim()
    .isLength({ min: 6 })
    .withMessage(`Password ${errorMessages.LENGTH_6}`)
    .custom(checkForJSAttack)
    .custom((value, { req }) => {
      if (value !== req.body.confpw) {
        throw new Error(errorMessages.PASSWORDS_DO_NOT_MATCH);
      }
      return true;
    }),
];

exports.postLoginPage = asyncHandler(async (req, res, next) => {
  const errors = [];

  const user = await prisma.user.findUnique({
    where: {
      email: req.body.email,
    },
  });

  if (!user) {
    errors.push({ msg: errorMessages.INVALID_EMAIL });
  }

  let isPasswordValid = true;
  if (user) {
    isPasswordValid = await bcryptjs.compare(req.body.pw, user.hash);
    if (!isPasswordValid) {
      errors.push({ msg: errorMessages.INVALID_PASSWORD });
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

exports.postSignUpPage = [
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
          birthdate: new Date(req.body.birthdate),
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

      // Update friends array for newUser and each fakeFriend
      await Promise.all(
        fakeFriends.map((fakeFriend) => {
          return Promise.all([
            prisma.user.update({
              where: { id: newUser.id },
              data: { friends: { push: fakeFriend.id } },
            }),
            prisma.user.update({
              where: { id: fakeFriend.id },
              data: { friends: { push: newUser.id } },
            }),
          ]);
        }),
      );

      return res
        .status(200)
        .json({ success: true, message: "Account successfully created !" });
    });
  }),
];
