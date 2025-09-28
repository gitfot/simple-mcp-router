/**
 * Settings management domain API
 */

import type { AppSettings } from "../../settings-types";

export interface SettingsAPI {
  get(): Promise<AppSettings>;
  save(settings: AppSettings): Promise<boolean>;
  submitFeedback(feedback: string): Promise<boolean>;
}
