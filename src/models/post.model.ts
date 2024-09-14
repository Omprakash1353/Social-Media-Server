import { model, Schema, Document, models, Types, Model } from "mongoose";

export interface IPost extends Document {
  post_Type: "STORY" | "POST" | "REEL";
  caption?: string;
  location?: string;
  media?: {
    public_id: string;
    secure_url: string;
    asset_id: string;
    blur_url?: string;
  }[];
  hashTags?: string[];
  likes?: Types.ObjectId[];
  saved?: Types.ObjectId[];
  tagged?: Types.ObjectId[];
  isCommentOn: boolean;
  comments?: {
    parentId: Types.ObjectId;
    children: Types.ObjectId[];
    content: string;
  }[];
  isLikesAndCommentVisible: boolean;
  expiryTime: Date;
  isArchived: boolean;
  updatedAt: Date;
  createdAt: Date;
}

const schema = new Schema<IPost>(
  {
    post_Type: {
      type: String,
      enum: ["STORY", "POST", "REEL"],
    },
    caption: { type: String, required: false },
    location: { type: String, required: false },
    media: [
      {
        public_id: String,
        secure_url: String,
        asset_id: String,
        blur_url: String,
      },
    ],
    hashTags: [{ type: String, required: false }],
    likes: [{ type: Types.ObjectId, ref: "User" }],
    saved: [{ type: Types.ObjectId, ref: "User" }],
    tagged: [{ type: Types.ObjectId, ref: "User" }],
    isCommentOn: { type: Boolean, default: true },
    isLikesAndCommentVisible: { type: Boolean, default: true },
    comments: [
      {
        parentId: { type: Types.ObjectId, ref: "User" },
        children: [{ type: Types.ObjectId, ref: "User" }],
        content: String,
      },
    ],
    expiryTime: {
      type: Date,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

schema.pre<IPost>("save", function (next) {
  if (this.isNew && this.post_Type === "STORY" && !this.expiryTime) {
    this.expiryTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
  }
  next();
});

export const PostModel =
  (models?.Post as Model<IPost>) || model<IPost>("Post", schema);
