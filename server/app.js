import express from "express";
import { Server } from "socket.io";
import { createServer } from "http";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { connectDB } from "./src/config/db.js";
import authRoutes from "./src/routes/authRoutes.js";
import roomRoutes from "./src/routes/roomRoutes.js";
import RoomManager from "./src/utils/RoomManager.js";
import User from "./src/models/User.js";
import { sanitizeInput } from "./src/utils/sanitize.js";

dotenv.config();
connectDB().catch(err => console.error('MongoDB connection error:', err));

const port = process.env.PORT || 4000;
const host = '0.0.0.0'; // required for render
const app = express();

const corsOptions = {
  origin: process.env.CLIENT_URL,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-guest-session"],
};


app.use(cors(corsOptions));
app.use(express.json());


app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);

const server = createServer(app);
const io = new Server(server, {
  cors: corsOptions,
});


io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    const guestSession = socket.handshake.auth.guestSession;

    if (token) {

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (!user) {
        return next(new Error("User not found"));
      }

      socket.userId = user._id.toString();
      socket.username = user.name;
      socket.userType = "registered";
      socket.userEmail = user.email;
    } else if (guestSession) {

      try {
        const guestData = JSON.parse(guestSession);

        if (
          guestData.type === "guest" &&
          guestData.sessionId &&
          guestData.displayName
        ) {
          socket.userId = guestData.sessionId;
          socket.username = guestData.displayName;
          socket.userType = "guest";
        } else {
          return next(new Error("Invalid guest session"));
        }
      } catch (error) {
        return next(new Error("Invalid guest session format"));
      }
    } else {
      return next(new Error("Authentication required"));
    }

    console.log(
      `Socket authenticated: ${socket.username} (${socket.userType}) - ${socket.id}`,
    );
    next();
  } catch (error) {
    console.error("Socket authentication error:", error);
    next(new Error("Authentication failed"));
  }
});

// message rate limit per socket (user)
const messageRateLimits = new Map();

io.on("connection", (socket) => {
  console.log(
    `User connected: ${socket.username} (${socket.userType}) - ${socket.id}`,
  );

  messageRateLimits.set(socket.id, {
    count: 0,
    resetTime: Date.now() + 60000, // 1 min
  });

  socket.on("joinRoom", async ({ roomId, roomName, userId, username, userType, token }) => {
    try {
      socket.join(roomId);
      console.log(`User ${username} (${socket.id}) joined room ${roomId} as ${userType}`);

      const room = await RoomManager.joinRoom(
        socket.id,
        roomId,
        userId,
        username,
        userType
      );

      if (userType === "registered" && token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          const user = await User.findById(decoded.id);
          if (user) {
            const isOwner = room.ownerId === userId;
            await user.joinRoom(roomId, roomName, isOwner ? "owner" : "participant");
          }
        } catch (error) {
          console.error("Error updating user room participation:", error);
        }
      }

      const participants = RoomManager.getRoomParticipants(roomId);

      const existingUsers = participants
        .filter((p) => p.socketId !== socket.id)
        .map((p) => ({
          id: p.socketId,
          username: p.username,
          userType: p.userType,
        }));

      socket.emit("existing-users", existingUsers);

      socket.broadcast.to(roomId).emit("user-joined", {
        id: socket.id,
        username,
        userType,
      });
    } catch (error) {
      console.error("Join room error:", error);
      socket.emit("error", {
        message: "Failed to join room",
        code: "JOIN_ROOM_ERROR",
      });
    }
  });

  socket.on("message", ({ room, message, username }) => {
    const rateLimit = messageRateLimits.get(socket.id);
    const now = Date.now();

    if (now > rateLimit.resetTime) {
      rateLimit.count = 0;
      rateLimit.resetTime = now + 60000;
    }

    if (rateLimit.count >= 30) {
      socket.emit("error", {
        message: "Too many messages, please slow down",
        code: "RATE_LIMIT_EXCEEDED",
      });
      return;
    }

    rateLimit.count++;
    const sanitizedMessage = sanitizeInput(message);

    if (!sanitizedMessage || sanitizedMessage.length === 0) {
      return;
    }

    socket.to(room).emit("receiveMessage", {
      message: sanitizedMessage,
      username: socket.username,
      id: socket.id,
    });
  });



  socket.on("webrtc-offer", ({ offer, to, username }) => {
    io.to(to).emit("webrtc-offer", { offer, from: socket.id, username });
  });

  socket.on("webrtc-answer", ({ answer, to }) => {
    io.to(to).emit("webrtc-answer", { answer, from: socket.id });
  });

  socket.on("webrtc-ice-candidates", ({ candidate, to }) => {
    io.to(to).emit("webrtc-ice-candidates", { candidate, from: socket.id });
  });



  socket.on("disconnect", async () => {
    console.log(`${socket.id} disconnected!`);

    messageRateLimits.delete(socket.id);

    try {
      const result = await RoomManager.leaveRoom(socket.id);

      if (result) {
        socket.broadcast.to(result.roomId).emit("user-left", {
          socketID: socket.id,
        });
      }
    } catch (error) {
      console.error("Disconnect cleanup error:", error);
    }
  });
});

server.listen(port, host, () => {
  console.log(`Server is listening on ${host}:${port}`);
});
