const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function getFriendsIds(userId) {
  const friends = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      friends: true,
    },
  });

  return friends;
}

module.exports = { getFriendsIds };
