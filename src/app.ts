import cookieParser from "cookie-parser";
import cors from "cors";
import { config } from "dotenv";
import express, { NextFunction, Request, Response } from "express";
import http from "http";
import morgan from "morgan";
import { Server, Socket } from "socket.io";
import mongoose from "mongoose";

import { getSockets } from "./lib/helper.js";
import { socketAuthenticator } from "./middleware/auth.js";
import { errorMiddleware } from "./middleware/error.js";
import { UserModel } from "./models/user.model.js";
import chatRoute from "./routes/chat.routes.js";
import { CustomSocket } from "./types/interfaces.js";
import { connectDB } from "./utils/connectDB.js";
import { sendToken } from "./utils/token.js";
import path from "path";
import { fileURLToPath } from "url";
import { MessageModel } from "./models/message.model.js";
import { getErrorMessage } from "./lib/errorMessageHandler.js";
import { ChatModel } from "./models/chat.model.js";

config({ path: "./.env" });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 4000;
export const envMode = process.env.NODE_ENV?.trim() || "DEVELOPMENT";
export const userSocketIDs = new Map<string, string>();
export const onlineUsers = new Set<string>();

await connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.set("io", io);
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: ["http://localhost:3000"],
    credentials: true,
  })
);

app.use(morgan("dev"));

app.get("/", (req, res) => res.send("Hello world !"));

app.post("/api/v1/auth", async (req: Request, res: Response, next) => {
  const { _id } = req.body;
  const user = await UserModel.findById(_id);
  if (user) {
    req.user = _id;
    sendToken(res, { _id: _id.toString() }, 200, "Token created for user");
  } else {
    res.status(404).json({ message: "User not found" });
  }
});

app.use("/api/v1/chat", chatRoute);

io.use((socket: Socket, next) => {
  const customSocket = socket as CustomSocket;
  cookieParser()(
    customSocket.request as any,
    customSocket.request.res as any,
    async (err: unknown) => {
      return await socketAuthenticator(err, customSocket, next as NextFunction);
    }
  );
});

function getMemberSockets(memberIds: string[]): string[] {
  return memberIds.reduce<string[]>((sockets, memberId) => {
    const socketId = userSocketIDs.get(memberId);
    if (socketId) {
      sockets.push(socketId);
    }
    return sockets;
  }, []);
}

io.on("connection", (socket: any) => {
  console.log("USER_CONNECTED", socket.user._id, socket.id);
  const user = socket.user;
  userSocketIDs.set(user._id.toString(), socket.id);
  onlineUsers.add(user._id.toString());
  const senderInfo = { _id: user._id, name: user.name };

  const notifyMembers = async (status: boolean) => {
    try {
      const chats = (await ChatModel.find({
        members: user._id,
        groupChat: false,
      }).select("members")) as { members: string[] }[];
      const memberIds = chats.flatMap((chat) =>
        chat.members.map((member) => member.toString())
      );
      const uniqueMemberIds = [...new Set(memberIds)].filter(
        (id) => id !== user._id.toString()
      );
      const memberSockets = getMemberSockets(uniqueMemberIds);
      console.log("notifyMembers", memberSockets);
      memberSockets.forEach((memberSocket) => {
        io.to(memberSocket).emit("user:status", { userId: user._id, status });
      });
    } catch (error) {
      console.error("Error notifying members:", error);
    }
  };

  notifyMembers(true);

  // new user connection doesn't displays online on client side
  socket.on("remote:user:status", async (data: { member: string }) => {
    const isMemberOnline = onlineUsers.has(data.member);
    const memberSocket = userSocketIDs.get(data.member);
    console.log("check:remote:user:status", data, isMemberOnline, memberSocket);
    socket.emit("remote:user:status", {
      status: isMemberOnline,
      remoteSocketId: memberSocket,
    });
  });

  socket.on(
    "new:message",
    async (data: { members: string[]; chatId: string; message: string }) => {
      console.log("new:message", data);
      const membersSockets = getSockets(data.members);

      const messageForRealTime = {
        content: data.message,
        sender: senderInfo,
        chatId: data.chatId,
        createdAt: new Date().toISOString(),
      };

      socket.to(membersSockets).emit("new:message", messageForRealTime);

      const messageForDB = {
        content: data.message,
        sender: user._id,
        chat: data.chatId,
      };

      try {
        await MessageModel.create(messageForDB);
      } catch (error: unknown) {
        throw new Error(getErrorMessage(error));
      }
    }
  );

  socket.on("start:typing", (data: { members: string[]; chatId: string }) => {
    console.log("start:typing", data);
    const membersSockets = getSockets(data.members);
    socket.to(membersSockets).emit("start:typing", {
      chatId: data.chatId,
      sender: senderInfo,
    });
  });

  socket.on("stop:typing", (data: { members: string[]; chatId: string }) => {
    console.log("stop:typing", data);
    const membersSockets = getSockets(data.members);
    socket.to(membersSockets).emit("stop:typing", {
      chatId: data.chatId,
      sender: senderInfo,
    });
  });

  // socket.on("chat:joined", (data: { userId: string; members: string[] }) => {
  //   console.log("chat:joined", data);
  //   const membersSocket = getSockets(data.members);
  //   io.to(membersSocket).emit("online:users", Array.from(onlineUsers));
  // });

  // socket.on(
  //   "chat:leaved",
  //   ({ userId, members }: { userId: string; members: string[] }) => {
  //     console.log("chat:leaved");
  //     const membersSocket = getSockets(members);
  //     io.to(membersSocket).emit("online:users", Array.from(onlineUsers));
  //   }
  // );

  socket.on("room:join", (data: { userId: string; callId: string }) => {
    console.log("room:join");
    const { userId, callId } = data;
    console.log("ROOM:JOIN", data);
    io.to(callId).emit("user:joined", {
      userId,
      id: socket.id,
    });
    socket.join(callId);
    io.to(socket.id).emit("room:join", data);
  });

  socket.on(
    "user:call",
    (data: { to: string; offer: RTCSessionDescriptionInit }) => {
      console.log("user:call");
      io.to(data.to).emit("incomming:call", {
        from: socket.id,
        offer: data.offer,
      });
    }
  );

  socket.on(
    "call:accepted",
    (data: { to: string; ans: RTCSessionDescriptionInit }) => {
      console.log("call:accepted");
      io.to(data.to).emit("call:accepted", { from: socket.id, ans: data.ans });
    }
  );

  socket.on("call:end", (data: { to: string }) => {
    console.log("call:end");
    io.to(data.to).emit("call:end");
  });

  socket.on(
    "peer:nego:needed",
    (data: { to: string; offer: RTCSessionDescriptionInit }) => {
      console.log("peer:nego:needed", data);
      io.to(data.to).emit("peer:nego:needed", {
        from: socket.id,
        offer: data.offer,
      });
    }
  );

  socket.on(
    "peer:nego:done",
    (data: { to: string; ans: RTCSessionDescriptionInit }) => {
      console.log("peer:nego:done", data);
      io.to(data.to).emit("peer:nego:final", {
        from: socket.id,
        ans: data.ans,
      });
    }
  );

  socket.on("disconnect", async () => {
    console.log("USER_DISCONNECTED");
    userSocketIDs.delete(user._id.toString());
    onlineUsers.delete(user._id.toString());

    notifyMembers(false);

    try {
      await mongoose
        .model("User")
        .updateOne({ _id: user._id }, { $set: { lastOnlineTime: Date.now() } });
    } catch (error) {
      console.error(error);
    }
  });
});

app.use(errorMiddleware);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} in ${envMode} Mode`);
});
