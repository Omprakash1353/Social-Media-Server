import { Request } from "express";
import { getSockets } from "../lib/helper.js";

export const emitEvent = (
  req: Request,
  event: string,
  users: string[],
  data: unknown
) => {
  const io = req.app.get("io");
  const usersSocket = getSockets(users);
  io.to(usersSocket).emit(event, data);
};
