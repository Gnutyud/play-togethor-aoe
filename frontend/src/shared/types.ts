/**
 * Shared TypeScript types between main and renderer processes
 */

export interface User {
  id: string;
  username: string;
  role: "user" | "admin";
  currentRoomId?: string;
}

export interface Player {
  userId: string;
  username: string;
}

export interface Room {
  id: string;
  type: "default" | "custom";
  name: string;
  hasPassword: boolean;
  maxPlayers: number;
  playerCount: number;
  isFull: boolean;
  players: Player[];
  ownerId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface RoomWithNetwork extends Room {
  p2pCommunity: string;
  p2pPassword?: string;
}

export interface GameConfig {
  gamePath: string;
  playerName: string;
  roomId: string;
  enableMultiplayer?: boolean;
  windowMode?: boolean;
  resolution?: string;
}

export interface DependencyStatus {
  p2pNetwork: {
    installed: boolean;
    hasDriver: boolean;
    binaryPath?: string;
  };
  aoeGame: {
    installed: boolean;
    path?: string;
    version?: string;
  };
}

export interface P2PConnection {
  connected: boolean;
  virtualIp?: string;
  community?: string;
  error?: string;
}

// API Response types
export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RoomsResponse {
  rooms: Room[];
}

export interface JoinRoomResponse {
  room: RoomWithNetwork;
}
