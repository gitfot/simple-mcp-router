import { app, BrowserWindow, session, shell } from "electron";
import path from "node:path";
import { MCPServerManager } from "@/main/modules/mcp-server-manager/mcp-server-manager";
import { AggregatorServer } from "@/main/modules/mcp-server-runtime/aggregator-server";
import { MCPHttpServer } from "@/main/modules/mcp-server-runtime/http/mcp-http-server";
import started from "electron-squirrel-startup";
import { setApplicationMenu } from "@/main/ui/menu";
import { createTray, updateTrayContextMenu } from "@/main/ui/tray";
import { importExistingServerConfigurations } from "@/main/modules/mcp-apps-manager/mcp-config-importer";
import { getPlatformAPIManager } from "@/main/modules/workspace/platform-api-manager";
import { getWorkspaceService } from "@/main/modules/workspace/workspace.service";
import { setupIpcHandlers } from "./main/infrastructure/ipc";
import { initializeEnvironment, isDevelopment } from "@/main/utils/environment";

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  // If we can't get the lock, it means another instance is running
  // Exit this instance, but the first instance will be notified via second-instance event
  app.exit();
}

// Listen for second instance launches and focus the existing window
app.on("second-instance", (_event, commandLine) => {
  // Show the app in the Dock on macOS
  if (process.platform === "darwin" && app.dock) {
    app.dock.show();
  }

  // Focus the existing window
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  } else {
    createWindow();
  }

  // Check for protocol URLs in the command line arguments
  // Protocol URLs would be the last argument in the command line
  const url = commandLine.find((arg) => arg.startsWith("mcpr://"));
  if (url) {
    handleProtocolUrl(url);
  }
});

// Squirrel銇垵鍥炶捣鍕曟檪銇嚘鐞?if (started) app.quit();

// Global references
export let mainWindow: BrowserWindow | null = null;
// Flag to track if app.quit() was explicitly called
let isQuitting = false;
// Timer for updating tray context menu
let trayUpdateTimer: NodeJS.Timeout | null = null;

export const BASE_URL = "https://mcp-router.net/";
// export const BASE_URL = 'http://localhost:3001/';
export const API_BASE_URL = `${BASE_URL}api`;

// Declare global variables defined by Electron Forge
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string | undefined;
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;

// 銈般儹銉笺儛銉鏁般伄瀹ｈ█锛堝垵鏈熷寲銇緦銇ц銇嗭級
let serverManager: MCPServerManager;
let aggregatorServer: AggregatorServer;
let mcpHttpServer: MCPHttpServer | null = null;

// MCPServerManager銈ゃ兂銈广偪銉炽偣銈掑彇寰椼仚銈嬮枹鏁般倰銈般儹銉笺儛銉伀鍏枊
(global as any).getMCPServerManager = () => serverManager;
// AggregatorServer銈ゃ兂銈广偪銉炽偣銈掑彇寰椼仚銈嬮枹鏁般倰銈般儹銉笺儛銉伀鍏枊
(global as any).getAggregatorServer = () => aggregatorServer;

const createWindow = () => {
  // Platform-specific window options
  const windowOptions: Electron.BrowserWindowConstructorOptions = {
    width: 950,
    height: 650,
    minWidth: 600,
    minHeight: 400,
    title: "MCP Router",
    icon: path.join(__dirname, "assets/icon.png"),
    autoHideMenuBar: true,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      contextIsolation: true,
      nodeIntegration: false,
      devTools: isDevelopment(),
    },
  };

  // Platform-specific title bar configuration
  if (process.platform === "darwin") {
    // macOS: hidden title bar with traffic light buttons
    windowOptions.titleBarStyle = "hidden";
    windowOptions.trafficLightPosition = { x: 20, y: 19 }; // y = (50-12)/2 鈮?19 for vertical center
  } else if (process.platform === "win32") {
    // Windows: use titleBarOverlay for custom title bar
    windowOptions.titleBarStyle = "hidden";
    windowOptions.titleBarOverlay = {
      height: 50,
    };
  } else {
    // Linux: use default title bar
    windowOptions.frame = true;
  }

  // Create the browser window.
  mainWindow = new BrowserWindow(windowOptions);

  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  // Handle window close event - hide instead of closing completely
  mainWindow.on("close", (event) => {
    // 濡傛灉閫氳繃 app.quit() 涓诲姩閫€鍑猴紝鍒欏厑璁哥獥鍙ｅ叧闂?    if (isQuitting) return;

    // Otherwise prevent the window from closing by default
    event.preventDefault();

    if (mainWindow) {
      // Just hide the window instead of closing it
      mainWindow.hide();

      // Hide the app from the Dock on macOS when window is closed
      if (process.platform === "darwin" && app.dock) {
        app.dock.hide();
      }
    }
  });

  // Handle actual window closed event if it occurs
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  if (isDevelopment()) {
    mainWindow.webContents.openDevTools();
  }
};

/**
 * Sets up a timer to periodically update the tray context menu
 * @param serverManager The MCPServerManager instance
 * @param intervalMs Time between updates in milliseconds
 */
function setupTrayUpdateTimer(
  serverManager: MCPServerManager,
  intervalMs = 5000,
) {
  if (trayUpdateTimer) {
    clearInterval(trayUpdateTimer);
  }

  trayUpdateTimer = setInterval(() => {
    updateTrayContextMenu(serverManager);
  }, intervalMs);
}

/**
 * 銉囥兗銈裤儥銉笺偣銇垵鏈熷寲銈掕銇? */
async function initDatabase(): Promise<void> {
  try {
    // 銉兗銈偣銉氥兗銈广偟銉笺儞銈广伅鑷嫊鐨勩伀銉°偪銉囥兗銈裤儥銉笺偣銈掑垵鏈熷寲銇欍倠
    const workspaceService = getWorkspaceService();

    // 銈偗銉嗐偅銉栥仾銉兗銈偣銉氥兗銈广倰鍙栧緱
    const activeWorkspace = await workspaceService.getActiveWorkspace();
    if (!activeWorkspace) {
      // 銉囥儠銈┿儷銉堛儻銉笺偗銈广儦銉笺偣銇屻仾銇勫牬鍚堛伅浣滄垚
      await workspaceService.switchWorkspace("local-default");
    }

    // 銉兗銈偣銉氥兗銈瑰浐鏈夈伄銉囥兗銈裤儥銉笺偣銇優銈ゃ偘銉兗銈枫儳銉炽伅
    // PlatformAPIManager銇屽垵鏈熷寲鏅傘伀瀹熻銇欍倠
  } catch (error) {
    console.error(
      "銉囥兗銈裤儥銉笺偣銉炪偆銈般儸銉笺偡銉с兂涓伀銈ㄣ儵銉笺亴鐧虹敓銇椼伨銇椼仧:",
      error,
    );
  }
}

/**
 * MCP闁㈤€ｃ偟銉笺儞銈广伄鍒濇湡鍖栥倰琛屻亞
 */
async function initMCPServices(): Promise<void> {
  // Platform API銉炪儘銉笺偢銉ｃ兗銇垵鏈熷寲锛堛儻銉笺偗銈广儦銉笺偣DB銈掕ō瀹氾級
  await getPlatformAPIManager().initialize();

  // MCPServerManager銇垵鏈熷寲
  serverManager = new MCPServerManager();

  // 銉囥兗銈裤儥銉笺偣銇嬨倝銈点兗銉愩兗銉偣銉堛倰瑾伩杈笺個
  await serverManager.initializeAsync();

  // AggregatorServer銇垵鏈熷寲
  aggregatorServer = new AggregatorServer(serverManager);

  // HTTPサーバーを初期化
  const httpServer = new MCPHttpServer(serverManager, 3282, aggregatorServer);
  mcpHttpServer = httpServer;
  try {
    await httpServer.start();
  } catch (error) {
    console.error("Failed to start MCP HTTP Server:", error);
  }

  // 鏃㈠瓨銇甅CP銈点兗銉愩兗瑷畾銈掋偆銉炽儩銉笺儓
  await importExistingServerConfigurations();
}

/**
 * 銉︺兗銈躲兗銈ゃ兂銈裤兗銉曘偋銉笺偣闁㈤€ｃ伄鍒濇湡鍖栥倰琛屻亞
 */
function initUI(): void {
  // 銉°偆銉炽偊銈ｃ兂銉夈偊浣滄垚
  createWindow();

  // Platform API銉炪儘銉笺偢銉ｃ兗銇儭銈ゃ兂銈︺偅銉炽儔銈︺倰瑷畾
  if (mainWindow) {
    getPlatformAPIManager().setMainWindow(mainWindow);
  }

  // システムトレイを作成
  createTray(serverManager);

  // トレイメニューを定期更新
  setupTrayUpdateTimer(serverManager);
}

/**
 * 銈儣銉偙銉笺偡銉с兂鍏ㄤ綋銇垵鏈熷寲銈掕銇? */
async function initApplication(): Promise<void> {
  // 鐠板瑷畾銈掑垵鏈熷寲
  initializeEnvironment();
  const DEV_CSP = `
    default-src 'self' 'unsafe-inline' http://localhost:* ws://localhost:*;
    script-src 'self' 'unsafe-eval' 'unsafe-inline';
    connect-src 'self' http://localhost:* ws://localhost:* https://mcp-router.net https://staging.mcp-router.net https://us.i.posthog.com https://us-assets.i.posthog.com;
    img-src 'self' data:;
  `
    .replace(/\s+/g, " ")
    .trim();

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [DEV_CSP],
      },
    });
  });

  // 銈儣銉偙銉笺偡銉с兂鍚嶃倰瑷畾
  app.setName("MCP Router");

  // アプリケーションメニューを設定
  setApplicationMenu();

  // システム起動時の自動起動を設定
  if (!app.getLoginItemSettings().openAtLogin) {
    app.setLoginItemSettings({
      openAtLogin: true,
    });
  }

  // データベース初期化
  await initDatabase();

  // MCPサービス初期化
  await initMCPServices();

  // IPC閫氫俊銉忋兂銉夈儵銇垵鏈熷寲
  setupIpcHandlers();

  // UI初期化
  initUI();
}

app.on("ready", initApplication);

// Keep the app running when all windows are closed
// The app will continue to run in the background with only the tray icon visible
app.on("window-all-closed", () => {
  // Don't quit the app regardless of platform
  // The app will remain active with the tray icon
  if (process.platform === "darwin" && app.dock) {
    app.dock.hide(); // Hide from dock when all windows are closed
  }
  // console.log('All windows closed, app continues running in the background');
});

app.on("activate", () => {
  // Show the app in the Dock on macOS when activated
  if (process.platform === "darwin" && app.dock) {
    app.dock.show();
  }

  // Re-create a window if there are no windows open
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  } else {
    if (mainWindow && mainWindow.isMinimized()) mainWindow.restore();
    if (mainWindow) mainWindow.show();
    if (mainWindow) mainWindow.focus();
  }
});

// Register the app as default handler for mcpr:// protocol
app.whenReady().then(() => {
  app.setAsDefaultProtocolClient("mcpr");
});

// Handle the mcpr:// protocol on macOS
app.on("open-url", (event, url) => {
  event.preventDefault();

  // Store the URL to be processed after app is ready if needed
  const processUrl = () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    } else if (app.isReady()) {
      createWindow();
    } else {
      // If app is not ready yet, wait until it is before creating the window
      app.whenReady().then(() => {
        createWindow();
        // Process the URL after the window is created
        handleProtocolUrl(url);
      });
      return; // Return early to avoid processing URL twice
    }
    handleProtocolUrl(url);
  };

  processUrl();
});

// Clean up when quitting
app.on("will-quit", async () => {
  // Clear the tray update timer
  if (trayUpdateTimer) {
    clearInterval(trayUpdateTimer);
    trayUpdateTimer = null;
  }
  // Stop the HTTP server
  if (mcpHttpServer) {
    try {
      await mcpHttpServer.stop();
    } catch (error) {
      console.error("Failed to stop MCP HTTP Server:", error);
    }
  }

  serverManager.shutdown();
  aggregatorServer.shutdown();
});

// Override the default app.quit to set our isQuitting flag first
const originalQuit = app.quit;
app.quit = function (...args) {
  // Set the flag to allow the window to close
  isQuitting = true;
  // Call the original quit method
  return originalQuit.apply(this, args);
};

// Process protocol URLs (mcpr://) - replaces the old protocol.registerHttpProtocol handler
export async function handleProtocolUrl(urlString: string) {
  try {
    if (mainWindow) {
      mainWindow.webContents.send("protocol:url", urlString);
    }
  } catch (error) {
    console.error("Failed to process protocol URL:", error);
  }
}



