import { useState } from "react";
import { useI18n } from "../config/i18n";
import { useAuth } from "../hooks/useAuth";

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (
    name: string,
    p2pPassword?: string,
    password?: string,
    type?: string
  ) => Promise<void>;
}

export default function CreateRoomModal({
  isOpen,
  onClose,
  onCreate,
}: CreateRoomModalProps) {
  const { t } = useI18n();
  const { user } = useAuth();
  const [roomName, setRoomName] = useState("");
  const [p2pPassword, setP2pPassword] = useState("");
  const [roomType, setRoomType] = useState<"custom" | "default">("custom");
  const [password, setPassword] = useState("");
  const [usePassword, setUsePassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!roomName.trim()) {
      setError(t("room_name") + " is required");
      return;
    }

    if (usePassword && !password.trim()) {
      setError("Password is required when room is private");
      return;
    }

    setLoading(true);

    try {
      await onCreate(
        roomName,
        p2pPassword || undefined,
        usePassword ? password : undefined,
        user?.role === "admin" ? roomType : undefined
      );

      // Reset form and close
      setRoomName("");
      setP2pPassword("");
      setPassword("");
      setUsePassword(false);
      setRoomType("custom");
      onClose();
    } catch (err: any) {
      setError(
        err.response?.data?.error || err.message || "Failed to create room"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setRoomName("");
      setP2pPassword("");
      setPassword("");
      setUsePassword(false);
      setError("");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <span className="w-2 h-8 bg-blue-500 rounded-full"></span>
          {t("create_room")}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              {t("room_name")}
            </label>
            <input
              type="text"
              autoFocus
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 hover:bg-gray-700/50 transition-all placeholder-gray-600"
              placeholder={t("room_name")}
              disabled={loading}
              maxLength={50}
            />
          </div>

          {user?.role === "admin" && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                {t("room_type")}
              </label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setRoomType("custom")}
                  className={`flex-1 py-2 rounded-lg border text-xs font-bold transition-all ${
                    roomType === "custom"
                      ? "bg-indigo-600 border-indigo-500 text-white"
                      : "bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700"
                  }`}
                >
                  {t("custom_type")}
                </button>
                <button
                  type="button"
                  onClick={() => setRoomType("default")}
                  className={`flex-1 py-2 rounded-lg border text-xs font-bold transition-all ${
                    roomType === "default"
                      ? "bg-blue-600 border-blue-500 text-white"
                      : "bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700"
                  }`}
                >
                  {t("default_type")}
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 py-1">
            <input
              type="checkbox"
              id="privateNetwork"
              checked={!!p2pPassword}
              onChange={(e) => setP2pPassword(e.target.checked ? "secured_mesh" : "")}
              className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-indigo-600 focus:ring-offset-gray-900"
              disabled={loading}
            />
            <label htmlFor="privateNetwork" className="text-sm text-gray-300 select-none font-bold">
               Enable Encrypted P2P Grid
            </label>
          </div>

          <div className="flex items-center gap-2 py-1">
            <input
              type="checkbox"
              id="usePassword"
              checked={usePassword}
              onChange={(e) => setUsePassword(e.target.checked)}
              className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-blue-600 focus:ring-offset-gray-900"
              disabled={loading}
            />
            <label htmlFor="usePassword" className="text-sm text-gray-300 select-none">
              Private room (In-app password)
            </label>
          </div>

          {usePassword && (
            <div className="animate-in fade-in slide-in-from-top-1 duration-200">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                {t("password")}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                placeholder={t("password")}
                disabled={loading}
              />
            </div>
          )}

          {error && (
            <div className="bg-red-900/30 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-xs animate-pulse">
              {error}
            </div>
          )}

          <div className="flex gap-4 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-lg shadow-lg shadow-blue-900/20 transition-all disabled:bg-gray-700 disabled:shadow-none"
            >
              {loading ? "..." : t("create")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
