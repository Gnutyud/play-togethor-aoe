import { BrowserWindow } from "electron";

let splashWindow: BrowserWindow | null = null;

/**
 * Create and show the splash screen for Radmin VPN installation
 */
export function createSplashWindow(): BrowserWindow {
  splashWindow = new BrowserWindow({
    width: 450,
    height: 250,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    center: true,
    resizable: false,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Load splash HTML content
  const splashHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
         
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: transparent;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            overflow: hidden;
          }
         
          .splash-container {
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
            padding: 40px;
            text-align: center;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
          }
         
          .title {
            color: #ffffff;
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 10px;
          }
         
          .subtitle {
            color: #b8c9e8;
            font-size: 14px;
            margin-bottom: 30px;
          }
         
          .progress-container {
            width: 100%;
            max-width: 300px;
            margin: 20px 0;
          }
         
          .progress-bar {
            width: 100%;
            height: 8px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 4px;
            overflow: hidden;
          }
         
          .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #4CAF50, #81C784);
            border-radius: 4px;
            transition: width 0.3s ease;
            width: 0%;
          }
         
          .progress-text {
            color: #ffffff;
            font-size: 16px;
            margin-top: 15px;
            font-weight: 500;
          }
         
          .spinner {
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-top: 3px solid #ffffff;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 20px auto 0;
          }
         
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
         
          .status {
            color: #b8c9e8;
            font-size: 12px;
            margin-top: 15px;
          }
        </style>
      </head>
      <body>
        <div class="splash-container">
          <div class="title">AOE Launcher</div>
          <div class="subtitle">Setting up your game environment</div>
         
          <div class="progress-container">
            <div class="progress-bar">
              <div class="progress-fill" id="progressFill"></div>
            </div>
            <div class="progress-text" id="progressText">0%</div>
          </div>
         
          <div class="spinner"></div>
          <div class="status" id="statusText">Installing Radmin VPN...</div>
        </div>
       
        <script>
          // Listen for progress updates from main process
          window.addEventListener('message', (event) => {
            if (event.data.type === 'progress') {
              const percent = event.data.percent;
              document.getElementById('progressFill').style.width = percent + '%';
              document.getElementById('progressText').textContent = Math.round(percent) + '%';
            }
            if (event.data.type === 'status') {
              document.getElementById('statusText').textContent = event.data.message;
            }
          });
        </script>
      </body>
    </html>
  `;

  splashWindow.loadURL(
    `data:text/html;charset=utf-8,${encodeURIComponent(splashHtml)}`
  );

  return splashWindow;
}

/**
 * Update splash window progress
 */
export function updateSplashProgress(percent: number): void {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.webContents.send("message", { type: "progress", percent });
  }
}

/**
 * Update splash window status message
 */
export function updateSplashStatus(message: string): void {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.webContents.send("message", { type: "status", message });
  }
}

/**
 * Close and destroy the splash window
 */
export function closeSplashWindow(): void {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.close();
    splashWindow = null;
  }
}

/**
 * Get the current splash window instance
 */
export function getSplashWindow(): BrowserWindow | null {
  return splashWindow;
}
