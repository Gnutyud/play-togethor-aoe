import { useState } from "react";
import { useI18n } from "../config/i18n";

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (
    name: string,
    radminId: string,
    radminPass: string,
    password?: string
  ) => Promise<void>;
}

export default function CreateRoomModal({
  isOpen,
  onClose,
  onCreate,
}: CreateRoomModalProps) {
  const { t } = useI18n();
  const [roomName, setRoomName] = useState("");
  const [radminId, setRadminId] = useState("");
  const [radminPass, setRadminPass] = useState("");
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

    if (!radminId.trim() || !radminPass.trim()) {
      setError("Radmin Network ID and Password are required");
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
        radminId,
        radminPass,
        usePassword ? password : undefined
      );

      // Reset form and close
      setRoomName("");
      setRadminId("");
      setRadminPass("");
      setPassword("");
      setUsePassword(false);
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
      setRadminId("");
      setRadminPass("");
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
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              placeholder={t("room_name")}
              disabled={loading}
              maxLength={50}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                {t("radmin_id")}
              </label>
              <input
                type="text"
                value={radminId}
                onChange={(e) => setRadminId(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                placeholder="ID"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                {t("radmin_pass")}
              </label>
              <input
                type="text"
                value={radminPass}
                onChange={(e) => setRadminPass(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                placeholder="Pass"
                disabled={loading}
              />
            </div>
          </div>
          <p className="text-[10px] text-gray-500 italic -mt-2">
            {t("radmin_notice")}
          </p>

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
