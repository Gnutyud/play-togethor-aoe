import { useState, useEffect } from "react";
import { useRooms } from "../hooks/useRooms";
import { useAuth } from "../hooks/useAuth";
import RoomCard from "../components/RoomCard";
import CreateRoomModal from "../components/CreateRoomModal";
import JoinRoomModal from "../components/JoinRoomModal";

export default function RoomListView() {
  const { user, logout } = useAuth();
  const { rooms, startPolling, stopPolling, joinRoom, createRoom } = useRooms();

  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [joinRoomId, setJoinRoomId] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    startPolling();
    return () => stopPolling();
  }, [startPolling, stopPolling]);

  const handleJoinRoom = async (roomId: string) => {
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return;

    // If room has password, show password modal
    if (room.hasPassword) {
      setJoinRoomId(roomId);
      return;
    }

    // Join directly
    setIsJoining(true);
    try {
      await joinRoom(roomId);
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to join room");
    } finally {
      setIsJoining(false);
    }
  };

  const handleJoinWithPassword = async (password: string) => {
    if (!joinRoomId) return;

    await joinRoom(joinRoomId, password);
    setJoinRoomId(null);
  };

  const handleCreateRoom = async (name: string, password?: string) => {
    await createRoom(name, password);
  };

  const defaultRooms = rooms.filter((r) => r.type === "default");
  const customRooms = rooms.filter((r) => r.type === "custom");

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">AOE Launcher</h1>
            <p className="text-sm text-gray-400">Welcome, {user?.username}!</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCreatingRoom(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-medium"
            >
              + Create Room
            </button>
            <button
              onClick={logout}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Room List */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Default Rooms */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Public Rooms</h2>
          {defaultRooms.length === 0 ? (
            <p className="text-gray-500">No public rooms available</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {defaultRooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  onJoin={handleJoinRoom}
                  isJoining={isJoining}
                />
              ))}
            </div>
          )}
        </div>

        {/* Custom Rooms */}
        {customRooms.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Custom Rooms</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customRooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  onJoin={handleJoinRoom}
                  isJoining={isJoining}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateRoomModal
        isOpen={isCreatingRoom}
        onClose={() => setIsCreatingRoom(false)}
        onCreate={handleCreateRoom}
      />

      <JoinRoomModal
        isOpen={!!joinRoomId}
        roomName={rooms.find((r) => r.id === joinRoomId)?.name || ""}
        onClose={() => setJoinRoomId(null)}
        onJoin={handleJoinWithPassword}
      />
    </div>
  );
}
