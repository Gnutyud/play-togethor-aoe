import { Room } from "../../shared/types";
import { useI18n } from "../config/i18n";
import { useStore } from "../store/useStore";
import UserAvatar from "./shared/UserAvatar";

interface RoomCardProps {
  room: Room;
  onJoin: (roomId: string) => void;
  onDelete?: (roomId: string) => void;
  isJoining: boolean;
}

export default function RoomCard({ room, onJoin, onDelete, isJoining }: RoomCardProps) {
  const { t } = useI18n();
  const { user } = useStore();
  const isDefault = room.type === "default";
  const isFull = room.playerCount >= room.maxPlayers;
  const isAdmin = user?.role === "admin";
  const isOwner = user?.id === room.ownerId;
  const canDelete = isAdmin || (isOwner && !isDefault);

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-5 border border-gray-800 hover:border-blue-500/50 hover:bg-gray-800/80 transition-all group shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
              {room.name}
            </h3>
            {isDefault && (
              <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-wider rounded border border-indigo-500/30">
                {t("default_room")}
              </span>
            )}
            {room.hasPassword && (
              <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-[10px] font-bold uppercase tracking-wider rounded border border-yellow-500/30">
                🔒 {t("password")}
              </span>
            )}
            {canDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm("Delete this room?")) onDelete?.(room.id);
                }}
                className="p-1 text-red-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                title="Delete Room"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
            <span className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${isFull ? 'bg-red-500' : 'bg-green-500'} animate-pulse`}></span>
              {isFull ? t("full") : t("waiting")}
            </span>
            <span className="flex items-center gap-1 bg-gray-800 px-2 py-0.5 rounded-full">
              👥 {room.playerCount} / {room.maxPlayers}
            </span>
          </div>
        </div>

        <button
          onClick={() => onJoin(room.id)}
          disabled={isFull || isJoining}
          className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all shadow-lg ${
            isFull
              ? "bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700"
              : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20 hover:shadow-blue-500/20 active:scale-95"
          } disabled:cursor-not-allowed`}
        >
          {isFull ? t("full") : isJoining ? "..." : t("join")}
        </button>
      </div>

      {room.players.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-800/50">
          <div className="flex -space-x-2 overflow-hidden hover:space-x-1 transition-all duration-300">
            {room.players.map((player) => (
              <div 
                key={player.userId}
                title={player.username}
                className="ring-2 ring-gray-900 rounded-full"
              >
                <UserAvatar username={player.username} size={7} />
              </div>
            ))}
            {room.playerCount > room.players.length && (
              <div className="w-7 h-7 rounded-full bg-gray-800 border-2 border-gray-900 flex items-center justify-center text-[10px] text-gray-400">
                +{room.playerCount - room.players.length}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
