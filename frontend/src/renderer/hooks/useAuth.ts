import { useEffect } from "react";
import { useStore } from "../store/useStore";
import { api } from "../services/api";

export function useAuth() {
  const { user, setUser, isAuthenticated } = useStore();

  useEffect(() => {
    // Load user from localStorage on mount
    const savedUser = localStorage.getItem("user");
    if (savedUser && api.isAuthenticated()) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error("Failed to parse saved user:", error);
        logout();
      }
    }
  }, [setUser]);

  const login = async (username: string, password: string) => {
    const response = await api.login(username, password);
    setUser(response.user);
    return response;
  };

  const register = async (username: string, password: string) => {
    const response = await api.register(username, password);
    setUser(response.user);
    return response;
  };

  const logout = () => {
    api.logout();
    setUser(null);
  };

  return {
    user,
    isAuthenticated,
    login,
    register,
    logout,
  };
}
