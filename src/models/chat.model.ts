import { Schema, model, Types, Document } from "mongoose";

export interface Chat extends Document {
  name: string;
  groupChat: boolean;
  creator: Types.ObjectId;
  members: Types.ObjectId[];
}

const schema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    groupChat: {
      type: Boolean,
      default: false,
    },
    creator: {
      type: Types.ObjectId,
      ref: "User",
    },
    admins: [
      {
        type: Types.ObjectId,
        ref: "User",
      },
    ],
    members: [
      {
        type: Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const ChatModel = model<Chat>("Chat", schema);
