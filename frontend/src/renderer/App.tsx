import { useState, useEffect } from "react";
import { DependencyStatus } from "../shared/types";
import { useAuth } from "./hooks/useAuth";
import SetupScreen from "./screens/SetupScreen";
import AuthScreen from "./screens/AuthScreen";
import MainScreen from "./screens/MainScreen";

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [setupComplete, setSetupComplete] = useState(false);
  const [dependencies, setDependencies] = useState<DependencyStatus | null>(
    null
  );
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    checkDependencies();
  }, []);

  const checkDependencies = async () => {
    try {
      const deps = await window.electronAPI.checkDependencies();
      setDependencies(deps);

      // Check if setup is complete
      const isComplete = deps.radminVpn.installed && deps.aoeGame.installed;
      setSetupComplete(isComplete);
    } catch (error) {
      console.error("Failed to check dependencies:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Step 1: Check dependencies
  if (!setupComplete) {
    return (
      <SetupScreen
        dependencies={dependencies!}
        onSetupComplete={() => {
          setSetupComplete(true);
          checkDependencies();
        }}
      />
    );
  }

  // Step 2: Check authentication
  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  // Step 3: Show main app
  return <MainScreen />;
}

export default App;
