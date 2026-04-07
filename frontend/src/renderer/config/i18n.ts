import { useState, useEffect } from "react";

// Translation dictionary
const translations = {
  vi: {
    // Auth
    login: "Đăng nhập",
    register: "Đăng ký",
    username: "Tên đăng nhập",
    password: "Mật khẩu",
    confirm_password: "Xác nhận mật khẩu",
    back_to_login: "Quay lại đăng nhập",
    no_account: "Chưa có tài khoản?",
    have_account: "Đã có tài khoản?",
    welcome_back: "Chào mừng quay trở lại!",
    create_account: "Tạo tài khoản mới",
    login_placeholder: "Nhập tên đăng nhập",
    pass_placeholder: "Nhập mật khẩu",
    
    // Setup
    setup_title: "Cấu hình AOE Launcher",
    select_language: "Chọn ngôn ngữ",
    select_game_path: "Đường dẫn cài đặt AOE (Empires.exe)",
    browse: "Chọn file...",
    start_app: "Bắt đầu sử dụng",
    
    // Rooms
    rooms_title: "Phòng chơi",
    create_room: "Tạo phòng",
    join: "Tham gia",
    leave: "Rời phòng",
    players: "Người chơi",
    full: "Đầy",
    waiting: "Đang chờ",
    custom_room: "Phòng tự tạo",
    default_room: "Phòng mặc định",
    public_rooms: "Phòng công cộng",
    
    // Create/Join Room
    room_name: "Tên phòng",
    max_players: "Số người tối đa",
    radmin_id: "Radmin Network ID",
    radmin_pass: "Radmin Password",
    create: "Tạo mới",
    cancel: "Hủy",
    enter_password: "Nhập mật khẩu phòng",
    private_notice: "Phòng này yêu cầu mật khẩu",
    radmin_notice: "* Tạo một mạng trong Radmin VPN và nhập thông tin vào đây.",
    no_public_rooms: "Hiện tại không có phòng công cộng nào.",
    be_first_host: "Hãy là người đầu tiên tạo trận đấu!",
    private_in_app: "Phòng riêng (Mật khẩu ứng dụng)",
    room_name_placeholder: "Nhập tên phòng",
    radmin_id_placeholder: "Nhập ID mạng",
    radmin_pass_placeholder: "Nhập mật khẩu mạng",
    
    // In Room
    how_it_works: "Cách thức hoạt động",
    how_it_works_desc: "Chúng tôi sẽ tự động mở Radmin VPN và tham gia vào mạng của chủ phòng. Bạn chỉ cần vào game AOE, chọn Multiplayer > TCP/IP và tìm thấy mạng của bạn bè.",
    launch_game: "Khởi động Game",
    launch_desc: "Tự động mở Empires.exe và kết nối",
    room_owner: "Chủ phòng",
    
    // Settings
    settings: "Cài đặt",
    language: "Ngôn ngữ",
    theme: "Giao diện",
    logout: "Đăng xuất",
  },
  en: {
    // Auth
    login: "Login",
    register: "Register",
    username: "Username",
    password: "Password",
    confirm_password: "Confirm Password",
    back_to_login: "Back to Login",
    no_account: "Don't have an account?",
    have_account: "Already have an account?",
    welcome_back: "Welcome back!",
    create_account: "Create your account",
    login_placeholder: "Enter username",
    pass_placeholder: "Enter password",
    
    // Setup
    setup_title: "AOE Launcher Setup",
    select_language: "Select Language",
    select_game_path: "AOE Game Path (Empires.exe)",
    browse: "Browse...",
    start_app: "Get Started",
    
    // Rooms
    rooms_title: "Multiplayer Rooms",
    create_room: "Create Room",
    join: "Join",
    leave: "Leave",
    players: "Players",
    full: "Full",
    waiting: "Waiting",
    custom_room: "Custom Room",
    default_room: "Default Room",
    public_rooms: "Public Rooms",
    
    // Create/Join Room
    room_name: "Room Name",
    max_players: "Max Players",
    radmin_id: "Radmin Network ID",
    radmin_pass: "Radmin Password",
    create: "Create",
    cancel: "Cancel",
    enter_password: "Enter room password",
    private_notice: "This room requires a password",
    radmin_notice: "* Create a network in Radmin VPN and enter details here.",
    no_public_rooms: "No public rooms available at the moment.",
    be_first_host: "Be the first to host a custom match!",
    private_in_app: "Private room (In-app password)",
    room_name_placeholder: "Enter room name",
    radmin_id_placeholder: "Network ID",
    radmin_pass_placeholder: "Password",
    
    // In Room
    how_it_works: "How it works",
    how_it_works_desc: "We'll automatically open Radmin VPN and join the host's network. Just launch AOE, go to Multiplayer > TCP/IP, and you'll find the match.",
    launch_game: "Launch Game",
    launch_desc: "Automatically open Empires.exe",
    room_owner: "Room Owner",
    
    // Settings
    settings: "Settings",
    language: "Language",
    theme: "Theme",
    logout: "Logout",
  }
};

export type Language = "vi" | "en";

export function useI18n() {
  const [lang, setLang] = useState<Language>("vi");

  useEffect(() => {
    // Load preference from electron-store via preload
    const savedLang = (window as any).electron?.store?.get("language") as Language;
    if (savedLang && translations[savedLang]) {
      setLang(savedLang);
    }
  }, []);

  const t = (key: keyof typeof translations.vi) => {
    return translations[lang][key] || translations.en[key] || key;
  };

  const changeLanguage = (newLang: Language) => {
    setLang(newLang);
    (window as any).electron?.store?.set("language", newLang);
  };

  return { t, lang, changeLanguage };
}
