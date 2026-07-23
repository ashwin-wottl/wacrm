"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  DEFAULT_MODE,
  MODE_STORAGE_KEY,
  CUSTOM_COLOR_STORAGE_KEY,
  DEFAULT_CUSTOM_COLOR,
  isMode,
  type Mode,
} from "@/lib/themes";

export function getContrastYIQ(hexcolor: string) {
  // Remove the hash if it exists
  const hex = hexcolor.replace("#", "");
  if (hex.length !== 6) return "#ffffff";
  
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#000000" : "#ffffff";
}

export function applyCustomColor(hex: string) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const foreground = getContrastYIQ(hex);
  
  // Opacity approximations in hex
  // 12% = 1F, 22% = 38
  const soft = `${hex}1f`;
  const soft2 = `${hex}38`;
  
  root.style.setProperty("--primary", hex);
  root.style.setProperty("--primary-foreground", foreground);
  // for hover, we can just use the hex itself or a slight opacity, tailwind v4 handles hover well if we just let it be, but let's provide a slightly darker shade if we could, or just rely on color-mix. We'll use color-mix for hover.
  root.style.setProperty("--primary-hover", `color-mix(in srgb, ${hex}, black 15%)`);
  root.style.setProperty("--primary-soft", soft);
  root.style.setProperty("--primary-soft-2", soft2);
  root.style.setProperty("--ring", hex);
  root.style.setProperty("--chart-1", hex);
  root.style.setProperty("--sidebar-primary", hex);
  root.style.setProperty("--sidebar-primary-foreground", foreground);
  root.style.setProperty("--sidebar-ring", hex);
}

interface ThemeContextValue {
  customColor: string;
  setCustomColor: (next: string) => void;
  mode: Mode;
  setMode: (next: Mode) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readInitialCustomColor(): string {
  if (typeof window === "undefined") return DEFAULT_CUSTOM_COLOR;
  try {
    const stored = localStorage.getItem(CUSTOM_COLOR_STORAGE_KEY);
    if (stored && /^#[0-9A-F]{6}$/i.test(stored)) return stored;
  } catch {}
  return DEFAULT_CUSTOM_COLOR;
}

function readInitialMode(): Mode {
  if (typeof window === "undefined") return DEFAULT_MODE;
  const fromAttr = document.documentElement.dataset.mode;
  if (isMode(fromAttr)) return fromAttr;
  try {
    const stored = localStorage.getItem(MODE_STORAGE_KEY);
    if (isMode(stored)) return stored;
  } catch {}
  return DEFAULT_MODE;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [customColor, setCustomColorState] = useState<string>(readInitialCustomColor);
  const [mode, setModeState] = useState<Mode>(readInitialMode);

  const setCustomColor = useCallback((next: string) => {
    setCustomColorState(next);
    applyCustomColor(next);
    try {
      localStorage.setItem(CUSTOM_COLOR_STORAGE_KEY, next);
    } catch {}
  }, []);

  const setMode = useCallback((next: Mode) => {
    setModeState(next);
    if (typeof document !== "undefined") {
      document.documentElement.dataset.mode = next;
    }
    try {
      localStorage.setItem(MODE_STORAGE_KEY, next);
    } catch {}
  }, []);

  const toggleMode = useCallback(() => {
    setMode(mode === "dark" ? "light" : "dark");
  }, [mode, setMode]);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === CUSTOM_COLOR_STORAGE_KEY) {
        if (e.newValue && /^#[0-9A-F]{6}$/i.test(e.newValue) && e.newValue !== customColor) {
          setCustomColorState(e.newValue);
          applyCustomColor(e.newValue);
        }
        return;
      }
      if (e.key === MODE_STORAGE_KEY) {
        if (isMode(e.newValue) && e.newValue !== mode) {
          setModeState(e.newValue);
          document.documentElement.dataset.mode = e.newValue;
        }
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [customColor, mode]);

  return (
    <ThemeContext.Provider value={{ customColor, setCustomColor, mode, setMode, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      customColor: DEFAULT_CUSTOM_COLOR,
      setCustomColor: () => {},
      mode: DEFAULT_MODE,
      setMode: () => {},
      toggleMode: () => {},
    };
  }
  return ctx;
}
