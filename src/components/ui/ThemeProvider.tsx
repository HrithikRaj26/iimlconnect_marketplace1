"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type ThemePreference = "light" | "dark" | "auto";
type ActiveTheme = "light" | "dark";

interface ThemeContextValue {
  preference: ThemePreference;
  activeTheme: ActiveTheme;
  setPreference: (pref: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  preference: "auto",
  activeTheme: "light",
  setPreference: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPrefState] = useState<ThemePreference>("auto");
  const [activeTheme, setActiveTheme] = useState<ActiveTheme>("light");
  const [mounted, setMounted] = useState(false);

  const getAutoTheme = (): ActiveTheme => {
    const hour = new Date().getHours();
    // 6:00 AM (6) to 5:59 PM (17) is Light Mode
    if (hour >= 6 && hour < 18) {
      return "light";
    }
    return "dark";
  };

  const applyTheme = (theme: ActiveTheme) => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    setActiveTheme(theme);
  };

  const setPreference = (pref: ThemePreference) => {
    setPrefState(pref);
    if (pref === "auto") {
      localStorage.removeItem("iiml-theme-pref");
      applyTheme(getAutoTheme());
    } else {
      localStorage.setItem("iiml-theme-pref", pref);
      applyTheme(pref);
    }
  };

  // On mount
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("iiml-theme-pref") as ThemePreference | null;
    if (stored === "dark" || stored === "light") {
      setPrefState(stored);
      applyTheme(stored);
    } else {
      setPrefState("auto");
      applyTheme(getAutoTheme());
    }
  }, []);

  // Interval for auto-switching
  useEffect(() => {
    if (!mounted || preference !== "auto") return;

    const intervalId = setInterval(() => {
      const currentAuto = getAutoTheme();
      if (currentAuto !== activeTheme) {
        applyTheme(currentAuto);
      }
    }, 60000); // Check every minute

    return () => clearInterval(intervalId);
  }, [preference, activeTheme, mounted]);

  return (
    <ThemeContext.Provider value={{ preference, activeTheme, setPreference }}>
      {children}
    </ThemeContext.Provider>
  );
}
