import mongoose from "mongoose";
import { onlineUsers, userSocketIDs } from "../app.js";

export const getOtherMember = (members: any[], userId: string) =>
  members.find((member) => member._id.toString() !== userId.toString());

export const getSockets = (users: string[] = []): string[] => {
  return users.reduce<string[]>((sockets, user) => {
    const socketId = userSocketIDs.get(user.toString());
    if (socketId) {
      sockets.push(socketId);
      onlineUsers.add(user.toString());
    }
    return sockets;
  }, []);
};

export const getBase64 = (file: any) =>
  `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

export const toObjectId = (id: string) => new mongoose.Types.ObjectId(id);
