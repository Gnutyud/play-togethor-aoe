import { Room } from "../../shared/types";

interface RoomCardProps {
  room: Room;
  onJoin: (roomId: string) => void;
  isJoining: boolean;
}

export default function RoomCard({ room, onJoin, isJoining }: RoomCardProps) {
  const isDefault = room.type === "default";

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-blue-600 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-white">{room.name}</h3>
            {isDefault && (
              <span className="px-2 py-0.5 bg-green-600 text-white text-xs rounded-full">
                Public
              </span>
            )}
            {room.hasPassword && (
              <span className="px-2 py-0.5 bg-yellow-600 text-white text-xs rounded-full">
                🔒 Private
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span>
              👥 {room.playerCount}/{room.maxPlayers}
            </span>
          </div>
        </div>

        <button
          onClick={() => onJoin(room.id)}
          disabled={room.isFull || isJoining}
          className={`px-4 py-2 rounded font-medium transition-colors ${
            room.isFull
              ? "bg-gray-600 text-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          } disabled:cursor-not-allowed`}
        >
          {room.isFull ? "Full" : isJoining ? "Joining..." : "Join"}
        </button>
      </div>

      {room.players.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-700">
          <div className="flex flex-wrap gap-2">
            {room.players.map((player) => (
              <div
                key={player.userId}
                className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300"
              >
                {player.username}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
