/**
 * Augment the global Window interface so TypeScript knows about "window.electronAPI".
 */

import { AppSettings, CreateServerInput } from "@mcp_router/shared";
import { McpAppsManagerResult, McpApp } from "@/main/modules/mcp-apps-service";

declare global {
  interface Window {
    electronAPI: {
      // Authentication
      login: (idp?: string) => Promise<boolean>;
      logout: () => Promise<boolean>;
      getAuthStatus: (
        forceRefresh?: boolean,
      ) => Promise<{
        authenticated: boolean;
        userId?: string;
        user?: any;
        token?: string;
      }>;
      handleAuthToken: (token: string, state?: string) => Promise<boolean>;
      onAuthStatusChanged: (
        callback: (status: {
          loggedIn: boolean;
          userId?: string;
          user?: any;
        }) => void,
      ) => () => void;

      // MCP Server management
      listMcpServers: () => Promise<any>;
      startMcpServer: (id: string) => Promise<boolean>;
      stopMcpServer: (id: string) => Promise<boolean>;
      addMcpServer: (input: CreateServerInput) => Promise<any>;
      serverSelectFile: (options: any) => Promise<any>;
      removeMcpServer: (id: string) => Promise<any>;
      updateMcpServerConfig: (id: string, config: any) => Promise<any>;

      // Request logs
      getRequestLogs: (options?: {
        clientId?: string;
        serverId?: string;
        requestType?: string;
        startDate?: Date;
        endDate?: Date;
        responseStatus?: "success" | "error";
        cursor?: string;
        limit?: number;
      }) => Promise<{
        logs: any[];
        total: number;
        nextCursor?: string;
        hasMore: boolean;
      }>;

      // Settings
      getSettings: () => Promise<AppSettings>;
      saveSettings: (settings: AppSettings) => Promise<boolean>;

      // MCP Apps
      listMcpApps: () => Promise<McpApp[]>;
      addMcpAppConfig: (appName: string) => Promise<McpAppsManagerResult>;
      deleteMcpApp: (appName: string) => Promise<boolean>;
      updateAppServerAccess: (
        appName: string,
        serverIds: string[],
      ) => Promise<McpAppsManagerResult>;
      unifyAppConfig: (appName: string) => Promise<McpAppsManagerResult>;

      // System utilities
      getPlatform: () => Promise<string>;
      onProtocolUrl: (callback: (url: string) => void) => () => void;

      // Workspace management
      listWorkspaces: () => Promise<any[]>;
      createWorkspace: (config: any) => Promise<any>;
      updateWorkspace: (
        id: string,
        updates: any,
      ) => Promise<{ success: boolean }>;
      deleteWorkspace: (id: string) => Promise<{ success: boolean }>;
      switchWorkspace: (id: string) => Promise<{ success: boolean }>;
      getCurrentWorkspace: () => Promise<any>;
      getWorkspaceCredentials: (
        id: string,
      ) => Promise<{ token: string | null }>;
      onWorkspaceSwitched: (callback: (workspace: any) => void) => () => void;
      onWorkspaceConfigChanged: (callback: (config: any) => void) => () => void;
    };
  }
}
