import { useState, useEffect } from "react";
import { useRooms } from "../hooks/useRooms";
import { useAuth } from "../hooks/useAuth";
import { useStore } from "../store/useStore";
import { useI18n } from "../config/i18n";
import UserAvatar from "../components/shared/UserAvatar";

export default function InRoomView() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { currentRoom, leaveRoom } = useRooms();
  const { vpnConnection, setVpnConnection } = useStore();

  const [isConnectingVpn, setIsConnectingVpn] = useState(false);
  const [isLaunchingGame, setIsLaunchingGame] = useState(false);
  const [isLeavingRoom, setIsLeavingRoom] = useState(false);
  const [gamePath, setGamePath] = useState("");
  const [vpnError, setVpnError] = useState<string | null>(null);

  if (!currentRoom) return null;

  const handleConnectVpn = async () => {
    if (!user || isConnectingVpn) return;
    
    setIsConnectingVpn(true);
    setVpnError(null);
    try {
      const result = await (window as any).electronAPI.connectVpn({
        userId: user.id,
        roomId: currentRoom.id,
        password: currentRoom.p2pPassword // Note: renamed from radminNetworkPassword
      });

      if (result.connected) {
        setVpnConnection(result);
      } else {
        setVpnError(result.error || "Failed to establish P2P connection.");
      }
    } catch (error: any) {
      setVpnError(error.message || "P2P connection error.");
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

  const isOwner = user?.id === currentRoom.ownerId;
  const isAdmin = user?.role === "admin";
  const canManage = isOwner || isAdmin;

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
                <div className="bg-gray-900/40 backdrop-blur-sm border border-white/5 rounded-2xl p-8 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-indigo-600/10 transition-all"></div>

                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <span className="w-1.5 h-6 bg-indigo-500 rounded-full"></span>
                      <h3 className="text-lg font-black uppercase tracking-widest text-gray-400">
                        Protected Mesh Network
                      </h3>
                    </div>
                    {vpnConnection?.connected && (
                      <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Connected</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-black/40 border border-white/5 rounded-2xl p-6 transition-all hover:bg-black/60">
                      <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-2 italic">Your Virtual IP</p>
                      <p className="font-mono text-2xl text-indigo-400 tracking-tighter">
                        {vpnConnection?.virtualIp || "Allocating..."}
                      </p>
                    </div>
                    <div className="bg-black/40 border border-white/5 rounded-2xl p-6 transition-all hover:bg-black/60">
                      <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-2 italic">Secured Community</p>
                      <p className="font-mono text-lg text-gray-400 truncate">
                        {vpnConnection?.community || "Connecting..."}
                      </p>
                    </div>
                  </div>

                  {vpnError ? (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 space-y-3">
                      <p className="text-xs text-red-400 font-bold">{vpnError}</p>
                      <button 
                         onClick={handleConnectVpn}
                         className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all"
                      >
                         Retry Connection
                      </button>
                    </div>
                  ) : !vpnConnection?.connected ? (
                    <div className="bg-indigo-600/5 border border-indigo-600/20 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-4">
                      <div className="w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                      <p className="text-sm font-bold text-indigo-300 uppercase tracking-widest">Stabilizing P2P Mesh...</p>
                    </div>
                  ) : (
                    <div className="bg-green-600/5 border border-green-600/20 rounded-2xl p-6 text-center">
                       <p className="text-xs text-green-400 font-bold uppercase tracking-widest">✓ All users are visible on the local network</p>
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
        </div>
      </div>
    </div>
  );
}
