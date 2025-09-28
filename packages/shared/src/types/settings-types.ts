/**
 * Application settings shared between the main and renderer processes.
 */
export interface AppSettings {
  userId?: string;
  authToken?: string;
  loggedInAt?: string;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  userId: "",
  authToken: "",
  loggedInAt: "",
};
