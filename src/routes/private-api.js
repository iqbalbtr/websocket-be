const express = require("express");
const private_api = express.Router();
const authController = require("../controller/auth-controller");
const authMiddleware = require("../middleware/auth-middleware");
const contactController = require("../controller/contact-controller");
const groupController = require("../controller/group-controller");
const archiveController = require("../controller/archive-controller.");
const blockController = require("../controller/block-controller");
const userController = require("../controller/user-controller");
const { Upload, profileUser, messageFile } = require("../utils/storage/multer");
const storageController = require("../controller/storage-controller");

private_api.use(authMiddleware.api);

private_api.get("/public/*", storageController.get);
private_api.post("/upload/message", Upload(messageFile).single("file"), (req, res) => res.json({result: req.file.filename}))
private_api.post("/upload/profile", Upload(profileUser).single("profile"), (req, res) => res.json({result: req.file.filename}))

private_api.patch("/auth/logout", authController.logout);
private_api.get("/auth/me", authController.me);

private_api.patch("/api/user", Upload(profileUser).single("profile"), userController.update)

private_api.get("/api/contacts", contactController.list);
private_api.post("/api/contacts", contactController.create);
private_api.delete("/api/contacts/:contactId", contactController.remove);
private_api.patch("/api/contacts/:contactId", contactController.update);

private_api.patch("/api/contacts/archive/:contactId", archiveController.add);
private_api.delete("/api/contacts/archive/:contactId", archiveController.remove);

private_api.patch("/api/contacts/block/:contactId", blockController.add);
private_api.delete("/api/contacts/block/:contactId", blockController.remove);

private_api.get("/api/group", groupController.get);
private_api.post("/api/group", groupController.create);

module.exports = private_api;