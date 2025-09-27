import { ipcMain, app } from "electron";
import { commandExists } from "@/main/utils/env-utils";
import { API_BASE_URL } from "@/main";
export function setupSystemHandlers(): void {
  // System info and commands
  ipcMain.handle("system:getPlatform", () => {
    return process.platform;
  });

  // Check if a command exists in user shell environment
  ipcMain.handle("system:commandExists", async (_, command: string) => {
    const result = await commandExists(command);
    return result;
  });

  // Feedback submission
  ipcMain.handle("system:submitFeedback", async (_, feedback: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ feedback }),
      });
      return response.ok;
    } catch (error) {
      console.error("Failed to submit feedback:", error);
      return false;
    }
  });

  // Application restart
  ipcMain.handle("system:restartApp", () => {
    app.quit();
    return true;
  });
}
