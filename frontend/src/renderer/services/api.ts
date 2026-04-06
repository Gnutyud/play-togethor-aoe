import axios, { AxiosInstance } from "axios";
import {
  User,
  Room,
  RoomWithNetwork,
  AuthResponse,
  RoomsResponse,
} from "../../shared/types";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://play-togethor-aoe.vercel.app";

class ApiService {
  private client: AxiosInstance;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // If 401 and we have refresh token, try to refresh
        if (
          error.response?.status === 401 &&
          this.refreshToken &&
          !originalRequest._retry
        ) {
          originalRequest._retry = true;

          try {
            // TODO: Implement token refresh endpoint
            // For now, just clear tokens and redirect to login
            this.clearTokens();
            window.location.reload();
          } catch (refreshError) {
            this.clearTokens();
            window.location.reload();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );

    // Load tokens from localStorage
    this.loadTokens();
  }

  private loadTokens() {
    this.accessToken = localStorage.getItem("accessToken");
    this.refreshToken = localStorage.getItem("refreshToken");
  }

  private saveTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
  }

  private clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
  }

  // ===== Authentication =====

  async register(username: string, password: string): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>(
      "/api/auth/register",
      {
        username,
        password,
      }
    );

    this.saveTokens(response.data.accessToken, response.data.refreshToken);
    localStorage.setItem("user", JSON.stringify(response.data.user));

    return response.data;
  }

  async login(username: string, password: string): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>("/api/auth/login", {
      username,
      password,
    });

    this.saveTokens(response.data.accessToken, response.data.refreshToken);
    localStorage.setItem("user", JSON.stringify(response.data.user));

    return response.data;
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.client.get<{ user: User }>("/api/auth/me");
    return response.data.user;
  }

  logout() {
    this.clearTokens();
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  // ===== Rooms =====

  async getRooms(): Promise<Room[]> {
    const response = await this.client.get<RoomsResponse>("/api/rooms");
    return response.data.rooms;
  }

  async createRoom(
    name: string,
    radminNetworkId: string,
    radminNetworkPassword: string,
    password?: string
  ): Promise<Room> {
    const response = await this.client.post<{ room: Room }>("/api/rooms", {
      name,
      password,
      radminNetworkId,
      radminNetworkPassword,
    });
    return response.data.room;
  }

  getRoomsEventSourceUrl(): string {
    return `${API_BASE_URL}/api/rooms/events`;
  }

  async joinRoom(roomId: string, password?: string): Promise<RoomWithNetwork> {
    const response = await this.client.post<{ room: RoomWithNetwork }>(
      `/api/rooms/${roomId}/join`,
      { password }
    );
    return response.data.room;
  }

  async leaveRoom(roomId: string): Promise<void> {
    await this.client.post(`/api/rooms/${roomId}/leave`);
  }

  async sendHeartbeat(roomId: string): Promise<void> {
    await this.client.post(`/api/rooms/${roomId}/heartbeat`);
  }

  async deleteRoom(roomId: string): Promise<void> {
    await this.client.delete(`/api/rooms/${roomId}`);
  }

  async getRoomUpdates(since?: string): Promise<Room[]> {
    const params = since ? { since } : {};
    const response = await this.client.get<RoomsResponse>(
      "/api/rooms/updates",
      { params }
    );
    return response.data.rooms;
  }
}

export const api = new ApiService();
