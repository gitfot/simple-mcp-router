// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from "electron";
import { CreateServerInput } from "@mcp_router/shared";

// Consolidate everything into one contextBridge call

contextBridge.exposeInMainWorld("electronAPI", {
  // Authentication
  login: (idp?: string) => ipcRenderer.invoke("auth:login", idp),
  logout: () => ipcRenderer.invoke("auth:logout"),
  getAuthStatus: (forceRefresh?: boolean) =>
    ipcRenderer.invoke("auth:status", forceRefresh),
  handleAuthToken: (token: string, state?: string) =>
    ipcRenderer.invoke("auth:handle-token", token, state),
  onAuthStatusChanged: (callback: (status: any) => void) => {
    const listener = (_: any, status: any) => callback(status);
    ipcRenderer.on("auth:status-changed", listener);
    return () => {
      ipcRenderer.removeListener("auth:status-changed", listener);
    };
  },

  // MCP Server Management
  listMcpServers: () => ipcRenderer.invoke("mcp:list"),
  startMcpServer: (id: string) => ipcRenderer.invoke("mcp:start", id),
  stopMcpServer: (id: string) => ipcRenderer.invoke("mcp:stop", id),
  addMcpServer: (input: CreateServerInput) =>
    ipcRenderer.invoke("mcp:add", input),
  serverSelectFile: (options: any) =>
    ipcRenderer.invoke("server:selectFile", options),
  removeMcpServer: (id: string) => ipcRenderer.invoke("mcp:remove", id),
  updateMcpServerConfig: (id: string, config: any) =>
    ipcRenderer.invoke("mcp:update-config", id, config),

  // Logging
  getRequestLogs: (options?: {
    clientId?: string;
    serverId?: string;
    requestType?: string;
    startDate?: Date;
    endDate?: Date;
    responseStatus?: "success" | "error";
    cursor?: string;
    limit?: number;
  }) => ipcRenderer.invoke("requestLogs:get", options),

  // Settings Management
  getSettings: () => ipcRenderer.invoke("settings:get"),
  saveSettings: (settings: any) =>
    ipcRenderer.invoke("settings:save", settings),

  // MCP Apps Management
  listMcpApps: () => ipcRenderer.invoke("mcp-apps:list"),
  addMcpAppConfig: (appName: string) =>
    ipcRenderer.invoke("mcp-apps:add", appName),
  deleteMcpApp: (appName: string) =>
    ipcRenderer.invoke("mcp-apps:delete", appName),
  updateAppServerAccess: (appName: string, serverIds: string[]) =>
    ipcRenderer.invoke("mcp-apps:update-server-access", appName, serverIds),
  unifyAppConfig: (appName: string) =>
    ipcRenderer.invoke("mcp-apps:unify", appName),

  // System utilities
  getPlatform: () => ipcRenderer.invoke("system:getPlatform"),
  onProtocolUrl: (callback: (url: string) => void) => {
    const listener = (_: any, url: string) => callback(url);
    ipcRenderer.on("protocol:url", listener);
    return () => {
      ipcRenderer.removeListener("protocol:url", listener);
    };
  },

  // Workspace Management
  listWorkspaces: () => ipcRenderer.invoke("workspace:list"),
  createWorkspace: (config: any) =>
    ipcRenderer.invoke("workspace:create", config),
  updateWorkspace: (id: string, updates: any) =>
    ipcRenderer.invoke("workspace:update", id, updates),
  deleteWorkspace: (id: string) => ipcRenderer.invoke("workspace:delete", id),
  switchWorkspace: (id: string) => ipcRenderer.invoke("workspace:switch", id),
  getCurrentWorkspace: () => ipcRenderer.invoke("workspace:current"),

  getWorkspaceCredentials: (id: string) =>
    ipcRenderer.invoke("workspace:get-credentials", id),
  onWorkspaceSwitched: (callback: (workspace: any) => void) => {
    const listener = (_: any, workspace: any) => callback(workspace);
    ipcRenderer.on("workspace:switched", listener);
    return () => {
      ipcRenderer.removeListener("workspace:switched", listener);
    };
  },
});
