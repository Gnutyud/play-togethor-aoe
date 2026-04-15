import { useState, useEffect } from "react";
import { DependencyStatus } from "../../shared/types";
import { useI18n } from "../config/i18n";

interface SetupScreenProps {
  dependencies: DependencyStatus;
  onSetupComplete: () => void;
}

export default function SetupScreen({
  dependencies: initialDependencies,
  onSetupComplete,
}: SetupScreenProps) {
  const { t, lang, changeLanguage } = useI18n();
  const [message, setMessage] = useState("");
  const [dependencies, setDependencies] = useState<DependencyStatus>(initialDependencies);

  useEffect(() => {
    const checkDependencies = async () => {
      try {
        const status = await (window as any).electronAPI.checkDependencies();
        setDependencies(status);

        if (status.aoeGame.installed && status.p2pNetwork.installed) {
          // All ready
        }
      } catch (error) {
        console.error("Failed to check dependencies:", error);
      }
    };

    checkDependencies();
    const interval = setInterval(checkDependencies, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectGamePath = async () => {
    try {
      const result = await (window as any).electronAPI.selectGamePath();

      if (result.success) {
        setMessage("Game path set successfully!");
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setMessage(result.message || "Failed to set game path");
      }
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    }
  };

  const allReady = dependencies.p2pNetwork.installed && dependencies.aoeGame.installed;

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0a0c] relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full"></div>

      <div className="max-w-xl w-full mx-4 z-10">
        <div className="bg-gray-900/40 backdrop-blur-xl border border-white/5 rounded-2xl shadow-2xl p-10 overflow-hidden relative">
          {/* Language Toggle */}
          <div className="absolute top-6 right-6 flex bg-black/40 p-1 rounded-lg border border-white/5">
            <button
              onClick={() => changeLanguage("vi")}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                lang === "vi" ? "bg-blue-600 text-white shadow-lg" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              VI
            </button>
            <button
              onClick={() => changeLanguage("en")}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                lang === "en" ? "bg-blue-600 text-white shadow-lg" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              EN
            </button>
          </div>

          <header className="mb-10">
            <h1 className="text-4xl font-black text-white mb-3 tracking-tight bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
              {t("setup_title")}
            </h1>
            <p className="text-gray-400 font-medium font-mono text-xs uppercase tracking-widest">Version 2.0.0 Integrated</p>
          </header>

          <div className="space-y-8">
            {/* P2P Networking Section */}
            <div className="group">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${dependencies.p2pNetwork.installed ? 'bg-indigo-500/10' : 'bg-yellow-500/10'}`}>
                    <svg className={`w-5 h-5 ${dependencies.p2pNetwork.installed ? 'text-indigo-400' : 'text-yellow-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-white tracking-wide">P2P Networking</h3>
                </div>
                {dependencies.p2pNetwork.installed ? (
                  <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-indigo-500/20">
                    Ready
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-yellow-500/10 text-yellow-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-yellow-500/20 animate-pulse">
                    Initializing
                  </span>
                )}
              </div>
              
              {!dependencies.p2pNetwork.installed && (
                <div className="bg-indigo-600/5 border border-indigo-500/20 rounded-xl p-5 mb-4 group-hover:bg-indigo-600/10 transition-all">
                  <p className="text-xs text-indigo-200/60 leading-relaxed font-bold italic">
                    Integrated P2P engine is required. Please ensure edge.exe and wintun.dll are present in the resources folder.
                  </p>
                </div>
              )}
            </div>

            {/* Game Path Section */}
            <div className="group">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${dependencies.aoeGame.installed ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                    <svg className={`w-5 h-5 ${dependencies.aoeGame.installed ? 'text-green-500' : 'text-red-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-white tracking-wide">AOE I (Empires.exe)</h3>
                </div>
                {dependencies.aoeGame.installed ? (
                  <span className="px-3 py-1 bg-green-500/10 text-green-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-green-500/20">
                    Found
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-red-500/20">
                    Missing
                  </span>
                )}
              </div>
              
              <div className="space-y-4">
                <div className="relative">
                  <button
                    onClick={handleSelectGamePath}
                    className="w-full flex items-center justify-between px-5 py-4 bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 hover:border-blue-500/50 rounded-xl text-gray-300 transition-all font-medium group/btn"
                  >
                    <span className="truncate mr-4 overflow-hidden text-ellipsis whitespace-nowrap">
                      {dependencies.aoeGame.path || t("select_game_path")}
                    </span>
                    <span className="text-blue-500 font-bold text-xs shrink-0 group-hover/btn:translate-x-1 transition-transform">
                      {t("browse")}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Region Selection */}
            <div className="group">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2 2 2 0 012 2v.5m.43 3.935A2 2 0 0118 20.312M11.732 3.469A2 2 0 0115 5.5l.044.22a2 2 0 001.294 1.515l3.227 1.076a2 2 0 011.163 2.187l-.43 3.935" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white tracking-wide">Infrastructure</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <button className="flex items-center justify-center gap-2 px-5 py-4 bg-indigo-600/20 border border-indigo-500/50 rounded-xl text-white font-bold transition-all shadow-lg shadow-indigo-900/10">
                   <span className="text-lg">🇻🇳</span> Asia Mesh
                 </button>
                 <button className="flex items-center justify-center gap-2 px-5 py-4 bg-gray-800/30 border border-gray-700/50 rounded-xl text-gray-500 font-bold hover:bg-gray-800 hover:text-gray-300 transition-all opacity-50 cursor-not-allowed">
                   <span className="text-lg">🌎</span> Global
                 </button>
              </div>
            </div>
          </div>

          {/* Messages & Actions */}
          <div className="mt-12">
            {message && (
              <div className="mb-6 animate-in slide-in-from-bottom-2 duration-300">
                <div className="bg-indigo-600/10 border border-indigo-500/20 text-indigo-300 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping"></div>
                  {message}
                </div>
              </div>
            )}

            {allReady ? (
              <button
                onClick={onSetupComplete}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-xl shadow-indigo-500/20 active:scale-[0.98] animate-in zoom-in-95 duration-500"
              >
                {t("start_app")}
              </button>
            ) : (
              <div className="bg-gray-900/60 p-4 rounded-xl text-center">
                <p className="text-gray-500 text-[11px] font-bold uppercase tracking-widest leading-relaxed">
                  Dependency check in progress...
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
