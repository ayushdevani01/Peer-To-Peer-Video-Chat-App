import express from "express";
import { body } from "express-validator";
import {
  register,
  login,
  getUserProfile,
} from "../controllers/authController.js";
import { protect, authLimiter } from "../middleware/auth.js";

const router = express.Router();

const validateRegister = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),
  body("email")
    .trim()
    .isEmail()
    .withMessage("Please include a valid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
];

const validateLogin = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Please include a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
];



router.use(authLimiter);

router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);

router.use(protect);
router.route("/profile").get(getUserProfile);

export default router;
