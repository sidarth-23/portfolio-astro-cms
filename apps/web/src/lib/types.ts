export type ThemePreference = "light" | "dark" | "system";

export type ResolvedLink = {
  url: string;
  newTab: boolean;
  label: string;
  viewBox: string;
  innerSvg: string;
};

export type SeriesAdjacentPost = {
  slug: string;
  title: string;
  href: string;
  coverImage?: string;
};

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
