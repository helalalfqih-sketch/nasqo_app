const HAPTICS_STORAGE_KEY = "nasqo-haptics-enabled";

export type HapticPattern = "light" | "success" | "warning" | "pin" | "drop";

const PATTERNS: Record<HapticPattern, number | number[]> = {
  light: 12,
  success: [16, 40, 22],
  warning: [28, 36, 28],
  pin: [14, 24, 18],
  drop: [18, 22],
};

export function readHapticsEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const raw = window.localStorage.getItem(HAPTICS_STORAGE_KEY);
    if (raw === "false") return false;
    return true;
  } catch {
    return true;
  }
}

export function writeHapticsEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(HAPTICS_STORAGE_KEY, enabled ? "true" : "false");
  } catch {
    // Ignore storage access errors
  }
}

export function triggerHaptic(pattern: HapticPattern = "light"): boolean {
  if (!readHapticsEnabled()) return false;
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") {
    return false;
  }
  try {
    return navigator.vibrate(PATTERNS[pattern]);
  } catch {
    return false;
  }
}
