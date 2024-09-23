const { Router } = require("express");
const passport = require("passport");

const {
  postUploadFilePage,
  getFilePage,
} = require("../controllers/filesController");

const filesRouter = Router();

filesRouter.post("/upload", postUploadFilePage);

filesRouter.get("/:fileId", getFilePage);
