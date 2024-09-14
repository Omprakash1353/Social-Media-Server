import { Document, Schema, Types, model } from "mongoose";

export interface User extends Document {
  name: string;
  email: string;
  bio: string;
  username: string;
  password?: string;
  role: "USER" | "ADMIN";
  avatar?: {
    public_url: string;
    secure_url: string;
    asset_id: string;
    blur_url: string;
  };
  account_Type: "PUBLIC" | "PRIVATE" | "BUSINESS";
  gender: "MALE" | "FEMALE";
  googleId?: string;
  githubId?: string;
  followers?: Types.ObjectId[];
  followings?: Types.ObjectId[];
  posts?: Types.ObjectId[];
  searchHistory?: string[];
  lastOnlineTime: Date;
}

const schema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    bio: {
      type: String,
    },
    username: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      select: false,
    },
    role: {
      type: String,
      enum: ["USER", "ADMIN"],
      default: "USER",
    },
    avatar: {
      public_url: String,
      secure_url: String,
      asset_id: String,
      blur_url: String,
    },
    account_Type: {
      type: String,
      enum: ["PUBLIC", "PRIVATE", "BUSINESS"],
      default: "PUBLIC",
    },
    gender: {
      type: String,
      enum: ["MALE", "FEMALE"],
    },
    googleId: String,
    githubId: String,
    posts: [{ type: Types.ObjectId, ref: "Post" }],
    searchHistory: [{ type: String }],
    followers: [{ type: Types.ObjectId, ref: "User" }],
    followings: [{ type: Types.ObjectId, ref: "User" }],
    lastOnlineTime: Date,
  },
  {
    timestamps: true,
  }
);

export const UserModel = model<User>("User", schema);
