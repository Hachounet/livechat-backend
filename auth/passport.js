require("dotenv").config();
const { ExtractJwt, Strategy } = require("passport-jwt");
const passport = require("passport");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const options = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
};

passport.use(
  "jwt",
  new Strategy(options, async (payload, done) => {
    try {
      const user = await prisma.user.findUnique({ where: { id: payload.id } });
      if (user) return done(null, user);
      else return done(null, false);
    } catch (err) {
      return done(err);
    }
  }),
);

const authenticateJWT = passport.authenticate("jwt", {
  session: false,
});

module.exports = { authenticateJWT };
