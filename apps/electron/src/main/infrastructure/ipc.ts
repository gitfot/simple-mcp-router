import { setupAuthHandlers } from "../modules/auth/auth.ipc";
import { setupMcpServerHandlers } from "../modules/mcp-server-manager/mcp-server-manager.ipc";
import { setupLogHandlers } from "../modules/mcp-logger/mcp-logger.ipc";
import { setupSettingsHandlers } from "../modules/settings/settings.ipc";
import { setupMcpAppsHandlers } from "../modules/mcp-apps-manager/mcp-apps-manager.ipc";
import { setupSystemHandlers } from "../modules/system/system-handler";
import { setupWorkspaceHandlers } from "../modules/workspace/workspace.ipc";

/**
 * Registers all IPC handlers used by the application.
 */
export function setupIpcHandlers(): void {
  setupAuthHandlers();
  setupMcpServerHandlers();
  setupLogHandlers();
  setupSettingsHandlers();
  setupMcpAppsHandlers();
  setupSystemHandlers();
  setupWorkspaceHandlers();
}
