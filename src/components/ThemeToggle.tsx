"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect } from "react";

function applyScheme(value: string | null) {
  const isDark = value === "dark";
  const meta = document.querySelector<HTMLMetaElement>(
    'meta[name="color-scheme"]'
  );
  if (meta) {
    meta.content = isDark ? "dark" : "light";
  }
  const themeColor = document.querySelector<HTMLMetaElement>(
    'meta[name="theme-color"]'
  );
  if (themeColor) {
    themeColor.content = isDark ? "#0c0e13" : "#faf9f6";
  }
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
    const meta = document.querySelector<HTMLMetaElement>(
      'meta[name="color-scheme"]'
    );
    const currentlyDark = meta?.content === "dark";
    const next = currentlyDark ? "light" : "dark";

    try {
      if (next === "dark") {
        localStorage.setItem("color-scheme", "dark");
      } else {
        localStorage.removeItem("color-scheme");
      }
    } catch {
      // Ignore storage errors
    }

    applyScheme(next);
  }

  return (
    <button
      type="button"
      className="icon-btn"
      onClick={handleToggle}
      title="Toggle light or dark theme"
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
