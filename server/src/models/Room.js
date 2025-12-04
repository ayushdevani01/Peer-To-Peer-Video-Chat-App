import mongoose from "mongoose";

const participantSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  userType: {
    type: String,
    enum: ["guest", "registered"],
    required: true,
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
  leftAt: {
    type: Date,
  },
});

const roomSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    roomName: {
      type: String,
      required: true,
      trim: true,
    },
    ownerId: {
      type: String,
      required: true,
      index: true,
    },
    ownerType: {
      type: String,
      enum: ["guest", "registered"],
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    participants: [participantSchema],
    guestCreated: {
      type: Boolean,
      default: false,
    },
    autoDeleteAt: {
      type: Date,
    },
    lastActive: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true },
);

roomSchema.statics.findByRoomId = async function (roomId) {
  return await this.findOne({ roomId });
};

roomSchema.methods.updateLastActive = async function () {
  this.lastActive = Date.now();
  return this.save();
};


roomSchema.methods.addParticipant = async function (userId, userType) {
  const existingParticipant = this.participants.find(
    (p) => p.userId === userId && !p.leftAt,
  );

  if (!existingParticipant) {
    this.participants.push({
      userId,
      userType,
      joinedAt: Date.now(),
    });
  }

  this.lastActive = Date.now();
  return this.save();
};

roomSchema.methods.removeParticipant = async function (userId) {
  const participant = this.participants.find(
    (p) => p.userId === userId && !p.leftAt,
  );

  if (participant) {
    participant.leftAt = Date.now();
  }

  this.lastActive = Date.now();
  return this.save();
};

export default mongoose.model("Room", roomSchema);
