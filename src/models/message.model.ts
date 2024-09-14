import { Schema, model, Types, Document } from "mongoose";

export interface Message extends Document {
  content: string;
  attachments: { public_id: string; asset_id: string; secure_url: string }[];
  sender: Types.ObjectId;
  chat: Types.ObjectId;
}

const schema = new Schema(
  {
    content: String,
    attachments: [
      {
        public_id: String,
        asset_id: String,
        secure_url: String,
      },
    ],
    sender: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    chat: {
      type: Types.ObjectId,
      ref: "Chat",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const MessageModel = model<Message>("Message", schema);
