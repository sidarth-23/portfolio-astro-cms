export type ThemePreference = "light" | "dark" | "system";

export interface ThemeApi {
  getPreference(): ThemePreference;
  setPreference(value: string): void;
  apply(): void;
}

declare global {
  interface Window {
    theme?: ThemeApi;
  }
}
