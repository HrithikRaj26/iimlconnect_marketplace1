"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export function ThemeToggle() {
  const { preference, setPreference } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="flex h-[32px] w-[90px] animate-pulse rounded-full bg-gray-200 dark:bg-gray-800" />;
  }

  return (
    <div 
      className="flex items-center rounded-full border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 p-0.5 gap-0.5"
      role="group"
      aria-label="Theme Preference"
    >
      <button
        onClick={() => setPreference("light")}
        title="Light Mode"
        aria-pressed={preference === "light"}
        className={`flex items-center justify-center h-[26px] w-[26px] rounded-full transition-all duration-200 ${
          preference === "light"
            ? "bg-white dark:bg-gray-900 text-amber-600 shadow-sm"
            : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        }`}
      >
        <Sun size={13} strokeWidth={2.5} />
      </button>
      <button
        onClick={() => setPreference("auto")}
        title="Automatic (Time-based)"
        aria-pressed={preference === "auto"}
        className={`flex items-center justify-center h-[26px] w-[26px] rounded-full transition-all duration-200 ${
          preference === "auto"
            ? "bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 shadow-sm"
            : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        }`}
      >
        <Monitor size={13} strokeWidth={2.5} />
      </button>
      <button
        onClick={() => setPreference("dark")}
        title="Dark Mode"
        aria-pressed={preference === "dark"}
        className={`flex items-center justify-center h-[26px] w-[26px] rounded-full transition-all duration-200 ${
          preference === "dark"
            ? "bg-gray-900 text-blue-400 shadow-sm dark:bg-gray-700"
            : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        }`}
      >
        <Moon size={13} strokeWidth={2.5} />
      </button>
    </div>
  );
}
