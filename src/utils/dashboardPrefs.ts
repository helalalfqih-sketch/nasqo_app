export type DashboardWidgetId =
  | "kpis"
  | "sales-trend"
  | "supplier-performance"
  | "expense-trends"
  | "recent-invoices"
  | "low-stock";

export const DEFAULT_WIDGET_ORDER: readonly DashboardWidgetId[] = [
  "kpis",
  "sales-trend",
  "supplier-performance",
  "expense-trends",
  "recent-invoices",
  "low-stock",
];

export const WIDGET_LABELS: Record<DashboardWidgetId, string> = {
  kpis: "المؤشرات الرئيسية",
  "sales-trend": "اتجاه المبيعات (7 أيام)",
  "supplier-performance": "أداء الموردين",
  "expense-trends": "اتجاهات المصروفات",
  "recent-invoices": "أحدث الفواتير",
  "low-stock": "تنبيهات المخزون",
};

export type PinnedFavoriteTarget =
  | { kind: "route"; route: "inventory-report" | "daily-journal" | "purchases" | "sales" | "currency" | "shop" }
  | { kind: "action"; action: "new-invoice" | "new-purchase" | "new-contact" | "qr-scan" | "export-pdf" }
  | { kind: "account"; accountId: string };

export interface PinnedFavoriteItem {
  id: string;
  label: string;
  subtitle?: string;
  target: PinnedFavoriteTarget;
}

export const DEFAULT_FAVORITES: readonly PinnedFavoriteItem[] = [
  {
    id: "fav_inventory",
    label: "تقرير المخزون",
    subtitle: "جرد والأرصدة",
    target: { kind: "route", route: "inventory-report" },
  },
  {
    id: "fav_journal",
    label: "الحركة اليومية",
    subtitle: "كشف القيود",
    target: { kind: "route", route: "daily-journal" },
  },
  {
    id: "fav_purchases",
    label: "حسابات الموردين",
    subtitle: "المشتريات",
    target: { kind: "route", route: "purchases" },
  },
];

const WIDGET_ORDER_KEY = "nasqo-dashboard-widget-order";
const FAVORITES_KEY = "nasqo-pinned-favorites";
const LAST_BACKUP_KEY = "nasqo-last-backup-at";

export function readWidgetOrder(): DashboardWidgetId[] {
  if (typeof window === "undefined") return [...DEFAULT_WIDGET_ORDER];
  try {
    const raw = window.localStorage.getItem(WIDGET_ORDER_KEY);
    if (!raw) return [...DEFAULT_WIDGET_ORDER];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [...DEFAULT_WIDGET_ORDER];
    const valid = parsed.filter((id): id is DashboardWidgetId =>
      (DEFAULT_WIDGET_ORDER as readonly string[]).includes(String(id)),
    );
    const missing = DEFAULT_WIDGET_ORDER.filter((id) => !valid.includes(id));
    return [...valid, ...missing];
  } catch {
    return [...DEFAULT_WIDGET_ORDER];
  }
}

export function writeWidgetOrder(order: readonly DashboardWidgetId[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(WIDGET_ORDER_KEY, JSON.stringify(order));
  } catch {
    // Ignore storage access errors
  }
}

export function readPinnedFavorites(): PinnedFavoriteItem[] {
  if (typeof window === "undefined") return [...DEFAULT_FAVORITES];
  try {
    const raw = window.localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [...DEFAULT_FAVORITES];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [...DEFAULT_FAVORITES];
    return parsed.filter(
      (item): item is PinnedFavoriteItem =>
        Boolean(item && typeof item === "object" && "id" in item && "label" in item && "target" in item),
    );
  } catch {
    return [...DEFAULT_FAVORITES];
  }
}

export function writePinnedFavorites(items: readonly PinnedFavoriteItem[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage access errors
  }
}

export function readLastBackupIso(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LAST_BACKUP_KEY);
    return raw && raw.trim() ? raw.trim() : null;
  } catch {
    return null;
  }
}

export function recordLastBackupNow(iso: string = new Date().toISOString()): string {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(LAST_BACKUP_KEY, iso);
    } catch {
      // Ignore storage access errors
    }
  }
  return iso;
}

export type HomeMetricId =
  | "sales"
  | "purchases"
  | "clients"
  | "employees"
  | "transfers"
  | "shop"
  | "inventory"
  | "new-account";

export const DEFAULT_HOME_METRIC_ORDER: readonly HomeMetricId[] = [
  "sales",
  "purchases",
  "clients",
  "employees",
  "transfers",
  "shop",
  "inventory",
  "new-account",
];

const HOME_METRICS_ORDER_KEY = "nasqo-home-metrics-order";

export function readHomeMetricOrder(): HomeMetricId[] {
  if (typeof window === "undefined") return [...DEFAULT_HOME_METRIC_ORDER];
  try {
    const raw = window.localStorage.getItem(HOME_METRICS_ORDER_KEY);
    if (!raw) return [...DEFAULT_HOME_METRIC_ORDER];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [...DEFAULT_HOME_METRIC_ORDER];
    const valid = parsed.filter((id): id is HomeMetricId =>
      (DEFAULT_HOME_METRIC_ORDER as readonly string[]).includes(String(id)),
    );
    const missing = DEFAULT_HOME_METRIC_ORDER.filter((id) => !valid.includes(id));
    return [...valid, ...missing];
  } catch {
    return [...DEFAULT_HOME_METRIC_ORDER];
  }
}

export function writeHomeMetricOrder(order: readonly HomeMetricId[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(HOME_METRICS_ORDER_KEY, JSON.stringify(order));
  } catch {
    // Ignore storage access errors
  }
}

