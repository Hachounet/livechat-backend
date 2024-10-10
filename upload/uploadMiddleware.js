const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../cloudinaryConfig");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function uploadMiddleware(folderName) {
  const storage = new CloudinaryStorage({
    cloudinary: cloudinary, // use cloudinaryConfig
    params: async (req, file) => {
      const userId = req.user.id;

      // Fetch current user avatar URL from the database
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { avatarUrl: true },
      });

      if (user && user.avatarUrl) {
        // Extract public_id from the avatar URL and delete the old avatar
        const oldAvatarPublicId = user.avatarUrl.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(`avatars/${oldAvatarPublicId}`);
      }

      const folderPath = `${folderName.trim()}`;
      const fileExtension = path.extname(file.originalname).substring(1);
      const publicId = `avatar-${file.fieldname}-${userId}`;

      return {
        folder: folderPath,
        public_id: publicId,
        format: fileExtension,
      };
    },
  });

  return multer({
    storage: storage,
    limits: {
      fileSize: 5 * 1024 * 1024, // keep images size < 5 MB
    },
  });
}

module.exports = uploadMiddleware;
