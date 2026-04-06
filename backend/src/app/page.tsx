export default function Home() {
  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>🎮 AOE Launcher API</h1>
      <p>Backend API for Age of Empires I Online Multiplayer Launcher</p>

      <h2>Status</h2>
      <p>✅ Server is running</p>

      <h2>API Endpoints</h2>
      <ul>
        <li>
          <code>POST /api/auth/register</code> - Register new user
        </li>
        <li>
          <code>POST /api/auth/login</code> - Login user
        </li>
        <li>
          <code>GET /api/auth/me</code> - Get current user
        </li>
        <li>
          <code>GET /api/rooms</code> - List all rooms
        </li>
        <li>
          <code>POST /api/rooms</code> - Create custom room
        </li>
        <li>
          <code>POST /api/rooms/[id]/join</code> - Join room
        </li>
        <li>
          <code>POST /api/rooms/[id]/leave</code> - Leave room
        </li>
        <li>
          <code>DELETE /api/rooms/[id]</code> - Delete custom room (owner only)
        </li>
        <li>
          <code>GET /api/rooms/updates</code> - Poll for updates
        </li>
      </ul>

      <h2>Documentation</h2>
      <p>
        For detailed API documentation, visit{" "}
        <a
          href="https://github.com/your-repo/aoe-launcher"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub Repository
        </a>
      </p>
    </main>
  );
}
