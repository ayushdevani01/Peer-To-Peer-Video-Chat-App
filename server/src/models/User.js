import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const roomParticipationSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
  },
  roomName: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["owner", "participant"],
    default: "participant",
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
  lastActive: {
    type: Date,
    default: Date.now,
  },
});

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      match: [/\S+@\S+\.\S+/, "Please add a valid email"],
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    rooms: [roomParticipationSchema],
  },
  { timestamps: true },
);


userSchema.index({ email: 1, createdAt: -1 });
userSchema.index({ "rooms.lastActive": -1 });


userSchema.methods.joinRoom = function (
  roomId,
  roomName,
  role = "participant",
) {
  const existingRoom = this.rooms.find((room) => room.roomId === roomId);

  if (existingRoom) {
    existingRoom.lastActive = Date.now();
  } else {
    this.rooms.push({
      roomId,
      roomName,
      role,
      joinedAt: Date.now(),
      lastActive: Date.now(),
    });
  }

  return this.save();
};


userSchema.methods.getRooms = function () {
  return this.rooms.sort((a, b) => b.lastActive - a.lastActive);
};


userSchema.methods.isRoomOwner = function (roomId) {
  const room = this.rooms.find((r) => r.roomId === roomId);
  return room ? room.role === "owner" : false;
};

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "30d",
  });
};


userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("User", userSchema);
