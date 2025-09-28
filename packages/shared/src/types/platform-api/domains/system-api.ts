/**
 * Minimal system-level APIs exposed to the renderer.
 */

export interface SystemAPI {
  /**
   * Returns the platform identifier reported by Electron.
   */
  getPlatform(): Promise<string>;

  /**
   * Subscribe to protocol URL events (e.g. mcpr://).
   */
  onProtocolUrl(callback: (url: string) => void): () => void;
}