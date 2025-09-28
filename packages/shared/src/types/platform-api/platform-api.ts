/**
 * Platform API interface with consolidated domain structure
 */

import { AuthAPI } from "./domains/auth-api";
import { ServerAPI } from "./domains/server-api";
import { AppAPI } from "./domains/app-api";
import { SystemAPI } from "./domains/system-api";
import { SettingsAPI } from "./domains/settings-api";
import { LogAPI } from "./domains/log-api";
import { WorkspaceAPI } from "./domains/workspace-api";

/**
 * Main Platform API interface with domain-driven structure
 * Consolidates related functionality into logical domains
 */
export interface PlatformAPI {
  // Authentication domain
  auth: AuthAPI;

  // Server management domain
  servers: ServerAPI;

  // Application management domain (includes token management)
  apps: AppAPI;

  // Settings management domain
  settings: SettingsAPI;

  // Log management domain
  logs: LogAPI;

  // Workspace management domain
  workspaces: WorkspaceAPI;

  // System utilities domain
  system: SystemAPI;
}
