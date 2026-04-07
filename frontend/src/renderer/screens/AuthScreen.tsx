import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useI18n } from "../config/i18n";

export default function AuthScreen() {
  const { t, lang, changeLanguage } = useI18n();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError(t("setup_title")); // Fallback or specific i18n
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setError(t("confirm_password") + " mismatch");
      return;
    }

    if (password.length < 6) {
      setError("Password too short");
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        await login(username, password);
      } else {
        await register(username, password);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error || err.message || "Authentication failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0a0c] relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full"></div>

      <div className="max-w-md w-full mx-4 z-10">
        <div className="bg-gray-900/40 backdrop-blur-xl border border-white/5 rounded-2xl shadow-2xl p-8 relative">
          {/* Language Toggle */}
          <div className="absolute top-4 right-4 flex bg-black/40 p-1 rounded-lg border border-white/5">
            <button
              onClick={() => changeLanguage("vi")}
              className={`px-3 py-1 text-[10px] font-black rounded-md transition-all ${
                lang === "vi" ? "bg-blue-600 text-white" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              VI
            </button>
            <button
              onClick={() => changeLanguage("en")}
              className={`px-3 py-1 text-[10px] font-black rounded-md transition-all ${
                lang === "en" ? "bg-blue-600 text-white" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              EN
            </button>
          </div>

          <div className="text-center mb-10">
            <h1 className="text-4xl font-black text-white mb-3 tracking-tight bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
              AOE LAUNCHER
            </h1>
            <p className="text-gray-400 font-medium">
              {isLogin ? t("welcome_back") : t("create_account")}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2 ml-1">
                {t("username")}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-5 py-3.5 bg-black/40 border border-white/5 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-gray-600"
                placeholder={t("login_placeholder")}
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2 ml-1">
                {t("password")}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-3.5 bg-black/40 border border-white/5 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-gray-600"
                placeholder={t("pass_placeholder")}
                disabled={loading}
              />
            </div>

            {!isLogin && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-sm font-bold text-gray-400 mb-2 ml-1">
                  {t("confirm_password")}
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-5 py-3.5 bg-black/40 border border-white/5 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-gray-600"
                  placeholder={t("confirm_password")}
                  disabled={loading}
                />
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-xs font-bold animate-pulse">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest py-4 rounded-xl shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-all disabled:bg-gray-800 disabled:shadow-none"
            >
              {loading ? "..." : isLogin ? t("login") : t("register")}
            </button>
          </form>

              <div className="mt-6 text-center space-y-4">
                <p className="text-gray-500 text-sm">
                  {isLogin ? t("no_account") : t("have_account")}{" "}
                  <button
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setError("");
                      setConfirmPassword("");
                    }}
                    className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors"
                  >
                    {isLogin ? t("register") : t("login")}
                  </button>
                </p>
                <div className="pt-2 border-t border-white/5">
                  <p className="text-[10px] text-gray-600 font-medium leading-relaxed italic">
                    {t("forgot_password_contact")}
                  </p>
                </div>
              </div>
        </div>
      </div>
    </div>
  );
}
