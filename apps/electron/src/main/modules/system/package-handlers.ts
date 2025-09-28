/**
 * package-handlers.ts
 *
 * Unified package management and version resolution handlers
 * Combines package manager installation/checking with version resolution functionality
 */

import { ipcMain } from "electron";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

async function commandExists(command: string, args: string[] = ["--version"]): Promise<boolean> {
  const binary = process.platform === "win32" ? `${command}.cmd` : command;
  try {
    await execFileAsync(binary, args, { windowsHide: true });
    return true;
  } catch {
    return false;
  }
}

async function checkNodeExists(): Promise<boolean> {
  const binary = process.platform === "win32" ? "node.exe" : "node";
  try {
    await execFileAsync(binary, ["--version"], { windowsHide: true });
    return true;
  } catch {
    return false;
  }
}

async function checkPnpmExists(): Promise<boolean> {
  const pnpm = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
  try {
    await execFileAsync(pnpm, ["--version"], { windowsHide: true });
    return true;
  } catch {
    return false;
  }
}

async function checkUvExists(): Promise<boolean> {
  const candidates = process.platform === "win32" ? ["uv.exe", "uvx.exe"] : ["uv", "uvx"];
  for (const binary of candidates) {
    try {
      await execFileAsync(binary, ["--version"], { windowsHide: true });
      return true;
    } catch {
      continue;
    }
  }
  return false;
}

async function installPNPM(): Promise<void> {
  const npmBinary = process.platform === "win32" ? "npm.cmd" : "npm";
  await execFileAsync(npmBinary, ["install", "-g", "pnpm"], { windowsHide: true });
}

async function installUV(): Promise<void> {
  const installers = process.platform === "win32" ? ["pip.exe", "pip3.exe"] : ["pip3", "pip"];
  let lastError: unknown = null;
  for (const installer of installers) {
    try {
      await execFileAsync(installer, ["install", "--upgrade", "uv"], {
        windowsHide: true,
      });
      return;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError ?? new Error("Failed to install uv via pip");
}

/**
 * Register unified package-related IPC handlers
 */
export function setupPackageHandlers(): void {
  // ====================
  // Package Manager Management
  // ====================

  // Check both package managers and Node.js
  ipcMain.handle("packageManager:checkAll", async () => {
    try {
      const [pnpmAvailable, uvAvailable, nodeAvailable] = await Promise.all([
        checkPnpmExists(),
        checkUvExists(),
        checkNodeExists(),
      ]);
      return { node: nodeAvailable, pnpm: pnpmAvailable, uv: uvAvailable };
    } catch (error) {
      console.error("Error checking package managers:", error);
      return { node: false, pnpm: false, uv: false };
    }
  });

  // Install package managers (only installs missing ones)
  ipcMain.handle("packageManager:installAll", async () => {
    const result = {
      success: true,
      installed: { node: false, pnpm: false, uv: false },
      errors: {} as { node?: string; pnpm?: string; uv?: string },
      needsRestart: false,
    };

    try {
      // Check which package managers are already installed
      const [pnpmExists, uvExists, nodeExists] = await Promise.all([
        checkPnpmExists(),
        checkUvExists(),
        checkNodeExists(),
      ]);

      if (!nodeExists) {
        result.success = false;
        result.errors.node =
          "未检测到 Node.js，请先手动安装后再继续";
      } else {
        // Install pnpm if not exists (requires Node.js)
        if (!pnpmExists) {
          try {
            await installPNPM();
            result.installed.pnpm = true;
          } catch (error) {
            console.error("Error installing pnpm:", error);
            result.success = false;
            const errorMessage =
              error instanceof Error ? error.message : String(error);
            result.errors.pnpm = errorMessage;
          }
        }
      }

      // Install uv if not exists
      if (!uvExists) {
        try {
          await installUV();
          result.installed.uv = true;
        } catch (error) {
          console.error("Error installing uv:", error);
          result.success = false;
          result.errors.uv =
            error instanceof Error ? error.message : String(error);
        }
      }

      // If any package manager or Node.js was installed, set needsRestart flag
      if (
        result.installed.node ||
        result.installed.pnpm ||
        result.installed.uv
      ) {
        result.needsRestart = true;
      }

      return result;
    } catch (error) {
      console.error("Error in installPackageManagers:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        success: false,
        installed: { node: false, pnpm: false, uv: false },
        errors: { node: errorMessage, pnpm: errorMessage, uv: errorMessage },
        needsRestart: false,
      };
    }
  });
}
