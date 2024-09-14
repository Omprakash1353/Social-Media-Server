import { NextFunction, Request, Response } from "express";

import { envMode } from "../app.js";
import { ErrorHandler } from "../utils/utility-class.js";

const errorMiddleware = (
  err: ErrorHandler & { keyPattern: any; path: string },
  req: Request,
  res: Response,
  next: NextFunction
) => {
  err.message ||= "Internal Server Error";
  err.statusCode ||= 500;

  if (err.statusCode === 11000) {
    const error = Object.keys(err?.keyPattern).join(",");
    err.message = `Duplicate field - ${error}`;
    err.statusCode = 400;
  }

  if (err.name === "CastError") {
    const errorPath = err?.path;
    err.message = `Invalid Format of ${errorPath}`;
    err.statusCode = 400;
  }

  const response: {
    success: boolean;
    message: string;
    error?: any;
  } = {
    success: false,
    message: err.message,
  };

  if (envMode === "DEVELOPMENT") {
    response.error = err;
  }

  return res.status(err.statusCode).json(response);
};

const TryCatch =
  (passedFunc: (req: Request, res: Response, next: NextFunction) => object) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await passedFunc(req, res, next);
    } catch (error) {
      next(error);
    }
  };

export { TryCatch, errorMiddleware };
