import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPlayer {
  userId: string;
  username: string;
  lastSeen: Date;
}

export interface IRoom extends Document {
  type: "default" | "custom";
  name: string;
  password?: string; // bcrypt hash (optional for custom rooms)
  maxPlayers: number;
  players: IPlayer[];
  radminNetworkId: string;
  radminNetworkPassword: string;
  ownerId?: string; // Only for custom rooms
  createdAt: Date;
  lastActivity: Date;
  lastHeartbeat: Date;
  updatedAt: Date;

  // Instance methods
  addPlayer(userId: string, username: string): void;
  removePlayer(userId: string): void;
  updatePlayerHeartbeat(userId: string): void;
  updateHeartbeat(): void;
}

const PlayerSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const RoomSchema: Schema<IRoom> = new Schema(
  {
    type: {
      type: String,
      enum: ["default", "custom"],
      required: true,
      default: "custom",
    },
    name: {
      type: String,
      required: [true, "Room name is required"],
      trim: true,
      maxlength: [50, "Room name must be less than 50 characters"],
    },
    password: {
      type: String,
      default: null,
    },
    maxPlayers: {
      type: Number,
      default: 8,
      min: [2, "Room must allow at least 2 players"],
      max: [8, "Room cannot exceed 8 players"],
    },
    players: {
      type: [PlayerSchema],
      default: [],
      validate: {
        validator: function (players: IPlayer[]) {
          return players.length <= this.maxPlayers;
        },
        message: "Cannot exceed maximum players",
      },
    },
    radminNetworkId: {
      type: String,
      required: [true, "Radmin network ID is required"],
    },
    radminNetworkPassword: {
      type: String,
      required: [true, "Radmin network password is required"],
    },
    ownerId: {
      type: String,
      default: null,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    lastHeartbeat: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
RoomSchema.index({ type: 1 });
RoomSchema.index({ "players.userId": 1 });
RoomSchema.index({ lastActivity: 1 });
RoomSchema.index({ lastHeartbeat: 1 });

// Virtual for current player count
RoomSchema.virtual("playerCount").get(function () {
  return this.players.length;
});

// Virtual for isFull
RoomSchema.virtual("isFull").get(function () {
  return this.players.length >= this.maxPlayers;
});

// Method to add player
RoomSchema.methods.addPlayer = function (userId: string, username: string) {
  if (this.isFull) {
    throw new Error("Room is full");
  }

  // Check if player already in room
  const existingPlayer = this.players.find((p: IPlayer) => p.userId === userId);
  if (existingPlayer) {
    // Update lastSeen
    existingPlayer.lastSeen = new Date();
  } else {
    this.players.push({
      userId,
      username,
      lastSeen: new Date(),
    });
  }

  this.lastActivity = new Date();
};

// Method to remove player
RoomSchema.methods.removePlayer = function (userId: string) {
  this.players = this.players.filter((p: IPlayer) => p.userId !== userId);
  this.lastActivity = new Date();
};

// Method to update player heartbeat
RoomSchema.methods.updatePlayerHeartbeat = function (userId: string) {
  const player = this.players.find((p: IPlayer) => p.userId === userId);
  if (player) {
    player.lastSeen = new Date();
    this.lastActivity = new Date();
  }
};

// Method to update room-level heartbeat
RoomSchema.methods.updateHeartbeat = function () {
  this.lastHeartbeat = new Date();
  this.lastActivity = new Date();
};

const Room: Model<IRoom> =
  mongoose.models.Room || mongoose.model<IRoom>("Room", RoomSchema);

export default Room;
