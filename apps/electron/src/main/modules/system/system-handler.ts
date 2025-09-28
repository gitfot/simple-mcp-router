import { ipcMain } from "electron";

export function setupSystemHandlers(): void {
  ipcMain.handle("system:getPlatform", () => process.platform);
}
