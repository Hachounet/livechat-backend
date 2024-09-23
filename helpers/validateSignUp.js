const errorMessages = require("../errorMessages");
const { body } = require("express-validator");
const { DateTime } = require("luxon");

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

module.exports = { validateSignUp };
