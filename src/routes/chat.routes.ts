import express from "express";
import {
  addMembers,
  deleteChat,
  leaveGroup,
  newGroupChat,
  removeMember,
  renameGroup,
  sendAttachments,
} from "../controllers/chat.js";
import {
  addMemberValidator,
  chatIdValidator,
  newGroupValidator,
  removeMemberValidator,
  renameValidator,
  sendAttachmentsValidator,
  validateHandler,
} from "../lib/validators.js";
import { isAuthenticated } from "../middleware/auth.js";
import { attachmentsMulter } from "../middleware/multer.js";

const app = express.Router();

app.use(isAuthenticated);

app.post("/new", newGroupValidator(), validateHandler, newGroupChat);

app.put("/addmembers", addMemberValidator(), validateHandler, addMembers);

app.put(
  "/removemembers",
  removeMemberValidator(),
  validateHandler,
  removeMember
);

app.delete("/leave/:chatId", chatIdValidator(), validateHandler, leaveGroup);

app.post(
  "/message",
  attachmentsMulter,
  sendAttachmentsValidator(),
  validateHandler,
  sendAttachments
);

app
  .route("/:chatId")
  .put(renameValidator(), validateHandler, renameGroup)
  .delete(chatIdValidator(), validateHandler, deleteChat);

// .get(chatIdValidator(), validateHandler, getChatDetails)
// app.get("/message/:id", chatIdValidator(), validateHandler, getMessages);
// app.get("/my/groups", getMyGroups);
// app.get("/my", getMyChats);

export default app;
