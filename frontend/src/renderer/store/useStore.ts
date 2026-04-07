import { create } from "zustand";
import {
  User,
  Room,
  RoomWithNetwork,
  RadminVpnConnection,
} from "../../shared/types";

type Language = "vi" | "en";

interface AppState {
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;

  // Rooms
  rooms: Room[];
  currentRoom: RoomWithNetwork | null;
  setRooms: (rooms: Room[]) => void;
  setCurrentRoom: (room: RoomWithNetwork | null) => void;
  updateRoom: (roomId: string, updates: Partial<Room>) => void;

  // VPN
  vpnConnection: RadminVpnConnection | null;
  setVpnConnection: (connection: RadminVpnConnection | null) => void;

  // UI State
  isCreatingRoom: boolean;
  setIsCreatingRoom: (isCreating: boolean) => void;

  // Polling
  isPolling: boolean;
  setIsPolling: (isPolling: boolean) => void;
  lastUpdate: string | null;
  setLastUpdate: (timestamp: string) => void;
  lang: Language;
  setLang: (lang: Language) => void;
}

export const useStore = create<AppState>((set) => ({
  // Auth
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),

  // Rooms
  rooms: [],
  currentRoom: null,
  setRooms: (rooms) => set({ rooms }),
  setCurrentRoom: (room) => set({ currentRoom: room }),
  updateRoom: (roomId, updates) =>
    set((state) => ({
      rooms: state.rooms.map((room) =>
        room.id === roomId ? { ...room, ...updates } : room
      ),
    })),

  // VPN
  vpnConnection: null,
  setVpnConnection: (connection) => set({ vpnConnection: connection }),

  // UI State
  isCreatingRoom: false,
  setIsCreatingRoom: (isCreating) => set({ isCreatingRoom: isCreating }),

  // Polling
  isPolling: false,
  setIsPolling: (isPolling) => set({ isPolling }),
  lastUpdate: null,
  setLastUpdate: (timestamp) => set({ lastUpdate: timestamp }),
  lang: "vi",
  setLang: (lang) => set({ lang }),
}));
