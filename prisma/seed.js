const { PrismaClient } = require("@prisma/client");
const { DateTime } = require("luxon");
const prisma = new PrismaClient();

async function main() {
  const usersData = [
    {
      email: "fakealice@fakemail.com",
      pseudo: "Fake_Alice",
    },
    {
      email: "fakebob@fakeemail.com",
      pseudo: "Fake_Bob",
    },
  ];

  const createdUsers = await Promise.all(
    usersData.map((user) =>
      prisma.user.create({
        data: {
          email: user.email,
          pseudo: user.pseudo,
          hash: "fakehash1234",
          fakeAccount: true,
        },
      }),
    ),
  );

  // Create friendship between them
  for (let i = 0; i < createdUsers.length; i++) {
    for (let j = 0; j < createdUsers.length; j++) {
      if (i !== j) {
        await prisma.friendRequest.create({
          data: {
            senderId: createdUsers[i].id,
            receiverId: createdUsers[j].id,
            status: "ACCEPTED",
          },
        });

        await prisma.user.update({
          where: { id: createdUsers[i].id },
          data: { friends: { push: createdUsers[j].id } },
        });

        await prisma.user.update({
          where: { id: createdUsers[j].id },
          data: { friends: { push: createdUsers[i].id } },
        });
      }
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
