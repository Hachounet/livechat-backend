require("dotenv").config();
const { ExtractJwt, Strategy } = require("passport-jwt");
const passport = require("passport");

const options = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
};

passport.use(
  "jwt",
  new Strategy(options, (payload, done) => {
    try {
      // No check with the DB if signature && expiracy are correct. Could bring some issues with a deleted user by example.
      return done(null, payload);
    } catch (err) {
      return done(err, false);
    }
  }),
);

const authenticateJWT = passport.authenticate("jwt", {
  session: false,
});

module.exports = { authenticateJWT };
