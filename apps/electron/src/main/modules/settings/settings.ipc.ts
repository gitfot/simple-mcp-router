import { ipcMain } from "electron";
import { getSettingsService } from "@/main/modules/settings/settings.service";

export function setupSettingsHandlers(): void {
  ipcMain.handle("settings:get", () => {
    try {
      const settingsService = getSettingsService();
      return settingsService.getSettings();
    } catch (error) {
      console.error("Failed to get settings:", error);
      return { authBypassEnabled: false };
    }
  });

  ipcMain.handle("settings:save", (_, settings: any) => {
    try {
      const settingsService = getSettingsService();
      return settingsService.saveSettings(settings);
    } catch (error) {
      console.error("Failed to save settings:", error);
      return false;
    }
  });

}
