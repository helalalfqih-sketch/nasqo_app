import { useEffect, useState } from "react";

const BRAND_COLOR_STORAGE_KEY = "nasqo-brand-color";

export const DEFAULT_BRAND_COLOR = "#0b5ca8";

export const BRAND_COLOR_PRESETS = [
  { id: "nasqo-blue", label: "الأزرق الكلاسيكي", hex: "#0b5ca8" },
  { id: "emerald", label: "الزمردي", hex: "#047857" },
  { id: "indigo", label: "النيلي", hex: "#4338ca" },
  { id: "teal", label: "الفيروزي", hex: "#0f766e" },
  { id: "crimson", label: "العنابي", hex: "#b91c1c" },
  { id: "slate", label: "الرمادي الداكن", hex: "#1e293b" },
] as const;

export function isValidHexColor(hex: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(hex.trim());
}

function normalizeHex(hex: string): string {
  const cleaned = hex.trim();
  return isValidHexColor(cleaned) ? cleaned.toLowerCase() : DEFAULT_BRAND_COLOR;
}

export function deriveNavyShade(hex: string): string {
  const safe = normalizeHex(hex);
  const r = Math.max(0, Math.round(parseInt(safe.slice(1, 3), 16) * 0.62));
  const g = Math.max(0, Math.round(parseInt(safe.slice(3, 5), 16) * 0.62));
  const b = Math.max(0, Math.round(parseInt(safe.slice(5, 7), 16) * 0.62));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

export function readStoredBrandColor(): string {
  if (typeof window === "undefined") return DEFAULT_BRAND_COLOR;
  try {
    const saved = window.localStorage.getItem(BRAND_COLOR_STORAGE_KEY);
    if (saved && isValidHexColor(saved)) {
      return saved.toLowerCase();
    }
  } catch {
    // Ignore storage access errors
  }
  return DEFAULT_BRAND_COLOR;
}

export function applyBrandColor(hex: string): string {
  const primary = normalizeHex(hex);
  const dark = deriveNavyShade(primary);
  if (typeof document !== "undefined") {
    const root = document.documentElement;
    root.style.setProperty("--nasqo-blue", primary);
    root.style.setProperty("--nasqo-navy", dark);
    root.style.setProperty("--nasqo-brand-tint", `${primary}1a`);
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute("content", primary);
    }
  }
  return primary;
}

export function useBrandColor() {
  const [brandColor, setBrandColorState] = useState<string>(() =>
    applyBrandColor(readStoredBrandColor()),
  );

  useEffect(() => {
    const applied = applyBrandColor(brandColor);
    try {
      window.localStorage.setItem(BRAND_COLOR_STORAGE_KEY, applied);
    } catch {
      // Ignore storage access errors
    }
  }, [brandColor]);

  const setBrandColor = (nextHex: string) => {
    if (isValidHexColor(nextHex)) {
      setBrandColorState(nextHex.toLowerCase());
    }
  };

  return {
    brandColor,
    setBrandColor,
    resetBrandColor: () => setBrandColorState(DEFAULT_BRAND_COLOR),
  };
}
