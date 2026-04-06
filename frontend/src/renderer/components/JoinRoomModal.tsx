import { useState } from "react";
import { useI18n } from "../config/i18n";

interface JoinRoomModalProps {
  isOpen: boolean;
  roomName: string;
  onClose: () => void;
  onJoin: (password: string) => Promise<void>;
}

export default function JoinRoomModal({
  isOpen,
  roomName,
  onClose,
  onJoin,
}: JoinRoomModalProps) {
  const { t } = useI18n();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!password.trim()) {
      setError(t("password") + " is required");
      return;
    }

    setLoading(true);

    try {
      await onJoin(password);
      setPassword("");
      onClose();
    } catch (err: any) {
      setError(
        err.response?.data?.error || err.message || "Failed to join room"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setPassword("");
      setError("");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-sm w-full shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/5 blur-3xl rounded-full -mr-12 -mt-12 group-hover:bg-blue-600/10 transition-all"></div>
        
        <h2 className="text-xl font-black text-white mb-2 flex items-center gap-2 tracking-tight uppercase">
          <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>
          {t("join")}
        </h2>
        <p className="text-gray-500 text-xs font-bold mb-6 italic">
          "{roomName}" {t("private_notice")}
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2 ml-1">
              {t("password")}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-black/40 border border-white/5 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-gray-700"
              placeholder={t("enter_password")}
              disabled={loading}
              autoFocus
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl text-[10px] font-bold animate-pulse">
              {error}
            </div>
          )}

          <div className="flex gap-4 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-400 text-xs font-black uppercase tracking-widest rounded-xl transition-all"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-blue-900/20 active:scale-95 transition-all disabled:bg-gray-800"
            >
              {loading ? "..." : t("join")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
