import { v4 as uuidv4 } from "uuid";
import Room from "../models/Room.js";
import RoomManager from "../utils/RoomManager.js";


export const createRoom = async (req, res) => {
  try {
    const { roomName } = req.body;

    if (!roomName || roomName.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Room name is required",
      });
    }

    let ownerId, ownerType;
    if (req.userType === "registered" && req.user) {
      ownerId = req.user._id.toString();
      ownerType = "registered";
    } else if (req.userType === "guest" && req.guest) {
      ownerId = req.guest.sessionId;
      ownerType = "guest";
    } else {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const roomId = uuidv4();

    await RoomManager.createRoom(roomId, roomName.trim(), ownerId, ownerType);

    if (ownerType === "registered") {
      await req.user.joinRoom(roomId, roomName.trim(), "owner");
    }

    const shareLink = `${process.env.CLIENT_URL || "http://localhost:5173"}/room/${roomId}`;

    res.status(201).json({
      success: true,
      data: {
        roomId,
        roomName: roomName.trim(),
        shareLink,
        ownerType,
      },
    });
  } catch (error) {
    console.error("Create room error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create room",
      error: error.message,
    });
  }
};

export const getMeetingHistory = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { limit = 50, offset = 0 } = req.query;

    const rooms = req.user.getRooms();

    const paginatedRooms = rooms.slice(
      parseInt(offset),
      parseInt(offset) + parseInt(limit),
    );

    const roomIds = paginatedRooms.map((r) => r.roomId);
    const dbRooms = await Room.find({ roomId: { $in: roomIds } })
      .lean()
      .select("roomId isActive participants");

    const roomMap = new Map(dbRooms.map((r) => [r.roomId, r]));

    const enrichedRooms = paginatedRooms.map((room) => {
      const dbRoom = roomMap.get(room.roomId);
      return {
        roomId: room.roomId,
        roomName: room.roomName,
        role: room.role,
        joinedAt: room.joinedAt,
        lastActive: room.lastActive,
        isActive: dbRoom.isActive,
        participantCount: dbRoom
          ? dbRoom.participants.filter((p) => !p.leftAt).length
          : 0,
      };
    });

    res.status(200).json({
      success: true,
      count: enrichedRooms.length,
      total: rooms.length,
      data: enrichedRooms,
    });
  } catch (error) {
    console.error("Get meeting history error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch meeting history",
      error: error.message,
    });
  }
};
