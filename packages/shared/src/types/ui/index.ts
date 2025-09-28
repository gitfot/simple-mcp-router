﻿// Toast and notification types
export interface ToastMessage {
  id: string;
  message: string;
  type: "success" | "error" | "warning" | "info";
  duration?: number;
}

// Dialog types
export interface DialogState {
  isOpen: boolean;
  title?: string;
  content?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

// Theme types
export type Theme = "light" | "dark" | "system";

// Store state interfaces
export interface ServerState {
  // Server data
  servers: any[]; // MCPServer[]

  // Loading states
  isLoading: boolean;
  isUpdating: string[]; // Array of server IDs being updated

  // Error states
  error: string | null;

  // UI state
  searchQuery: string;
  expandedServerId: string | null;
  selectedServerId: string | null;
}

export interface UIState {
  // Loading states
  globalLoading: boolean;
  loadingMessage: string;

  // Toast notifications
  toasts: ToastMessage[];

  // Dialog state
  dialog: DialogState;

  // Modal and overlay states

  // Navigation state
  currentPage: string;
  sidebarOpen: boolean;

  // Theme
  theme: Theme;
}

export interface AuthStoreState {
  // Authentication data
  isAuthenticated: boolean;
  userId: string | null;
  authToken: string | null;
  userInfo: any | null; // UserInfo from auth.ts

  // Login state
  isLoggingIn: boolean;

  // Error states
  loginError: string | null;

  // Credit information (if applicable)
  credits: number | null;
}

export interface AgentStoreChatSession {
  id: string;
  agentId: string;
  lastMessage?: string;
  createdAt: number;
  updatedAt?: number;
  messages?: any[]; // Messages from @ai-sdk/react (stored locally in database)
}

export interface AgentState {
  // Development agents
  developmentAgents: any[]; // AgentConfig[]
  currentDevelopmentAgent: any | null; // AgentConfig

  // Deployed agents
  deployedAgents: any[]; // DeployedAgent[]
  currentDeployedAgent: any | null; // DeployedAgent

  // Chat sessions
  chatSessions: AgentStoreChatSession[];
  currentSessionId: string | null;
  hasMoreSessions: boolean;
  nextCursor: string | undefined;

  // Chat messages for current session
  messages: any[]; // Message[] from @ai-sdk/react
  currentStreamMessage: any | null; // Message
  isStreaming: boolean;

  // Loading states
  isLoading: boolean;
  isLoadingSessions: boolean;
  isLoadingMoreSessions: boolean;
  isProcessingMessage: boolean;
  deletingSessions: Set<string>;

  // Error states
  error: string | null;
  chatError: string | null;
  sessionsError: string | null;

  // Auth state for chat operations
  authToken: string | null;
}
