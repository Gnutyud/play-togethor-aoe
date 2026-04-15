import { useEffect } from "react";
import { useStore } from "../store/useStore";

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
    create: "Tạo mới",
    cancel: "Hủy",
    enter_password: "Nhập mật khẩu phòng",
    private_notice: "Phòng này yêu cầu mật khẩu",
    no_public_rooms: "Hiện tại không có phòng công cộng nào.",
    be_first_host: "Hãy là người đầu tiên tạo trận đấu!",
    private_in_app: "Phòng riêng (Mật khẩu ứng dụng)",
    room_name_placeholder: "Nhập tên phòng",
    // P2P Networking
    ip_address: "Địa chỉ IP",
    secured_mesh: "Mạng P2P Bảo mật",
    connecting_p2p: "Đang ổn định mạng...",
    p2p_connected: "Đã kết nối LAN P2P",
    p2p_notice: "* Hệ thống tự động thiết lập mạng LAN ảo để chơi AOE.",
    
    // In Room
    how_it_works: "Cách thức hoạt động",
    how_it_works_desc: "Chúng tôi tự động thiết lập mạng LAN ảo giữa bạn và người chơi khác. Bạn chỉ cần vào game AOE, chọn Multiplayer > TCP/IP và trò chơi sẽ hiện lên.",
    launch_game: "Khởi động Game",
    launch_desc: "Tự động mở Empires.exe và kết nối",
    room_owner: "Chủ phòng",
    admin_notice: "* Admin: Phòng sẽ tự động đóng khi người chơi cuối cùng rời đi.",
    loading_rooms: "Đang tải danh sách phòng...",
    p2p_failed: "Lỗi kết nối mạng ảo. Vui lòng chạy ứng dụng bằng quyền Admin.",
    change_path: "Đổi đường dẫn Game",
    save_settings: "Lưu cài đặt",
    forgot_password_contact: "Quên mật khẩu? Liên hệ Admin qua Telegram: +84979528296",
    change_password: "Đổi mật khẩu",
    current_password: "Mật khẩu hiện tại",
    new_password: "Mật khẩu mới",
    room_type: "Loại phòng",
    default_type: "Mặc định",
    custom_type: "Tự tạo",
    edit: "Sửa",
    
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
    create: "Create",
    cancel: "Cancel",
    enter_password: "Enter room password",
    private_notice: "This room requires a password",
    no_public_rooms: "No public rooms available at the moment.",
    be_first_host: "Be the first to host a custom match!",
    private_in_app: "Private room (In-app password)",
    room_name_placeholder: "Enter room name",
    // P2P Networking
    ip_address: "Virtual IP Address",
    secured_mesh: "Secured P2P Network",
    connecting_p2p: "Stabilizing network...",
    p2p_connected: "P2P LAN Connected",
    p2p_notice: "* System automatically creates a virtual LAN for AOE.",
    
    // In Room
    how_it_works: "How it works",
    how_it_works_desc: "We automatically establish a virtual LAN between you and other players. Just open AOE, select Multiplayer > TCP/IP and the game will appear.",
    launch_game: "Launch Game",
    launch_desc: "Automatically open Empires.exe",
    room_owner: "Room Owner",
    admin_notice: "* Admin: Room will close automatically when the last player leaves.",
    loading_rooms: "Loading rooms...",
    p2p_failed: "P2P error. Please run the app as Administrator.",
    change_path: "Change Game Path",
    save_settings: "Save Settings",
    forgot_password_contact: "Forgot Password? Contact Admin via Telegram: +84979528296",
    change_password: "Change Password",
    current_password: "Current Password",
    new_password: "New Password",
    room_type: "Room Type",
    default_type: "Default",
    custom_type: "Custom",
    edit: "Edit",
    
    // Settings
    settings: "Settings",
    language: "Language",
    theme: "Theme",
    logout: "Logout",
  }
};

export type Language = "vi" | "en";

export function useI18n() {
  const { lang, setLang } = useStore();

  useEffect(() => {
    // Load preference from electron-store via preload
    const savedLang = (window as any).electron?.store?.get("language") as Language;
    if (savedLang && translations[savedLang]) {
      setLang(savedLang);
    }
  }, [setLang]);

  const t = (key: keyof typeof translations.vi) => {
    return translations[lang][key] || translations.en[key] || key;
  };

  const changeLanguage = (newLang: Language) => {
    setLang(newLang);
    (window as any).electron?.store?.set("language", newLang);
  };

  return { t, lang, changeLanguage };
}
