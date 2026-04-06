import { useEffect, useCallback, useRef } from "react";
import { useStore } from "../store/useStore";
import { api } from "../services/api";
import { APP_CONFIG } from "../config/constants";

export function useRooms() {
  const {
    rooms,
    currentRoom,
    setRooms,
    setCurrentRoom,
    isPolling,
    setIsPolling,
    lastUpdate,
    setLastUpdate,
  } = useStore();

  const sseRef = useRef<EventSource | null>(null);
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  // Fetch rooms
  const fetchRooms = useCallback(async () => {
    try {
      const fetchedRooms = await api.getRooms();
      setRooms(fetchedRooms);
      setLastUpdate(new Date().toISOString());
    } catch (error) {
      console.error("Failed to fetch rooms:", error);
    }
  }, [setRooms, setLastUpdate]);

  // Start SSE for room updates
  const startSSE = useCallback(() => {
    if (sseRef.current) return;

    setIsPolling(true); // Re-using isPolling to indicate "Realtime Active"
    
    // Initial fetch to be sure
    fetchRooms();

    const url = api.getRoomsEventSourceUrl();
    const eventSource = new EventSource(url);
    sseRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'rooms_update') {
          setRooms(data.rooms);
          setLastUpdate(new Date().toISOString());
        }
      } catch (err) {
        console.error("Failed to parse SSE message:", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("SSE Error:", err);
      eventSource.close();
      sseRef.current = null;
      setIsPolling(false);
      
      // Auto-reconnect after 5 seconds
      setTimeout(() => {
        if (!sseRef.current) {
          startSSE();
        }
      }, 5000);
    };
  }, [fetchRooms, setIsPolling, setRooms, setLastUpdate]);

  // Start polling (now SSE)
  const startPolling = useCallback(() => {
    startSSE();
  }, [startSSE]);

  // Stop polling (SSE)
  const stopPolling = useCallback(() => {
    setIsPolling(false);

    if (sseRef.current) {
      sseRef.current.close();
      sseRef.current = null;
    }
  }, [setIsPolling]);

  // Start heartbeat when in a room
  const startHeartbeat = useCallback(() => {
    if (!currentRoom || heartbeatIntervalRef.current) return;

    // Send heartbeat every 30 seconds
    heartbeatIntervalRef.current = setInterval(async () => {
      if (currentRoom) {
        try {
          await api.sendHeartbeat(currentRoom.id);
        } catch (error) {
          console.error("Heartbeat failed:", error);
        }
      }
    }, APP_CONFIG.HEARTBEAT_INTERVAL);
  }, [currentRoom]);

  // Stop heartbeat
  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  // Join room
  const joinRoom = useCallback(
    async (roomId: string, password?: string) => {
      const room = await api.joinRoom(roomId, password);
      setCurrentRoom(room);
      startHeartbeat();
      return room;
    },
    [setCurrentRoom, startHeartbeat]
  );

  // Leave room
  const leaveRoom = useCallback(async () => {
    if (!currentRoom) return;

    try {
      await api.leaveRoom(currentRoom.id);
      setCurrentRoom(null);
      stopHeartbeat();
    } catch (error) {
      console.error("Failed to leave room:", error);
      throw error;
    }
  }, [currentRoom, setCurrentRoom, stopHeartbeat]);

  // Create room
  const createRoom = useCallback(
    async (
      name: string,
      radminNetworkId: string,
      radminNetworkPassword: string,
      password?: string
    ) => {
      const room = await api.createRoom(
        name,
        radminNetworkId,
        radminNetworkPassword,
        password
      );
      await fetchRooms(); // Refresh room list
      return room;
    },
    [fetchRooms]
  );

  // Delete room (owner only)
  const deleteRoom = useCallback(
    async (roomId: string) => {
      await api.deleteRoom(roomId);
      await fetchRooms(); // Refresh room list
    },
    [fetchRooms]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
      stopHeartbeat();
    };
  }, [stopPolling, stopHeartbeat]);

  return {
    rooms,
    currentRoom,
    isPolling,
    lastUpdate,
    fetchRooms,
    startPolling,
    stopPolling,
    joinRoom,
    leaveRoom,
    createRoom,
    deleteRoom,
  };
}
