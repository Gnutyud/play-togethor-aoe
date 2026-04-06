import { useState } from "react";
import { DependencyStatus } from "../../shared/types";

interface SetupScreenProps {
  dependencies: DependencyStatus;
  onSetupComplete: () => void;
}

export default function SetupScreen({
  dependencies,
  onSetupComplete,
}: SetupScreenProps) {
  const [isInstalling, setIsInstalling] = useState(false);
  const [message, setMessage] = useState("");

  const handleInstallRadmin = async () => {
    setIsInstalling(true);
    setMessage("Opening Radmin VPN download page...");

    try {
      const result = await window.electronAPI.installRadminVpn();
      setMessage(result.message);
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleSelectGamePath = async () => {
    try {
      const result = await window.electronAPI.selectGamePath();

      if (result.success) {
        setMessage("Game path set successfully!");
        // Recheck dependencies
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

  const canComplete =
    dependencies.radminVpn.installed && dependencies.aoeGame.installed;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      <div className="max-w-2xl w-full mx-4">
        <div className="bg-gray-800 rounded-lg shadow-2xl p-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            AOE Launcher Setup
          </h1>
          <p className="text-gray-400 mb-8">Let's get you ready to play!</p>

          {/* Radmin VPN */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-white">Radmin VPN</h3>
              {dependencies.radminVpn.installed ? (
                <span className="px-3 py-1 bg-green-600 text-white text-sm rounded-full">
                  ✓ Installed
                </span>
              ) : (
                <span className="px-3 py-1 bg-yellow-600 text-white text-sm rounded-full">
                  Checking...
                </span>
              )}
            </div>
            <p className="text-gray-400 text-sm mb-3">
              {dependencies.radminVpn.installed
                ? "Radmin VPN is installed and ready to use"
                : "Installing automatically on first launch"}
            </p>
            {!dependencies.radminVpn.installed && (
              <div className="bg-blue-900/30 border border-blue-700/50 rounded p-3 mb-2">
                <p className="text-sm text-blue-200 mb-2">
                  ℹ️ Radmin VPN is automatically installed when you first launch
                  the app. If you see this message, please restart the
                  application.
                </p>
                <button
                  onClick={handleInstallRadmin}
                  disabled={isInstalling}
                  className="text-blue-400 hover:text-blue-300 text-sm underline disabled:text-gray-500"
                >
                  {isInstalling ? "Opening..." : "Or download manually"}
                </button>
              </div>
            )}
            {dependencies.radminVpn.path && (
              <p className="text-xs text-gray-500 mt-2">
                Path: {dependencies.radminVpn.path}
              </p>
            )}
          </div>

          {/* AOE Game */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-white">
                Age of Empires I
              </h3>
              {dependencies.aoeGame.installed ? (
                <span className="px-3 py-1 bg-green-600 text-white text-sm rounded-full">
                  ✓ Found
                </span>
              ) : (
                <span className="px-3 py-1 bg-red-600 text-white text-sm rounded-full">
                  Not Found
                </span>
              )}
            </div>
            <p className="text-gray-400 text-sm mb-3">
              {dependencies.aoeGame.installed
                ? "Game installation detected"
                : "Could not auto-detect game installation"}
            </p>
            {!dependencies.aoeGame.installed && (
              <button
                onClick={handleSelectGamePath}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                Select Game Path
              </button>
            )}
            {dependencies.aoeGame.path && (
              <p className="text-xs text-gray-500 mt-2">
                Path: {dependencies.aoeGame.path}
              </p>
            )}
          </div>

          {/* Messages */}
          {message && (
            <div className="bg-blue-900/50 border border-blue-600 text-blue-200 px-4 py-3 rounded mb-6">
              {message}
            </div>
          )}

          {/* Complete Button */}
          {canComplete && (
            <button
              onClick={onSetupComplete}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg"
            >
              Continue to Launcher
            </button>
          )}

          {!canComplete && (
            <div className="text-center text-gray-500 text-sm">
              Please install all required dependencies to continue
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
