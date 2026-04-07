import { useState, useEffect } from "react";
import { useRooms } from "../hooks/useRooms";
import { useAuth } from "../hooks/useAuth";
import { useI18n } from "../config/i18n";
import RoomCard from "../components/RoomCard";
import CreateRoomModal from "../components/CreateRoomModal";
import JoinRoomModal from "../components/JoinRoomModal";
import UserAvatar from "../components/shared/UserAvatar";

import SettingsModal from "../components/SettingsModal";
import { useStore } from "../store/useStore";

export default function RoomListView() {
  const { user, logout } = useAuth();
  const { t, lang, changeLanguage } = useI18n();
  const { rooms, startPolling, stopPolling, joinRoom, createRoom, deleteRoom } = useRooms();
  const { isRoomsLoading } = useStore();

  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [joinRoomId, setJoinRoomId] = useState<string | null>(null);
  const [isJoiningId, setIsJoiningId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    startPolling();
    
    // Monitor Radmin status
    const cleanup = (window as any).electronAPI.onRadminStatusChanged((payload: { running: boolean }) => {
      if (!payload.running) {
        setErrorMsg(t("radmin_closed_warning"));
      }
    });

    return () => {
      stopPolling();
      cleanup();
    };
  }, [startPolling, stopPolling, t]);

  const handleJoinRoom = async (roomId: string) => {
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return;

    if (room.hasPassword) {
      setJoinRoomId(roomId);
      return;
    }

    setIsJoiningId(roomId);
    setErrorMsg(null);
    try {
      await joinRoom(roomId);
    } catch (error: any) {
      setErrorMsg(error.response?.data?.error || "Failed to join room");
    } finally {
      setIsJoiningId(null);
    }
  };

  const handleJoinWithPassword = async (password: string) => {
    if (!joinRoomId) return;

    setErrorMsg(null);
    try {
      await joinRoom(joinRoomId, password);
      setJoinRoomId(null);
    } catch (error: any) {
      setErrorMsg(error.response?.data?.error || "Invalid password");
    }
  };

  const handleCreateRoom = async (
    name: string,
    radminId: string,
    radminPass: string,
    password?: string,
    type?: string
  ) => {
    await createRoom(name, radminId, radminPass, password, type);
    setIsCreatingRoom(false);
  };

  const handleDeleteRoom = async (roomId: string) => {
    try {
      await deleteRoom(roomId);
    } catch (error: any) {
      setErrorMsg("Failed to delete room");
    }
  };

  const defaultRooms = rooms.filter((r) => r.type === "default");
  const customRooms = rooms.filter((r) => r.type === "custom");

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0c] text-white">
      {/* Premium Header */}
      <div className="bg-gray-900/50 backdrop-blur-md border-b border-white/5 p-4 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-600/20">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
                AOE LAUNCHER
              </h1>
              <div className="flex items-center gap-2">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{t("waiting")}...</p>
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Language Toggle */}
            <div className="hidden md:flex bg-black/40 p-1 rounded-lg border border-white/5">
              <button
                onClick={() => changeLanguage("vi")}
                className={`px-3 py-1 text-[10px] font-black rounded-md transition-all ${
                  lang === "vi" ? "bg-blue-600 text-white shadow-lg" : "text-gray-500 hover:text-gray-300"
                }`}
              >
                VI
              </button>
              <button
                onClick={() => changeLanguage("en")}
                className={`px-3 py-1 text-[10px] font-black rounded-md transition-all ${
                  lang === "en" ? "bg-blue-600 text-white shadow-lg" : "text-gray-500 hover:text-gray-300"
                }`}
              >
                EN
              </button>
            </div>

            <div className="flex items-center gap-2 pl-6 border-l border-white/5">
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-2.5 bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 transition-all text-gray-400 hover:text-white"
                title={t("settings")}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 00-1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>

            <div className="flex items-center gap-3 pl-6 border-l border-white/5">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-white leading-none">{user?.username}</p>
                <button onClick={logout} className="text-[10px] text-red-500 hover:text-red-400 font-black uppercase tracking-widest transition-colors mt-1">
                  {t("logout")}
                </button>
              </div>
              <UserAvatar username={user?.username || "Guest"} size={10} className="border-2 border-white/5" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-7xl mx-auto p-6 md:p-8">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
            <div>
              <h2 className="text-3xl font-black tracking-tight mb-2">{t("rooms_title")}</h2>
              <p className="text-gray-500 text-sm font-medium">{t("be_first_host")}</p>
            </div>
            <button
              onClick={() => setIsCreatingRoom(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-sm shadow-xl shadow-blue-900/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span className="text-xl">+</span> {t("create_room")}
            </button>
          </div>

          <div className="space-y-12">
            {/* Default Rooms */}
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 mb-6">
                <span className="w-1.5 h-6 bg-indigo-500 rounded-full"></span>
                <h3 className="text-lg font-black uppercase tracking-widest text-gray-400">{t("default_room")}</h3>
              </div>
              {isRoomsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="bg-gray-900/40 rounded-xl h-32 border border-white/5 animate-pulse flex items-center justify-center">
                      <p className="text-gray-700 text-xs font-black uppercase tracking-widest">{t("loading_rooms")}</p>
                    </div>
                  ))}
                </div>
              ) : defaultRooms.length === 0 ? (
                <div className="bg-white/5 border border-dashed border-white/10 rounded-2xl p-12 text-center">
                  <p className="text-gray-600 font-medium">{t("no_public_rooms")}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {defaultRooms.map((room) => (
                    <RoomCard
                      key={room.id}
                      room={room}
                      onJoin={handleJoinRoom}
                      onDelete={handleDeleteRoom}
                      isJoining={isJoiningId === room.id}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Custom Rooms */}
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex items-center gap-3 mb-6">
                <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>
                <h3 className="text-lg font-black uppercase tracking-widest text-gray-400">{t("custom_room")}</h3>
              </div>
              {isRoomsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="bg-gray-900/40 rounded-xl h-32 border border-white/5 animate-pulse"></div>
                  ))}
                </div>
              ) : customRooms.length === 0 ? (
                <div className="bg-white/5 border border-dashed border-white/10 rounded-2xl p-12 text-center group hover:bg-white/10 transition-all cursor-pointer" onClick={() => setIsCreatingRoom(true)}>
                  <p className="text-gray-600 font-medium group-hover:text-gray-400 transition-colors">{t("be_first_host")}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {customRooms.map((room) => (
                    <RoomCard
                      key={room.id}
                      room={room}
                      onJoin={handleJoinRoom}
                      onDelete={handleDeleteRoom}
                      isJoining={isJoiningId === room.id}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>

          {errorMsg && (
            <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="bg-red-900/90 backdrop-blur-md border border-red-500/50 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4">
                <div className="bg-red-500 p-1 rounded-full">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-red-300 mb-0.5">Alert</p>
                  <p className="text-sm font-bold">{errorMsg}</p>
                </div>
                <button onClick={() => setErrorMsg(null)} className="ml-4 text-white/50 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <CreateRoomModal
        isOpen={isCreatingRoom}
        onClose={() => setIsCreatingRoom(false)}
        onCreate={handleCreateRoom}
      />

      <JoinRoomModal
        isOpen={!!joinRoomId}
        roomName={rooms.find((r) => r.id === joinRoomId)?.name || ""}
        onClose={() => setJoinRoomId(null)}
        onJoin={handleJoinWithPassword}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
