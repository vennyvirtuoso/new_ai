"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect } from "react";

function applyScheme(value: string | null) {
  const meta = document.querySelector<HTMLMetaElement>(
    'meta[name="color-scheme"]'
  );
  if (!meta) return;
  meta.content = value === "light" || value === "dark" ? value : "light dark";
}

export function ThemeToggle() {
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === "color-scheme") {
        applyScheme(event.newValue);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  function handleToggle() {
    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    const systemScheme = systemPrefersDark ? "dark" : "light";

    let stored: string | null = null;
    try {
      stored = localStorage.getItem("color-scheme");
    } catch {
      stored = null;
    }

    const rendered =
      stored === "light" || stored === "dark" ? stored : systemScheme;
    const target = rendered === "dark" ? "light" : "dark";

    if (target === systemScheme) {
      try {
        localStorage.removeItem("color-scheme");
      } catch {
        // Ignore storage errors; still apply to meta
      }
      applyScheme(null);
    } else {
      try {
        localStorage.setItem("color-scheme", target);
      } catch {
        // Ignore storage errors; still apply to meta
      }
      applyScheme(target);
    }
  }

  return (
    <button
      type="button"
      className="icon-btn"
      onClick={handleToggle}
      title="Toggle light or dark color scheme"
    >
      <span className="theme-icon-sun" aria-hidden="true">
        <Sun size={15} />
      </span>
      <span className="theme-icon-sun sr-only">Switch to light theme</span>

      <span className="theme-icon-moon" aria-hidden="true">
        <Moon size={15} />
      </span>
      <span className="theme-icon-moon sr-only">Switch to dark theme</span>
    </button>
  );
}
