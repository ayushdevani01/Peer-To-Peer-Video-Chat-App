import jwt from "jsonwebtoken";
import User from "../models/User.js";
import rateLimit from "express-rate-limit";


export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests
  message: "Too many requests from this IP, please try again after 15 minutes",
});

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {

      token = req.headers.authorization.split(" ")[1];

      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Not authorized, no token provided",
        });
      }

      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (error) {
        if (error.name === "TokenExpiredError") {
          return res.status(401).json({
            success: false,
            message: "Session expired, please login again",
          });
        }
        return res.status(401).json({
          success: false,
          message: "Not authorized, invalid token",
        });
      }

      const user = await User.findById(decoded.id);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not found",
        });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error("Auth middleware error:", error);
      res.status(500).json({
        success: false,
        message: "Server error during authentication",
      });
    }
  } else {
    res.status(401).json({
      success: false,
      message: "Not authorized, no token",
    });
  }
};


export const guestOrAuth = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  const guestSession = req.headers["x-guest-session"];

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");

      if (user) {
        req.user = user;
        req.userType = "registered";
        return next();
      }
    } catch (error) {
      console.log("JWT validation failed, checking guest session");
    }
  }

  if (guestSession) {
    try {
      const guestData = JSON.parse(guestSession);

      if (
        guestData.type === "guest" &&
        guestData.sessionId &&
        guestData.displayName &&
        guestData.createdAt
      ) {
        req.guest = {
          sessionId: guestData.sessionId,
          displayName: guestData.displayName,
          createdAt: guestData.createdAt,
        };
        req.userType = "guest";
        return next();
      }
    } catch (error) {
      console.error("Guest session validation error:", error);
    }
  }

  return res.status(401).json({
    success: false,
    message: "Authentication required. Please login or continue as guest.",
  });
};
