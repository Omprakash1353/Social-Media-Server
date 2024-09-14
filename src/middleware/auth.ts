import { config } from "dotenv";
import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

import { UserModel } from "../models/user.model.js";
import { CustomSocket } from "../types/interfaces.js";
import { ErrorHandler } from "../utils/utility-class.js";
import { TryCatch } from "./error.js";

config({ path: "./.env" });

export const isAuthenticated = TryCatch((req: any, _res: any, next: any) => {
  const token = req.cookies["social-chat-token"];
  if (!token)
    return next(new ErrorHandler("Please login to access this route", 401));

  const decodedData = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

  req.user = decodedData._id;

  next();
});

export const socketAuthenticator = async (
  err: unknown,
  socket: CustomSocket,
  next: NextFunction
): Promise<void> => {
  try {
    if (err) return next(err);

    const authToken = socket.request.cookies["social-chat-token"];

    if (!authToken)
      return next(new ErrorHandler("Please login to access this route", 401));

    const decodedData = jwt.verify(
      authToken,
      process.env.JWT_SECRET!
    ) as JwtPayload;

    const user = await UserModel.findById(decodedData._id);

    if (!user)
      return next(new ErrorHandler("Please login to access this route", 401));

    socket.user = user;
    console.log("Authenticated");
    return next();
  } catch (error) {
    console.error(error);
    return next(new ErrorHandler("Please login to access this route", 401));
  }
};
