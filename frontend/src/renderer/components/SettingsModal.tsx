import { useState, useEffect } from "react";
import { useI18n } from "../config/i18n";
import { api } from "../services/api";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { t } = useI18n();
  const [gamePath, setGamePath] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const loadPath = async () => {
        const path = await (window as any).electronAPI.getSettings("gamePath");
        setGamePath(path || "");
      };
      loadPath();
    }
  }, [isOpen]);

  const handleBrowse = async () => {
    const result = await (window as any).electronAPI.selectGamePath();
    if (result.success) {
      setGamePath(result.path);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await (window as any).electronAPI.setSettings("gamePath", gamePath);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) return;
    setIsChangingPassword(true);
    setPasswordError("");
    setPasswordSuccess(false);
    try {
      await api.changePassword(currentPassword, newPassword);
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err: any) {
      setPasswordError(err.response?.data?.error || "Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <span className="w-2 h-8 bg-indigo-500 rounded-full"></span>
          {t("settings")}
        </h2>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              {t("select_game_path")}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={gamePath}
                className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-xs text-gray-300 focus:outline-none"
              />
              <button
                onClick={handleBrowse}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold rounded-lg transition-colors"
              >
                {t("browse")}
              </button>
            </div>
          </div>

          <div className="pt-6 border-t border-white/5 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2">{t("change_password")}</h3>
            
            <div className="space-y-3">
              <input
                type="password"
                placeholder={t("current_password")}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-black/40 border border-white/5 rounded-lg text-xs text-gray-300 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <input
                type="password"
                placeholder={t("new_password")}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-black/40 border border-white/5 rounded-lg text-xs text-gray-300 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              
              {passwordError && (
                <p className="text-[10px] text-red-500 font-bold">{passwordError}</p>
              )}
              {passwordSuccess && (
                <p className="text-[10px] text-green-500 font-bold">✓ {t("save_settings")} Success!</p>
              )}

              <button
                onClick={handleChangePassword}
                disabled={isChangingPassword || !currentPassword || !newPassword}
                className="w-full py-2.5 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-indigo-500/20 transition-all disabled:opacity-50"
              >
                {isChangingPassword ? "..." : t("change_password")}
              </button>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium px-4 py-2.5 rounded-lg transition-colors"
            >
              {t("cancel")}
            </button>
            <button
              onClick={handleSave}
              disabled={loading || !gamePath}
              className={`flex-1 font-bold px-4 py-2.5 rounded-lg shadow-lg transition-all ${
                success 
                  ? "bg-green-600 text-white" 
                  : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/20"
              }`}
            >
              {loading ? "..." : success ? "✓ Saved" : t("save_settings")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
