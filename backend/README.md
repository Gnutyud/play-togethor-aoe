# AOE Launcher Backend

Backend API for Age of Empires I Online Multiplayer Launcher built with Next.js 15.

## 🚀 Features

- **Next.js 15** with App Router
- **React 19**
- **MongoDB Atlas** for database
- **JWT Authentication**
- **10 Default Public Rooms** + Unlimited Custom Rooms
- **Max 8 Players/Room** validation
- **Radmin VPN Network Management**
- **Auto-cleanup** for empty custom rooms

## 📋 Prerequisites

- Node.js 18+
- MongoDB Atlas account (free tier)
- 50 Radmin VPN networks pre-created (Network1-50)

## 🛠️ Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and add your:

- MongoDB connection string
- JWT secrets
- Radmin VPN network IDs and passwords

### 3. Seed Default Rooms

```bash
npm run seed
```

This creates 10 default public rooms in MongoDB.

### 4. Run Development Server

```bash
npm run dev
```

Server will start at `http://localhost:3000`

## 📁 Project Structure

```
backend/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── api/                  # API Routes
│   │   │   ├── auth/            # Authentication endpoints
│   │   │   └── rooms/           # Room management endpoints
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── lib/                      # Shared libraries
│   │   ├── mongodb.ts           # Database connection
│   │   ├── auth.ts              # JWT utilities
│   │   ├── validation.ts        # Zod schemas
│   │   ├── models/              # Mongoose models
│   │   │   ├── User.ts
│   │   │   └── Room.ts
│   │   └── services/            # Business logic
│   │       └── RadminNetworkPool.ts
│   └── scripts/                 # Utility scripts
│       ├── seed-rooms.ts        # Seed default rooms
│       └── cleanup-rooms.ts     # Auto-cleanup cron job
├── package.json
├── tsconfig.json
├── next.config.js
└── .env.example
```

## 🔑 Environment Variables

Required environment variables:

- `MONGODB_URI` - MongoDB Atlas connection string
- `JWT_SECRET` - Secret for access tokens
- `JWT_REFRESH_SECRET` - Secret for refresh tokens
- `RADMIN_NETWORK_1_ID` through `RADMIN_NETWORK_50_ID` - Radmin VPN network IDs
- `RADMIN_NETWORK_1_PASSWORD` through `RADMIN_NETWORK_50_PASSWORD` - Network passwords

## 🚢 Deployment

Deploy to Vercel:

```bash
vercel
```

Make sure to:

1. Set all environment variables in Vercel dashboard
2. Configure deployment region to Singapore (`sin1`) for best ping from Vietnam
3. MongoDB Atlas IP whitelist should include `0.0.0.0/0` for Vercel

## 📊 Database Schema

### User Model

```typescript
{
  username: string;
  password: string; // bcrypt hash
  currentRoomId?: string;
  createdAt: Date;
}
```

### Room Model

```typescript
{
  type: 'default' | 'custom';
  name: string;
  password?: string; // bcrypt hash (optional)
  maxPlayers: number; // default 8
  players: [{
    userId: string;
    username: string;
    lastSeen: Date;
  }];
  radminNetworkId: string;
  radminNetworkPassword: string;
  ownerId?: string; // for custom rooms
  createdAt: Date;
  lastActivity: Date;
}
```

## 🧪 Testing

Test API endpoints with tools like Postman or curl:

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'

# List rooms
curl http://localhost:3000/api/rooms
```

## 📝 License

MIT
