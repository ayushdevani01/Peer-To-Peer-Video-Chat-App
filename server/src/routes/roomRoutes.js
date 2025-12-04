import express from "express";
import { body } from "express-validator";
import rateLimit from "express-rate-limit";
import {
  createRoom,
  getMeetingHistory,
} from "../controllers/roomController.js";
import { protect, guestOrAuth } from "../middleware/auth.js";

const router = express.Router();

const roomCreationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many rooms created, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});

const validateCreateRoom = [
  body("roomName")
    .trim()
    .notEmpty()
    .withMessage("Room name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Room name must be between 2 and 100 characters"),
];


router.post(
  "/create",
  roomCreationLimiter,
  guestOrAuth,
  validateCreateRoom,
  createRoom,
);

router.get("/history", protect, getMeetingHistory);

export default router;
