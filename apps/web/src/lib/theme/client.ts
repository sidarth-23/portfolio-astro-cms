const STORAGE_KEY = "theme-preference";
const LIGHT_THEME = "emerald";
const DARK_THEME = "night";
const THEME_VALUES = new Set(["light", "dark", "system"]);
const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

type ThemePreference = "light" | "dark" | "system";
type ThemeMode = "light" | "dark";

type ThemeApi = {
  getPreference: () => ThemePreference;
  setPreference: (nextPreference: string) => void;
  apply: () => void;
};

declare global {
  interface Window {
    __theme?: ThemeApi;
    __themeManagerInitialized?: boolean;
  }
}

const toPreference = (value: string | null | undefined): ThemePreference => {
  return THEME_VALUES.has(value ?? "") ? (value as ThemePreference) : "system";
};

const getPreference = (): ThemePreference => {
  try {
    return toPreference(localStorage.getItem(STORAGE_KEY));
  } catch {
    return "system";
  }
};

const resolveMode = (preference: ThemePreference): ThemeMode => {
  if (preference === "system") {
    return mediaQuery.matches ? "dark" : "light";
  }
  return preference;
};

const applyTheme = (targetDocument: Document = document, preference: ThemePreference = getPreference()) => {
  const mode = resolveMode(preference);
  const themeName = mode === "dark" ? DARK_THEME : LIGHT_THEME;

  targetDocument.documentElement.dataset.theme = themeName;
  targetDocument.documentElement.style.colorScheme = mode;
};

const emitThemeChanged = () => {
  document.dispatchEvent(
    new CustomEvent("theme:changed", {
      detail: { preference: getPreference() },
    }),
  );
};

const setPreference = (nextPreference: string) => {
  const preference = toPreference(nextPreference);
  try {
    localStorage.setItem(STORAGE_KEY, preference);
  } catch {
    // Ignore storage failures (private mode, blocked storage, etc).
  }
  applyTheme(document, preference);
  emitThemeChanged();
};

const syncThemeControls = (root: Element, preference: ThemePreference) => {
  root.querySelectorAll("[data-theme-icon]").forEach((icon) => {
    const iconPreference = toPreference(icon.getAttribute("data-theme-icon"));
    icon.classList.toggle("hidden", iconPreference !== preference);
  });

  root.querySelectorAll("[data-theme-check]").forEach((check) => {
    const checkPreference = toPreference(check.getAttribute("data-theme-check"));
    check.classList.toggle("invisible", checkPreference !== preference);
  });

  root.querySelectorAll("[data-theme-option]").forEach((option) => {
    const optionPreference = toPreference(option.getAttribute("data-theme-option"));
    option.classList.toggle("active", optionPreference === preference);
  });
};

const bindThemeSwitcher = (root: HTMLElement) => {
  syncThemeControls(root, getPreference());

  if (root.dataset.themeSwitcherInitialized === "true") {
    return;
  }
  root.dataset.themeSwitcherInitialized = "true";

  root.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const option = target.closest("[data-theme-option]");
    if (!(option instanceof HTMLElement)) return;

    const preference = option.getAttribute("data-theme-option");
    if (!preference || !THEME_VALUES.has(preference)) return;

    setPreference(preference);
  });
};

const initializeThemeSwitchers = () => {
  document.querySelectorAll("[data-theme-menu]").forEach((menu) => {
    const root = menu.closest(".dropdown");
    if (!(root instanceof HTMLElement)) return;
    bindThemeSwitcher(root);
  });
};

window.__theme = {
  getPreference,
  setPreference,
  apply: () => {
    applyTheme(document, getPreference());
    emitThemeChanged();
  },
};

initializeThemeSwitchers();

if (!window.__themeManagerInitialized) {
  mediaQuery.addEventListener("change", () => {
    if (getPreference() !== "system") return;
    applyTheme(document, "system");
    emitThemeChanged();
  });

  document.addEventListener("astro:before-swap", (event: Event) => {
    const nextDocument =
      (event as Event & { newDocument?: Document }).newDocument ??
      (event as CustomEvent<{ newDocument?: Document }>).detail?.newDocument;
    if (!nextDocument) return;
    applyTheme(nextDocument, getPreference());
  });

  document.addEventListener("astro:after-swap", () => {
    applyTheme(document, getPreference());
    initializeThemeSwitchers();
  });

  document.addEventListener("astro:page-load", () => {
    initializeThemeSwitchers();
  });

  document.addEventListener("theme:changed", () => {
    initializeThemeSwitchers();
  });

  window.__themeManagerInitialized = true;
}

export {};
