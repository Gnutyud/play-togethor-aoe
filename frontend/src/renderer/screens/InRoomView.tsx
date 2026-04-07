import { useState, useEffect } from "react";
import { useRooms } from "../hooks/useRooms";
import { useAuth } from "../hooks/useAuth";
import { useStore } from "../store/useStore";
import { useI18n } from "../config/i18n";
import UserAvatar from "../components/shared/UserAvatar";
import { api } from "../services/api";

export default function InRoomView() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { currentRoom, leaveRoom } = useRooms();
  const { vpnConnection, setVpnConnection } = useStore();

  const [isConnectingVpn, setIsConnectingVpn] = useState(false);
  const [isLaunchingGame, setIsLaunchingGame] = useState(false);
  const [isLeavingRoom, setIsLeavingRoom] = useState(false);
  const [gamePath, setGamePath] = useState("");
  const [isEditingRadmin, setIsEditingRadmin] = useState(false);
  const [editRadminId, setEditRadminId] = useState("");
  const [editRadminPass, setEditRadminPass] = useState("");
  const [isUpdatingRadmin, setIsUpdatingRadmin] = useState(false);
  const [vpnError, setVpnError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);

  if (!currentRoom) return null;

  const handleConnectVpn = async () => {
    setIsConnectingVpn(true);
    setVpnError(null);
    try {
      const result = await (window as any).electronAPI.connectVpn({
        connected: true,
        networkId: currentRoom.radminNetworkId,
        password: currentRoom.radminNetworkPassword,
      });

      if (result.success) {
        setVpnConnection({
          connected: true,
          networkId: currentRoom.radminNetworkId,
          networkName: currentRoom.name,
          password: currentRoom.radminNetworkPassword,
        });
      } else {
        const errMsg = result.message || "Failed to open Radmin VPN.";
        console.error("VPN connect failed:", errMsg);
        setVpnError("Radmin VPN opened. Please copy the Network ID and Password below and join the network manually.");
      }
    } catch (error: any) {
      console.error("VPN Error:", error.message);
      setVpnError(error.message || "Unexpected error connecting to VPN.");
    } finally {
      setIsConnectingVpn(false);
    }
  };

  const handleDisconnectVpn = async () => {
    try {
      await (window as any).electronAPI.disconnectVpn();
      setVpnConnection(null);
    } catch (error: any) {
      alert(error.message);
    }
  };

  useEffect(() => {
    const loadGamePath = async () => {
      try {
        const path = await (window as any).electronAPI.getSettings("gamePath");
        setGamePath(path || "");
      } catch (error) {
        console.error("Failed to load game path:", error);
      }
    };

    loadGamePath();

    // Auto-connect VPN if not already connected
    if (currentRoom && !vpnConnection?.connected && !isConnectingVpn) {
      handleConnectVpn();
    }
  }, [currentRoom?.id, vpnConnection?.connected]);

  const handleLaunchGame = async () => {
    if (!gamePath) {
      alert(t("select_game_path"));
      return;
    }

    setIsLaunchingGame(true);
    try {
      const result = await (window as any).electronAPI.launchGame({
        gamePath,
        playerName: user?.username || "Player",
        roomId: currentRoom.id,
        enableMultiplayer: true,
      });

      if (!result.success) {
        alert(result.message);
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsLaunchingGame(false);
    }
  };

  const handleLeaveRoom = async () => {
    setIsLeavingRoom(true);
    try {
      if (vpnConnection?.connected) {
        await handleDisconnectVpn();
      }
      await leaveRoom();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsLeavingRoom(false);
    }
  };

  const handleUpdateRadmin = async () => {
    if (!currentRoom) return;
    setIsUpdatingRadmin(true);
    try {
      await api.updateRoom(currentRoom.id, {
        radminNetworkId: editRadminId,
        radminNetworkPassword: editRadminPass,
      });
      setIsEditingRadmin(false);
      // Room will be updated via SSE or polling
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to update room");
    } finally {
      setIsUpdatingRadmin(false);
    }
  };

  const isOwner = user?.id === currentRoom.ownerId;
  const isAdmin = user?.role === "admin";
  const canManage = isOwner || isAdmin;

  const handleCopy = (text: string, type: 'id' | 'pass') => {
    navigator.clipboard.writeText(text);
    if (type === 'id') {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } else {
      setCopiedPass(true);
      setTimeout(() => setCopiedPass(false), 2000);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0c] text-white overflow-hidden">
      {/* Premium Header */}
      <div className="bg-gray-900/50 backdrop-blur-md border-b border-white/5 p-4 z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-600/20">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight">
                {currentRoom.name}
              </h1>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                {currentRoom.playerCount} / {currentRoom.maxPlayers}{" "}
                {t("players")}
              </p>
            </div>
          </div>
          <button
            onClick={handleLeaveRoom}
            disabled={isLeavingRoom}
            className="px-6 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-black uppercase tracking-widest rounded-lg border border-red-500/20 transition-all disabled:opacity-50"
          >
            {isLeavingRoom ? "..." : t("leave")}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-5xl mx-auto p-6 md:p-8 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Action Panel */}
            <div className="lg:col-span-8 space-y-8">
              {/* VPN Section */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-black/20 border border-white/5 rounded-xl p-4 relative group/item">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                          RADMIN ID
                        </p>
                        <button 
                          onClick={() => handleCopy(currentRoom.radminNetworkId, 'id')}
                          className="text-[8px] text-blue-500 hover:text-blue-400 font-black uppercase tracking-widest transition-colors"
                        >
                          {copiedId ? "✓ COPIED" : "COPY"}
                        </button>
                      </div>
                      <p className="font-mono text-sm text-blue-400 select-all truncate pr-16 leading-relaxed">
                        {currentRoom.radminNetworkId}
                      </p>
                    </div>
                    <div className="bg-black/20 border border-white/5 rounded-xl p-4 relative group/item">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                          RADMIN PASSWORD
                        </p>
                        <button 
                          onClick={() => handleCopy(currentRoom.radminNetworkPassword, 'pass')}
                          className="text-[8px] text-blue-500 hover:text-blue-400 font-black uppercase tracking-widest transition-colors"
                        >
                          {copiedPass ? "✓ COPIED" : "COPY"}
                        </button>
                      </div>
                      <p className="font-mono text-sm text-blue-400 select-all truncate leading-relaxed">
                        {currentRoom.radminNetworkPassword}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleConnectVpn}
                    disabled={isConnectingVpn}
                    className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-sm rounded-xl shadow-xl shadow-blue-900/20 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {isConnectingVpn ? "⏳ OPENING..." : "🔌 OPEN RADMIN VPN"}
                  </button>

                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-5 border-dashed">
                    <h4 className="text-xs font-black uppercase tracking-widest text-blue-400 mb-4 flex items-center gap-2">
                       <span className="w-1.5 h-3 bg-blue-500 rounded-full animate-pulse"></span>
                       HƯỚNG DẪN KẾT NỐI (CONNECTION GUIDE)
                    </h4>
                    <div className="space-y-3">
                       <div className="flex items-start gap-3">
                         <span className="w-5 h-5 flex items-center justify-center bg-blue-600 rounded-full text-[10px] font-black shrink-0">1</span>
                         <p className="text-[11px] text-gray-300 font-medium">Bấm nút <span className="text-blue-400 font-bold">MỞ RADMIN VPN</span> ở trên.</p>
                       </div>
                       <div className="flex items-start gap-3">
                         <span className="w-5 h-5 flex items-center justify-center bg-blue-600 rounded-full text-[10px] font-black shrink-0">2</span>
                         <p className="text-[11px] text-gray-300 font-medium">Trong Radmin VPN, chọn menu <span className="text-blue-400 font-bold">Network &gt; Join Network</span> (hoặc nhấn phím <span className="text-yellow-500">+</span>).</p>
                       </div>
                       <div className="flex items-start gap-3">
                         <span className="w-5 h-5 flex items-center justify-center bg-blue-600 rounded-full text-[10px] font-black shrink-0">3</span>
                         <p className="text-[11px] text-gray-300 font-medium">Sử dụng nút <span className="text-blue-400 font-bold">COPY</span> ở trên để Copy ID/Password và Paste vào Radmin và bấm Join.</p>
                       </div>
                       <div className="flex items-start gap-3">
                         <span className="w-5 h-5 flex items-center justify-center bg-green-600 rounded-full text-[10px] font-black shrink-0">OK</span>
                         <p className="text-[11px] text-green-400 font-bold">Sau khi đã Join, hãy nhấn KHỞI ĐỘNG GAME bên dưới!</p>
                       </div>
                    </div>
                  </div>

                  {vpnError && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3 flex items-start gap-3">
                      <span className="text-yellow-400 text-lg shrink-0">ℹ️</span>
                      <p className="text-xs text-yellow-300 font-bold leading-relaxed">{vpnError}</p>
                    </div>
                  )}
                </div>

              {/* Game Section */}
              <div className="bg-gray-900/40 backdrop-blur-sm border border-white/5 rounded-2xl p-8 group">
                <div className="flex items-center gap-3 mb-6">
                  <span className="w-1.5 h-6 bg-green-500 rounded-full"></span>
                  <h3 className="text-lg font-black uppercase tracking-widest text-gray-400">
                    Battlefield
                  </h3>
                </div>

                <div className="space-y-6">
                  {!gamePath && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 px-5 py-4 rounded-xl text-xs font-bold flex items-center gap-3">
                      <svg
                        className="w-5 h-5 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                      {t("select_game_path")}
                    </div>
                  )}

                  <button
                    onClick={handleLaunchGame}
                    disabled={
                      isLaunchingGame || !gamePath || !vpnConnection?.connected
                    }
                    className="w-full py-6 bg-green-600 hover:bg-green-500 text-white font-black uppercase tracking-widest text-lg rounded-xl shadow-xl shadow-green-900/20 active:scale-[0.98] transition-all disabled:bg-gray-800/50 disabled:text-gray-600 disabled:shadow-none"
                  >
                    {isLaunchingGame ? "..." : "🎮 " + t("launch_game")}
                  </button>

                  <div className="text-center">
                    <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest">
                      {t("launch_desc")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Players Sidebar */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-gray-900/40 backdrop-blur-sm border border-white/5 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <span className="w-1.5 h-6 bg-indigo-500 rounded-full"></span>
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">
                    {t("players")}
                  </h3>
                </div>

                <div className="space-y-3">
                  {currentRoom.players.map((player) => (
                    <div
                      key={player.userId}
                      className="flex items-center justify-between bg-black/20 hover:bg-black/40 border border-white/5 rounded-xl p-3 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <UserAvatar username={player.username} size={9} />
                        <div>
                          <p className="text-sm font-bold text-white leading-none mb-1">
                            {player.username}
                          </p>
                          <div className="flex gap-2">
                            {player.userId === user?.id && (
                              <span className="text-[8px] font-black uppercase tracking-widest text-blue-500">
                                YOU
                              </span>
                            )}
                            {player.userId === currentRoom.ownerId && (
                              <span className="text-[8px] font-black uppercase tracking-widest text-yellow-500">
                                {t("room_owner")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {canManage && (
                <div className="bg-blue-600/5 border border-blue-500/20 rounded-2xl p-6">
                  <p className="text-xs text-blue-300/80 leading-relaxed font-bold italic">
                    {t("admin_notice")}
                  </p>
                </div>
              )}
            </div>
          </div>
          {/* Admin Edit Modal */}
          {isEditingRadmin && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-[#121214] border border-white/10 rounded-2xl w-full max-w-md p-8 shadow-2xl">
                <h3 className="text-xl font-black mb-6 uppercase tracking-wider">
                  Edit Radmin Info
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] text-gray-500 font-black uppercase tracking-widest mb-2">
                      Network ID
                    </label>
                    <input
                      type="text"
                      value={editRadminId}
                      onChange={(e) => setEditRadminId(e.target.value)}
                      className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 font-black uppercase tracking-widest mb-2">
                      Network Password
                    </label>
                    <input
                      type="text"
                      value={editRadminPass}
                      onChange={(e) => setEditRadminPass(e.target.value)}
                      className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div className="flex gap-4 mt-8">
                    <button
                      onClick={() => setIsEditingRadmin(false)}
                      className="flex-1 py-3 text-xs font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
                    >
                      {t("cancel")}
                    </button>
                    <button
                      onClick={handleUpdateRadmin}
                      disabled={isUpdatingRadmin}
                      className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg transition-all"
                    >
                      {isUpdatingRadmin ? "..." : t("save_settings")}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
