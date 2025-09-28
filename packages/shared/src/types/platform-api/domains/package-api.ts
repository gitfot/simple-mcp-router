/**
 * Package management domain API (includes system utilities)
 */

import type { Unsubscribe } from "./auth-api";

type PackageManager = "pnpm" | "uvx";
type Platform = "darwin" | "win32" | "linux";

interface ManagerStatus {
  node: boolean;
  pnpm: boolean;
  uv: boolean;
}

interface InstallResult {
  success: boolean;
  installed: ManagerStatus;
  errors?: {
    node?: string;
    pnpm?: string;
    uv?: string;
  };
}

export interface PackageAPI {
  // Package management
  checkManagers(): Promise<ManagerStatus>;
  installManagers(): Promise<InstallResult>;

  // System utilities
  system: {
    getPlatform(): Promise<Platform>;
    checkCommand(command: string): Promise<boolean>;
    restartApp(): Promise<boolean>;
    onProtocolUrl(callback: (url: string) => void): Unsubscribe;
  };
}
