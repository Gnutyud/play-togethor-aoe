# AOE I Online Multiplayer Launcher
 
Build an AOE I online multiplayer launcher using Electron + React 19 + Next.js 15 + Radmin VPN.
 
## 🎮 Features
 
- **10 Default Public Rooms** - Instant play, no setup required
- **Custom Private Rooms** - Create password-protected rooms
- **Max 8 Players/Room** - Optimal for AOE I LAN games
- **Room Isolation** - Each room uses separate Radmin VPN network
- **Auto VPN Connection** - Automatic Radmin VPN setup when joining rooms
- **Auto-cleanup** - Empty custom rooms deleted after 5 minutes
- **100% Free** - Vercel + MongoDB Atlas free tiers
 
## 📁 Project Structure
 
```
play-together-aoe/
├── backend/              # Next.js 15 API (Vercel deployment)
│   ├── src/
│   │   ├── app/api/     # API routes
│   │   ├── lib/         # Utilities, models, services
│   │   └── scripts/     # Seed & cleanup scripts
│   └── package.json
│
├── frontend/             # Electron + React 19 app (Coming next)
│   ├── src/
│   │   ├── main/        # Electron main process
│   │   └── renderer/    # React UI
│   └── package.json
│
└── package.json         # Monorepo root
```
 
## 🚀 Quick Start
 
### Prerequisites
 
1. **Node.js 18+**
2. **MongoDB Atlas Account** (free tier)
3. **50 Radmin VPN Networks** pre-created:
   - Network1-10 for default rooms
   - Network11-50 for custom rooms pool
4. **For building on macOS (optional):**
   - Wine: `brew install --cask wine-stable`
   - Required to build Windows .exe from macOS
   - Or use GitHub Actions for automated builds
 
### Backend Setup
 
```bash
# 1. Navigate to backend
cd backend
 
# 2. Install dependencies
npm install
 
# 3. Configure environment variables
cp .env.dev .env
# Edit .env with your MongoDB URI and Radmin network IDs
 
# 4. Seed default rooms
npm run seed
 
# 5. Start development server
npm run dev
```
 
Backend will be running at `http://localhost:3000`
 
### Test API
 
```bash
# Register a user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"player1","password":"pass123"}'
 
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"player1","password":"pass123"}'
 
# List rooms
curl http://localhost:3000/api/rooms
```
 
## 📊 API Endpoints
 
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/rooms` | List all rooms |
| POST | `/api/rooms` | Create custom room |
| POST | `/api/rooms/[id]/join` | Join room |
| POST | `/api/rooms/[id]/leave` | Leave room |
| POST | `/api/rooms/[id]/heartbeat` | Update heartbeat |
| DELETE | `/api/rooms/[id]` | Delete custom room |
| GET | `/api/rooms/updates` | Poll for updates |
 
## 🔧 Environment Variables
 
This project uses separate environment files for development and production.
 
### Quick Setup
 
**Development:**
```bash
# Backend
cd backend
cp .env.dev .env
# Edit .env if needed
 
# Frontend
cd frontend
cp .env.dev .env
npm run dev
```
 
**Production:**
```bash
# Backend
cd backend
cp .env.production .env
# Edit .env with production credentials
 
# Frontend
cd frontend
cp .env.production .env
# Edit VITE_API_BASE_URL
npm run package
```
 
### Backend Environment Variables
 
See `backend/.env.example` for template. Required variables:
 
```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/aoe-launcher
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-key
 
# Radmin Networks (Network1-10 for default rooms)
RADMIN_NETWORK_1_ID=network-id
RADMIN_NETWORK_1_PASSWORD=network-password
# ... repeat for NETWORK_2 through NETWORK_10
 
NODE_ENV=development|production
NEXT_PUBLIC_API_URL=http://localhost:3000
```
 
### Frontend Environment Variables
 
```env
VITE_API_BASE_URL=http://localhost:3000
VITE_API_TIMEOUT=30000
VITE_NODE_ENV=development
VITE_ENABLE_DEBUG_LOGS=true
VITE_ENABLE_DEV_TOOLS=true
VITE_RADMIN_AUTO_CONNECT=false
VITE_RADMIN_CONNECTION_TIMEOUT=10000
VITE_GAME_CHECK_INTERVAL=5000
```
 
**Production secrets generation:**
```bash
# Generate secure JWT secrets
openssl rand -base64 32
```
 
📖 **Detailed guide:** See [ENV_SETUP.md](ENV_SETUP.md)
 
## 🚢 Deployment
 
### Deploy Backend to Vercel
 
```bash
cd backend
vercel
```
 
Configure in Vercel dashboard:
- Add all environment variables
- Set region to Singapore (sin1)
- MongoDB Atlas: whitelist `0.0.0.0/0`
 
### Setup Cron Job for Cleanup
 
In Vercel, create `vercel.json`:
 
```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup",
      "schedule": "*/1 * * * *"
    }
  ]
}
```
 
## 🔄 Continuous Integration (GitHub Actions)
 
This project uses GitHub Actions for automated builds and releases.
 
### Setup GitHub Actions
 
1. **Create workflow directory:**
   ```bash
   mkdir -p .github/workflows
   ```
 
2. **Create `.github/workflows/build-windows.yml`:**
   ```yaml
   name: Build Windows Installer
   
   on:
     push:
       branches: [main, master, develop]
     tags:
       - 'v*'
     workflow_dispatch:
   
   jobs:
     build-windows-installer:
       runs-on: windows-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with:
             node-version: '18'
             cache: 'npm'
             cache-dependency-path: frontend/package-lock.json
         - name: Install dependencies
           working-directory: ./frontend
           run: npm ci
         - name: Create .env
           working-directory: ./frontend
           run: cp .env.production .env
         - name: Build
           working-directory: ./frontend
           run: npm run package
         - name: Upload artifacts
           uses: actions/upload-artifact@v4
           with:
             name: windows-installer
             path: frontend/release/*.exe
   ```
 
3. **Configure repository secrets:**
   - Go to **Settings → Secrets and variables → Actions**
   - Add `VITE_API_BASE_URL` with your production API URL
 
4. **Enable Actions:**
   - Go to **Actions** tab → **Enable Actions**
 
### Triggering Builds
 
**Automatic builds:**
- Push to `main`/`master`/`develop` branches
- Pull requests
- Git tags starting with `v` (creates release)
 
**Manual builds:**
- Go to **Actions** tab → **Build Windows Installer** → **Run workflow**
 
**Create release:**
```bash
git tag v1.0.0
git push origin main
git push origin v1.0.0
```
 
### Build Artifacts
 
After successful builds, download from **Actions** tab:
- `windows-installer` - Windows installer (.exe)
- Artifacts retained for 30 days
 
### Frontend Setup (Electron App)
 
```bash
# 1. Navigate to frontend
cd frontend
 
# 2. Install dependencies
npm install
 
# 3. Place Radmin VPN installer
# Download Radmin VPN installer from https://www.radmin-vpn.com/
# Rename to: Radmin_VPN_2.0.4899.9.exe (or update the filename in RadminInstaller.ts)
# Place in: frontend/resources/Radmin_VPN_2.0.4899.9.exe
 
# 4. Start development mode
npm run dev
```
 
**Development Mode:**
- Vite server runs on `http://localhost:5173`
- TypeScript watch mode for main process
- Electron launches with DevTools open
- Hot reload for renderer process
 
### Important Files for Setup
 
**Radmin VPN Installer:**
- **Location:** `frontend/resources/Radmin_VPN_2.0.4899.9.exe`
- **Purpose:** Auto-installed on first app launch
- **Download:** https://www.radmin-vpn.com/
- **Note:** Update filename in `RadminInstaller.ts` if using different version
 
**Game Path:**
- **Supported Executables:** `Empires.exe`, `EmpiresM.exe`, `Empiresx.exe`
- **Selection:** App will prompt to select game folder or executable on first run
- **Note:** Can select either the folder containing the game or the .exe directly
 
## 🏗️ Building for Production
 
### Build Windows Installer
 
**Prerequisites:**
1. Radmin VPN installer must be in `frontend/resources/` folder
2. All dependencies installed: `npm install`
3. Backend API deployed and accessible
 
**Build Steps:**
 
```bash
# Navigate to frontend
cd frontend
 
# Option 1: Quick build (recommended)
npm run package
 
# Option 2: Step by step
# 1. Build TypeScript (main process)
npm run build:main
 
# 2. Build React app (renderer)
npm run build:renderer
 
# 3. Package as Windows installer
npm run package
```
 
**Build Scripts:**
 
| Script | Command | Description |
|--------|---------|-------------|
| `build:main` | `tsc -p tsconfig.main.json` | Compile main process TypeScript |
| `build:renderer` | `vite build` | Build React app for production |
| `build` | Run both main + renderer builds | Full production build |
| `package` | `npm run build && electron-builder build --windows` | Create Windows installer (.exe) |
| `package:portable` | `electron-builder build --windows portable` | Create portable version (no installer) |
 
**Output Location:**
 
After running `npm run package`, the installer will be in:
```
frontend/release/
├── win-unpacked/              # Unpacked application files
└── AOE Launcher Setup.exe     # Windows installer (NSIS)
```
 
**File Size:** Expect ~50-70MB (includes Radmin VPN installer ~15MB)
 
### Installer Features
 
✅ **Auto-install Radmin VPN** - Bundled Radmin installer runs silently on first launch  
✅ **One-click installation** - NSIS installer with custom directory selection  
✅ **Portable resources** - PowerShell scripts and Radmin installer bundled  
✅ **Windows-only** - Optimized for Windows 10/11  
 
### Electron Builder Configuration
 
The app uses `electron-builder` configured in `package.json`:
 
```json
{
  "build": {
    "appId": "com.aoe.launcher",
    "productName": "AOE Launcher",
    "directories": {
      "output": "release",
      "buildResources": "build"
    },
    "files": [
      "dist/**/*",
      "package.json",
      "resources/**/*"
    ],
    "win": {
      "target": [
        {
          "target": "nsis",
          "arch": ["x64"]
        }
      ],
      "icon": "build/icon.ico"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true
    }
  }
}
```
 
**Note:** Create `frontend/build/icon.ico` for app icon, or remove the icon line from config to use default.
 
### Distribution Checklist
 
Before distributing the installer:
 
- [ ] Radmin VPN installer in `frontend/resources/`
- [ ] Backend API deployed to Vercel
- [ ] Update `API_URL` in frontend config to production URL
- [ ] Test fresh install on clean Windows machine
- [ ] Verify auto-install Radmin VPN works
- [ ] Test game path selection
- [ ] Test room creation and joining
- [ ] Test VPN auto-connect functionality
 
### Testing the Installer
 
**On a fresh Windows machine:**
 
1. Uninstall Radmin VPN (if installed)
2. Run `AOE Launcher Setup.exe`
3. Follow installer prompts
4. Launch app from Desktop/Start Menu
5. **Expected behavior:**
   - Splash screen appears
   - Radmin VPN auto-installs (UAC prompt)
   - Main window opens
   - Setup screen shows "Radmin VPN ✓ Installed"
   - Click "Select Game Path" to choose AOE executable
   - Continue to login/register
 
## 📝 Development Status
 
**Backend (Complete ✅):**
- [x] Backend API (Next.js 15)
- [x] MongoDB Models & Connection
- [x] Authentication (JWT)
- [x] Room Management APIs
- [x] Radmin Network Pool Service
- [x] Seed & Cleanup Scripts
- [x] TypeScript type fixes & validation
- [x] Environment configuration (.env.dev, .env.production)
 
**Frontend (Complete ✅):**
- [x] Electron App Setup
- [x] React UI Components (Setup Screen, Login, Rooms)
- [x] Auto-install Radmin VPN on first launch
- [x] PowerShell VPN automation scripts
- [x] Game path detection & validation
- [x] IPC handlers (dependencies, game, VPN)
- [x] Backend API integration
- [x] Room joining & VPN auto-connect
- [x] Game launching with multiplayer parameters
- [x] TypeScript configuration & type safety
- [x] Environment configuration (.env.dev, .env.production)
 
**DevOps & Deployment:**
- [x] Environment files (dev/production) for backend & frontend
- [x] GitHub Actions workflow setup
- [x] Cross-platform build support (Windows on macOS via Wine)
- [x] Automated Windows installer builds
- [ ] Backend deployed to Vercel
- [ ] MongoDB Atlas production configured
- [ ] Windows installer tested on clean machines
- [ ] Production release published
 
## 🐛 Troubleshooting
 
### Build Issues
 
**TypeScript compilation errors:**
```bash
# Clean build
cd frontend
rm -rf dist node_modules
npm install
npm run build
```
 
**Missing Radmin installer:**
```
Error: Radmin VPN installer not found in resources
```
- Download from https://www.radmin-vpn.com/
- Place in `frontend/resources/Radmin_VPN_2.0.4899.9.exe`
- Update filename in `RadminInstaller.ts` if different version
 
### Runtime Issues
 
**Black screen in Electron:**
- Check DevTools console (F12) for React errors
- Ensure backend API is running
- Check `sandbox: false` in webPreferences (needed for preload script)
 
**Radmin VPN not detected:**
- Check installed at: `C:\Program Files (x86)\Radmin VPN\Radmin.exe`
- Executable name must be exactly `Radmin.exe` (not "Radmin VPN.exe")
- Try manual install if auto-install fails
 
**Game path validation fails:**
- Ensure selecting one of: `Empires.exe`, `EmpiresM.exe`, `Empiresx.exe`
- Can select either the .exe file OR the folder containing it
- Check terminal logs for detailed validation messages
 
### Development Mode
 
**Vite server not starting:**
```bash
# Kill processes on port 5173
npx kill-port 5173
npm run dev
```
 
**Electron not launching:**
- Wait for TypeScript compilation to complete
- Check `dist/main/main/main.js` exists
- Ensure `wait-on` dependency installed
 
### Environment & Build Issues
 
**Environment variables not loading:**
- Ensure `.env` exists (copy from `.env.dev` or `.env.production`)
- Frontend: Vite requires `VITE_` prefix for all env vars
- Restart dev server after changing `.env` files
 
**GitHub Actions build fails:**
- Check `package-lock.json` is committed
- Verify all secrets are configured in repository settings
- Check workflow permissions (Settings → Actions → General)
- Enable "Read and write permissions"
 
**Building Windows installer on macOS:**
- Install Wine: `brew install --cask wine-stable`
- Or use GitHub Actions (recommended for cross-platform builds)
 
## 🤝 Contributing
 
This is a personal project. Feel free to fork and modify!
 
## 📄 License
 
MIT
