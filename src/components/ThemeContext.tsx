"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Sun, Moon } from "lucide-react";

export type Theme = "light" | "dark";

type ThemeValue = { theme: Theme; toggle: () => void; setTheme: (t: Theme) => void };

// Builds a self-contained theme surface: a provider that renders a wrapper
// element carrying a `theme-light` / `theme-dark` class, plus a hook to read and
// change it. The choice is persisted per surface so the dashboard and the
// marketing site keep independent preferences (and their own native defaults).
function createSurfaceTheme(storageKey: string, defaultTheme: Theme, rootClass: string) {
  const Ctx = createContext<ThemeValue>({
    theme: defaultTheme,
    toggle: () => {},
    setTheme: () => {},
  });

  function Provider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>(defaultTheme);

    // Hydrate from storage after mount to avoid an SSR/client mismatch.
    useEffect(() => {
      const saved = localStorage.getItem(storageKey);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved === "light" || saved === "dark") setThemeState(saved);
    }, []);

    const setTheme = (t: Theme) => {
      try {
        localStorage.setItem(storageKey, t);
      } catch {
        /* storage may be unavailable; ignore */
      }
      setThemeState(t);
    };
    const toggle = () => setTheme(theme === "dark" ? "light" : "dark");

    return (
      <Ctx.Provider value={{ theme, toggle, setTheme }}>
        <div className={`${rootClass} theme-${theme}`}>{children}</div>
      </Ctx.Provider>
    );
  }

  const useSurfaceTheme = () => useContext(Ctx);
  return { Provider, useSurfaceTheme };
}

// Mintlify pivot: the app is light-native now. Storage key bumped to v2 so a
// previously-saved "dark" preference doesn't mask the new default.
export const { Provider: AppThemeProvider, useSurfaceTheme: useAppTheme } =
  createSurfaceTheme("leadai-app-theme-v2", "light", "app-root");

export const { Provider: MarketingThemeProvider, useSurfaceTheme: useMarketingTheme } =
  createSurfaceTheme("leadai-marketing-theme", "light", "marketing-root");

// Icon button that flips a surface theme. Styling is passed in so it can match
// each location (dark header vs light navbar).
export function ThemeToggle({
  theme,
  toggle,
  className = "",
}: {
  theme: Theme;
  toggle: () => void;
  className?: string;
}) {
  const isDark = theme === "dark";
  const label = isDark ? "Switch to light theme" : "Switch to dark theme";
  return (
    <button type="button" onClick={toggle} aria-label={label} title={label} className={className}>
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}
