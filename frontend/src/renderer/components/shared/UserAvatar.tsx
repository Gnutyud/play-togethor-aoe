import React from "react";

interface UserAvatarProps {
  username: string;
  size?: number;
  className?: string;
}

const colors = [
  "bg-red-500",
  "bg-blue-500",
  "bg-green-500",
  "bg-yellow-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-teal-500",
  "bg-orange-500",
  "bg-cyan-500",
];

const UserAvatar: React.FC<UserAvatarProps> = ({ username, size = 10, className = "" }) => {
  // Simple hash for deterministic color
  const hash = Array.from(username).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colorClass = colors[hash % colors.length];
  const initial = username.charAt(0).toUpperCase();

  return (
    <div
      className={`flex items-center justify-center rounded-full text-white font-bold shrink-0 shadow-sm ${colorClass} ${className}`}
      style={{
        width: `${size * 4}px`,
        height: `${size * 4}px`,
        fontSize: `${size * 1.5}px`,
      }}
    >
      {initial}
    </div>
  );
};

export default UserAvatar;
