import Room from "../models/Room.js";

class RoomManager {
  constructor() {
    this.activeRooms = new Map(); // roomId -> room data
    this.socketToRoom = new Map(); // socketId -> roomId
    this.guestSessions = new Map(); // sessionId -> guest data
    this.cleanupTimers = new Map(); // roomId -> timeout reference
  }


  async createRoom(roomId, roomName, ownerId, ownerType) {
    const roomData = {
      roomId,
      roomName,
      ownerId,
      ownerType,
      participants: new Map(),
      createdAt: new Date(),
      guestCreated: ownerType === "guest",
    };


    this.activeRooms.set(roomId, roomData);

    if (ownerType === "registered") {
      await Room.create({
        roomId,
        roomName,
        ownerId,
        ownerType,
        guestCreated: false,
        isActive: true,
      });
    } else {
      await Room.create({
        roomId,
        roomName,
        ownerId,
        ownerType,
        guestCreated: true,
        isActive: true,
      });
    }

    return roomData;
  }


  async joinRoom(socketId, roomId, userId, username, userType) {
    let room = this.activeRooms.get(roomId);

    if (!room) {
      const dbRoom = await Room.findByRoomId(roomId);
      if (dbRoom) {
        room = {
          roomId: dbRoom.roomId,
          roomName: dbRoom.roomName,
          ownerId: dbRoom.ownerId,
          ownerType: dbRoom.ownerType,
          participants: new Map(),
          createdAt: dbRoom.createdAt,
          guestCreated: dbRoom.guestCreated,
        };
        this.activeRooms.set(roomId, room);

        dbRoom.isActive = true;
        await dbRoom.save();
      }
    }

    if (!room) {
      throw new Error("Room not found");
    }

    // Cancel cleanup timer if room was scheduled for deletion
    if (this.cleanupTimers.has(roomId)) {
      clearTimeout(this.cleanupTimers.get(roomId));
      this.cleanupTimers.delete(roomId);
    }

    room.participants.set(socketId, {
      userId,
      username,
      userType,
      joinedAt: new Date(),
    });

    this.socketToRoom.set(socketId, roomId);

    const dbRoom = await Room.findByRoomId(roomId);
    if (dbRoom) {
      await dbRoom.addParticipant(userId, userType);
    }

    return room;
  }


  async leaveRoom(socketId) {
    const roomId = this.socketToRoom.get(socketId);
    if (!roomId) return null;

    const room = this.activeRooms.get(roomId);
    if (!room) return null;

    const participant = room.participants.get(socketId);
    if (participant) {

      room.participants.delete(socketId);

      const dbRoom = await Room.findByRoomId(roomId);
      if (dbRoom) {
        await dbRoom.removeParticipant(participant.userId);
      }
    }

    this.socketToRoom.delete(socketId);

    if (this.isRoomEmpty(roomId)) {
      this.scheduleRoomCleanup(roomId);
    }

    return { roomId, room, participant };
  }


  getRoomParticipants(roomId) {
    const room = this.activeRooms.get(roomId);
    if (!room) return [];

    return Array.from(room.participants.entries()).map(([socketId, data]) => ({
      socketId,
      ...data,
    }));
  }

  isRoomEmpty(roomId) {
    const room = this.activeRooms.get(roomId);
    return !room || room.participants.size === 0;
  }


  scheduleRoomCleanup(roomId) {
    if (this.cleanupTimers.has(roomId)) {
      clearTimeout(this.cleanupTimers.get(roomId));
    }

    const timer = setTimeout(async () => {
      const room = this.activeRooms.get(roomId);

      if (room && this.isRoomEmpty(roomId)) {
        this.activeRooms.delete(roomId);
        this.cleanupTimers.delete(roomId);

        if (room.guestCreated) {
          await Room.deleteOne({ roomId });
          console.log(`Guest room ${roomId} deleted from DB after timeout`);
        } else {
          console.log(`Registered room ${roomId} removed from memory after timeout`);
        }
      }
    }, 5 * 60 * 1000); // 5 minutes

    this.cleanupTimers.set(roomId, timer);
  }

  registerGuestSession(sessionId, displayName, socketId) {
    this.guestSessions.set(sessionId, {
      displayName,
      socketId,
      createdAt: new Date(),
    });
  }

  getGuestSession(sessionId) {
    return this.guestSessions.get(sessionId) || null;
  }

  removeGuestSession(sessionId) {
    this.guestSessions.delete(sessionId);
  }

  getRoomBySocket(socketId) {
    return this.socketToRoom.get(socketId) || null;
  }

  getRoom(roomId) {
    return this.activeRooms.get(roomId) || null;
  }
}


export default new RoomManager();
