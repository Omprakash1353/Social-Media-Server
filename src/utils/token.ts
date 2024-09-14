import { config } from "dotenv";
import { CookieOptions, Response } from "express";
import jwt from "jsonwebtoken";

config({ path: "./.env" });

export const cookieOptions = {
  maxAge: 15 * 24 * 60 * 60 * 1000,
  sameSite: "none",
  httpOnly: true,
  secure: true,
};

export const sendToken = (
  res: Response,
  user: { _id: string },
  code: number,
  message: string
) => {
  const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET!);
  return res
    .status(code)
    .cookie("social-chat-token", token, cookieOptions as CookieOptions)
    .json({
      success: true,
      user,
      message,
    });
};
