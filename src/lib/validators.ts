import { body, param, validationResult } from "express-validator";
import { ErrorHandler } from "../utils/utility-class.js";
import { NextFunction, Request, Response } from "express";

const validateHandler = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);

  const errorMessages = errors
    .array()
    .map((error) => error.msg)
    .join(", ");

  if (errors.isEmpty()) return next();
  else next(new ErrorHandler(errorMessages, 400));
};

const newGroupValidator = () => [
  body("name", "Please Enter Name").notEmpty(),
  body("members")
    .notEmpty()
    .withMessage("Please Enter Members")
    .isArray({ min: 1, max: 100 })
    .withMessage("Members must be 1-100"),
];

const addMemberValidator = () => [
  body("chatId", "Please Enter Chat ID").notEmpty(),
  body("members")
    .notEmpty()
    .withMessage("Please Enter Members")
    .isArray({ min: 1, max: 97 })
    .withMessage("Members must be 1-97"),
];

const removeMemberValidator = () => [
  body("chatId", "Please Enter Chat ID").notEmpty(),
  body("members")
    .notEmpty()
    .withMessage("Please Enter Members")
    .isArray({ min: 1, max: 97 })
    .withMessage("Members must be 1-97"),
];

const sendAttachmentsValidator = () => [
  body("chatId", "Please Enter Chat ID").notEmpty(),
];

const chatIdValidator = () => [
  param("chatId", "Please Enter Chat ID").notEmpty(),
  body("userId", "UserId is missing").notEmpty(),
];

const renameValidator = () => [
  param("chatId", "Please Enter Chat ID").notEmpty(),
  body("name", "Please Enter New Name").notEmpty(),
];

export {
  validateHandler,
  newGroupValidator,
  addMemberValidator,
  removeMemberValidator,
  sendAttachmentsValidator,
  chatIdValidator,
  renameValidator,
};
