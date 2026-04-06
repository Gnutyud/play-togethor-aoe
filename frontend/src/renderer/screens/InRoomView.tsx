import { useState, useEffect } from "react";
import { useRooms } from "../hooks/useRooms";
import { useAuth } from "../hooks/useAuth";
import { useStore } from "../store/useStore";

export default function InRoomView() {
  const { user } = useAuth();
  const { currentRoom, leaveRoom } = useRooms();
  const { vpnConnection, setVpnConnection } = useStore();

  const [isConnectingVpn, setIsConnectingVpn] = useState(false);
  const [isLaunchingGame, setIsLaunchingGame] = useState(false);
  const [gamePath, setGamePath] = useState("");

  useEffect(() => {
    // Load game path from settings
    const loadGamePath = async () => {
      try {
        const path = await window.electronAPI.getSettings("gamePath");
        setGamePath(path || "");
      } catch (error) {
        console.error("Failed to load game path:", error);
      }
    };
    loadGamePath();
  }, []);

  if (!currentRoom) {
    return null;
  }

  const handleConnectVpn = async () => {
    setIsConnectingVpn(true);
    try {
      const result = await window.electronAPI.connectVpn({
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
        // Success - no alert needed, show in UI
      } else {
        alert(
          "Auto-connect failed: " +
            result.message +
            "\n\nPlease connect manually in Radmin VPN app."
        );
      }
    } catch (error: any) {
      alert("VPN connection error: " + error.message);
    } finally {
      setIsConnectingVpn(false);
    }
  };

  const handleDisconnectVpn = async () => {
    try {
      await window.electronAPI.disconnectVpn();
      setVpnConnection(null);
    } catch (error: any) {
      alert("Failed to disconnect VPN: " + error.message);
    }
  };

  const handleLaunchGame = async () => {
    if (!gamePath) {
      alert("Game path not set. Please configure in settings.");
      return;
    }

    setIsLaunchingGame(true);
    try {
      const result = await window.electronAPI.launchGame({
        gamePath,
        playerName: user?.username || "Player",
        roomId: currentRoom.id,
        enableMultiplayer: true,
      });

      if (result.success) {
        alert("Game launched successfully!");
      } else {
        alert("Failed to launch game: " + result.message);
      }
    } catch (error: any) {
      alert("Game launch error: " + error.message);
    } finally {
      setIsLaunchingGame(false);
    }
  };

  const handleLeaveRoom = async () => {
    try {
      if (vpnConnection?.connected) {
        await handleDisconnectVpn();
      }
      await leaveRoom();
    } catch (error: any) {
      alert("Failed to leave room: " + error.message);
    }
  };

  const isOwner = user?.id === currentRoom.ownerId;

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {currentRoom.name}
            </h1>
            <p className="text-sm text-gray-400">
              {currentRoom.playerCount}/{currentRoom.maxPlayers} players
            </p>
          </div>
          <button
            onClick={handleLeaveRoom}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
          >
            Leave Room
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* VPN Connection Section */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">
              VPN Connection
            </h2>

            <div className="space-y-4">
              <div className="bg-gray-700 rounded p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Network ID</p>
                    <p className="text-white font-mono">
                      {currentRoom.radminNetworkId}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Password</p>
                    <p className="text-white font-mono">
                      {currentRoom.radminNetworkPassword}
                    </p>
                  </div>
                </div>
              </div>

              {vpnConnection?.connected ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-green-400">
                    <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                    <span className="font-medium">
                      ✓ Connected to VPN network
                    </span>
                  </div>
                  <button
                    onClick={handleDisconnectVpn}
                    className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                  >
                    Disconnect VPN
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={handleConnectVpn}
                    disabled={isConnectingVpn}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-3 rounded disabled:bg-gray-600 disabled:cursor-not-allowed"
                  >
                    {isConnectingVpn ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="animate-spin">⏳</span>
                        Auto-connecting to VPN...
                      </span>
                    ) : (
                      "🔌 Auto-Connect to VPN"
                    )}
                  </button>
                  <p className="text-xs text-blue-400 text-center">
                    ✨ Click to automatically connect to Radmin VPN network
                  </p>
                </div>
              )}

              <div className="bg-blue-900/20 border border-blue-700 rounded p-3">
                <p className="text-xs text-blue-200">
                  💡 <strong>How it works:</strong> We'll automatically open
                  Radmin VPN and connect to the network for you. No manual steps
                  needed!
                </p>
              </div>
            </div>
          </div>

          {/* Game Launch Section */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">Launch Game</h2>

            <div className="space-y-4">
              {gamePath ? (
                <div className="bg-gray-700 rounded p-3">
                  <p className="text-xs text-gray-400 mb-1">Game Path</p>
                  <p className="text-sm text-white font-mono break-all">
                    {gamePath}
                  </p>
                </div>
              ) : (
                <div className="bg-yellow-900/50 border border-yellow-600 text-yellow-200 px-4 py-3 rounded text-sm">
                  Game path not configured. Please set it in settings.
                </div>
              )}

              <button
                onClick={handleLaunchGame}
                disabled={
                  isLaunchingGame || !gamePath || !vpnConnection?.connected
                }
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                {isLaunchingGame
                  ? "Launching..."
                  : "🎮 Launch Age of Empires I"}
              </button>

              {!vpnConnection?.connected && (
                <p className="text-xs text-yellow-400 text-center">
                  ⚠️ Please connect to VPN first before launching the game
                </p>
              )}

              <p className="text-xs text-gray-500">
                Make sure you're connected to VPN before launching the game
              </p>
            </div>
          </div>

          {/* Players Section */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">
              Players ({currentRoom.playerCount}/{currentRoom.maxPlayers})
            </h2>

            <div className="space-y-2">
              {currentRoom.players.map((player) => (
                <div
                  key={player.userId}
                  className="flex items-center justify-between bg-gray-700 rounded p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                      {player.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        {player.username}
                      </p>
                      {player.userId === user?.id && (
                        <p className="text-xs text-gray-400">You</p>
                      )}
                      {player.userId === currentRoom.ownerId && (
                        <p className="text-xs text-yellow-400">Room Owner</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Room Info */}
          {isOwner && (
            <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-4">
              <p className="text-blue-200 text-sm">
                💡 You are the room owner. The room will be automatically
                deleted when empty.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
