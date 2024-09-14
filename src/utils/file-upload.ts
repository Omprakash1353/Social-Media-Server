import { v4 as uuid } from "uuid";
import { v2 as cloudinary } from "cloudinary";

import { getBase64 } from "../lib/helper.js";

export const uploadFilesToCloudinary = async (files = []) => {
  const uploadPromises = files.map((file) => {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        getBase64(file),
        {
          resource_type: "auto",
          public_id: uuid(),
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
    });
  });

  try {
    const results = await Promise.all(uploadPromises);

    const formattedResults = results.map((result: any) => ({
      public_id: result.public_id,
      secure_url: result.secure_url,
    }));
    return formattedResults;
  } catch (err: any) {
    throw new Error("Error uploading files to cloudinary" + err);
  }
};

export const deletFilesFromCloudinary = async (public_ids: []) => {
  // Delete files from cloudinary
};