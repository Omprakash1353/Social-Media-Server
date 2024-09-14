import { toObjectId } from "../lib/helper.js";
import { TryCatch } from "../middleware/error.js";
import { ChatModel } from "../models/chat.model.js";
import { MessageModel } from "../models/message.model.js";
import { ErrorHandler } from "../utils/utility-class.js";

const newGroupChat = TryCatch(async (req, res, next) => {
  const { name, members } = req.body;
  console.log("Request User", req.user);

  if (members.length < 1)
    return next(
      new ErrorHandler("Group chat must have atleast 2 members", 400)
    );

  const uniqueMemberIds = Array.from(
    new Set([...members, req.user].map((member: string) => toObjectId(member)))
  );

  if (uniqueMemberIds.length < 2)
    return next(
      new ErrorHandler("Group chat must have atleast 2 members", 400)
    );

  const chat = await ChatModel.create({
    name,
    groupChat: true,
    creator: req.user,
    members: uniqueMemberIds,
  });

  // emitEvent(req, ALERT, allMembers, `Welcome to ${name} group`);
  // emitEvent(req, REFETCH_CHATS, members, "");

  return res
    .status(201)
    .json({ success: true, message: "Group created", data: { id: chat._id } });
});

const addMembers = TryCatch(async (req, res, next) => {
  const { chatId, members: memberArr } = req.body;
  if (!chatId || memberArr.length === 0)
    return next(new ErrorHandler("Parameters are not found", 404));

  const chat = await ChatModel.findByIdAndUpdate(
    chatId,
    {
      $addToSet: {
        members: memberArr.map((e: string) => toObjectId(e)),
      },
    },
    { new: true, projection: { members: 1 } }
  );

  if (!chat) return next(new ErrorHandler("Unable to add user", 404));

  // emitEvent(req, ALERT, allMembers, `${member_name} added in group`);
  // emitEvent(req, REFETCH_CHATS, members, "");

  return res
    .status(200)
    .json({ ok: true, success: true, message: "New member added in group" });
});

const removeMember = TryCatch(async (req, res, next) => {
  const { chatId, members: memberArr } = req.body;
  if (!chatId || memberArr.length === 0)
    return next(new ErrorHandler("Parameters are not found", 404));

  const chat = await ChatModel.findByIdAndUpdate(
    toObjectId(chatId),
    {
      $pull: {
        members: { $in: memberArr },
      },
    },
    { new: true, projection: { members: 1 } }
  );

  if (!chat) return next(new ErrorHandler("Unable to add user", 404));

  // emitEvent(req, ALERT, allMembers, `removed from group ${member_name}`);
  // emitEvent(req, REFETCH_CHATS, members, "");

  return res
    .status(200)
    .json({ ok: true, success: true, message: "Removed member from group" });
});

const leaveGroup = TryCatch(async (req, res, next) => {
  const { chatId } = req.params;
  const { userId } = req.body;

  const chat = await ChatModel.findByIdAndUpdate(
    toObjectId(chatId),
    {
      $pull: {
        members: toObjectId(userId),
      },
    },
    { new: true, projection: { members: 1 } }
  );

  if (!chat) return next(new ErrorHandler("Unable to add user", 404));

  // emitEvent(req, ALERT, allMembers, `removed from group ${member_name}`);
  // emitEvent(req, REFETCH_CHATS, members, "");

  return res
    .status(200)
    .json({ ok: true, success: true, message: `Successfully left the group` });
});

const sendAttachments = TryCatch(async (req, res, next) => {});

const renameGroup = TryCatch(async (req, res, next) => {
  const { chatId } = req.params;
  const { name } = req.body;

  const chat = await ChatModel.findOneAndUpdate(
    toObjectId(chatId),
    { name: name },
    { new: true, projection: { name: 1 } }
  );

  if (!chat)
    return next(new ErrorHandler("Unable to update groupChat name", 404));

  // emitEvent(req, ALERT, allMembers, `Group name updated to ${chat.name}`);
  // emitEvent(req, REFETCH_CHATS, members, "");

  return res.status(200).json({
    ok: true,
    success: true,
    message: `Group name updated to ${chat.name}`,
  });
});

const deleteChat = TryCatch(async (req, res, next) => {
  const { chatId } = req.params;
  const chat = await ChatModel.findByIdAndDelete(chatId);

  if (!chat) return next(new ErrorHandler("Unable to delete chat", 404));
  return res
    .status(200)
    .json({ ok: true, success: true, message: `Chat deleted successfully` });
});

const deleteMessages = TryCatch(async (req, res, next) => {
  const { chatId } = req.params;
  const chat = await MessageModel.find({ chat: chatId });

  if (!chat) return next(new ErrorHandler("Unable to delete messages", 404));
  return res.status(200).json({
    ok: true,
    success: true,
    message: `Messaged deleted successfully`,
  });
});

export {
  addMembers,
  deleteChat,
  leaveGroup,
  newGroupChat,
  removeMember,
  renameGroup,
  sendAttachments,
  deleteMessages,
};
