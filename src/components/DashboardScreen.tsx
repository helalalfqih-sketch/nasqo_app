import { useMemo, useState, type DragEvent } from "react";
import {
  ActivityLogIcon,
  ArchiveIcon,
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowUpIcon,
  BackpackIcon,
  BellIcon,
  BookmarkFilledIcon,
  BookmarkIcon,
  CameraIcon,
  CardStackIcon,
  CheckCircledIcon,
  Cross2Icon,
  DragHandleDots2Icon,
  ExclamationTriangleIcon,
  FilePlusIcon,
  FileTextIcon,
  MixerHorizontalIcon,
  MoonIcon,
  Pencil1Icon,
  PersonIcon,
  PlusIcon,
  ReaderIcon,
  ResetIcon,
  SunIcon,
} from "@radix-ui/react-icons";
import { MobileScroll } from "../mobile";
import {
  computeDashboardSummary,
  computeSalesTrend7Days,
  computeSupplierPerformance,
  formatAmount,
  isBackupOverdue,
  parseArabicNumber,
  type LowStockAlertItem,
} from "../accounting";
import type { ThemeMode } from "../utils/theme";
import { BRAND_COLOR_PRESETS } from "../utils/brandColor";
import {
  DEFAULT_WIDGET_ORDER,
  WIDGET_LABELS,
  type DashboardWidgetId,
  type PinnedFavoriteItem,
} from "../utils/dashboardPrefs";
import { triggerHaptic } from "../utils/haptics";
import type {
  AccountRecord,
  CurrencyCode,
  InventoryItemRecord,
  LedgerEntryRecord,
  WarehouseRecord,
} from "../types";
import { ExpenseTrendsChart } from "./ExpenseTrendsChart";
import { PdfReportButton } from "./PdfReportButton";
import { SalesTrendChart } from "./SalesTrendChart";
import { SupplierPerformanceChart } from "./SupplierPerformanceChart";

export type DashboardPeriod = "all" | "month" | "week";

export interface DashboardProps {
  companyName: string;
  defaultCurrency: CurrencyCode;
  accounts: readonly AccountRecord[];
  ledger: readonly LedgerEntryRecord[];
  warehouses: readonly WarehouseRecord[];
  inventory: readonly InventoryItemRecord[];
  loading?: boolean;
  themeMode: ThemeMode;
  onChangeThemeMode: (mode: ThemeMode) => void;
  brandColor: string;
  onChangeBrandColor: (hex: string) => void;
  onResetBrandColor: () => void;
  hapticsEnabled: boolean;
  onToggleHaptics: (enabled: boolean) => void;
  widgetOrder: readonly DashboardWidgetId[];
  onChangeWidgetOrder: (order: DashboardWidgetId[]) => void;
  favorites: readonly PinnedFavoriteItem[];
  onPinFavorite: (item: PinnedFavoriteItem) => void;
  onUnpinFavorite: (id: string) => void;
  onLaunchFavorite: (item: PinnedFavoriteItem) => void;
  lastBackupIso: string | null;
  onTriggerBackupNow: () => void;
  unreadNotificationsCount: number;
  onOpenNotifications: () => void;
  onOpenSales: () => void;
  onOpenSupplier: (accountId: string) => void;
  onCreateInvoice: () => void;
  onCreatePurchase: () => void;
  onCreateContact: () => void;
  onOpenQrScanner: () => void;
  onPreviewInvoice: (entryId: string) => void;
  onAddInventoryItem: () => void;
  onUpdateItemThreshold: (item: InventoryItemRecord, newThreshold: number) => Promise<void>;
  onOpenInventoryReport: () => void;
  onOpenDailyJournal: () => void;
  onNotify: (message: string) => void;
}

const PERIOD_OPTIONS: readonly { id: DashboardPeriod; label: string }[] = [
  { id: "all", label: "الكل" },
  { id: "month", label: "30 يوم" },
  { id: "week", label: "7 أيام" },
];

const THEME_OPTIONS: readonly { id: ThemeMode; label: string }[] = [
  { id: "light", label: "فاتح" },
  { id: "dark", label: "داكن" },
  { id: "system", label: "النظام" },
];

const THRESHOLD_MODE_OPTIONS = [
  { id: "item", label: "حد كل صنف", value: 25, useItem: true },
  { id: "15", label: "≤ 15", value: 15, useItem: false },
  { id: "25", label: "≤ 25", value: 25, useItem: false },
  { id: "50", label: "≤ 50", value: 50, useItem: false },
] as const;

export function Dashboard({
  companyName,
  defaultCurrency,
  accounts,
  ledger,
  warehouses,
  inventory,
  loading = false,
  themeMode,
  onChangeThemeMode,
  brandColor,
  onChangeBrandColor,
  onResetBrandColor,
  hapticsEnabled,
  onToggleHaptics,
  widgetOrder,
  onChangeWidgetOrder,
  favorites,
  onPinFavorite,
  onUnpinFavorite,
  onLaunchFavorite,
  lastBackupIso,
  onTriggerBackupNow,
  unreadNotificationsCount,
  onOpenNotifications,
  onOpenSales,
  onOpenSupplier,
  onCreateInvoice,
  onCreatePurchase,
  onCreateContact,
  onOpenQrScanner,
  onPreviewInvoice,
  onAddInventoryItem,
  onUpdateItemThreshold,
  onOpenInventoryReport,
  onOpenDailyJournal,
  onNotify,
}: DashboardProps) {
  const [period, setPeriod] = useState<DashboardPeriod>("all");
  const [thresholdMode, setThresholdMode] = useState<"item" | "15" | "25" | "50">("item");
  const [editingThresholdItemId, setEditingThresholdItemId] = useState<string | null>(null);
  const [thresholdDraft, setThresholdDraft] = useState("");
  const [savingThreshold, setSavingThreshold] = useState(false);

  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [pinPickerOpen, setPinPickerOpen] = useState(false);
  const [reorderMode, setReorderMode] = useState(false);
  const [draggedWidget, setDraggedWidget] = useState<DashboardWidgetId | null>(null);
  const [dragOverWidget, setDragOverWidget] = useState<DashboardWidgetId | null>(null);

  const selectedThresholdConfig =
    THRESHOLD_MODE_OPTIONS.find((opt) => opt.id === thresholdMode) ?? THRESHOLD_MODE_OPTIONS[0];

  const summary = useMemo(
    () =>
      computeDashboardSummary(accounts, ledger, warehouses, inventory, {
        period,
        lowStockThreshold: selectedThresholdConfig.value,
        useItemThresholds: selectedThresholdConfig.useItem,
        recentInvoicesLimit: 6,
      }),
    [accounts, inventory, ledger, period, selectedThresholdConfig, warehouses],
  );

  const salesTrend = useMemo(
    () => computeSalesTrend7Days(accounts, ledger),
    [accounts, ledger],
  );

  const supplierPerf = useMemo(
    () => computeSupplierPerformance(accounts, ledger),
    [accounts, ledger],
  );

  const backupStatus = useMemo(() => isBackupOverdue(lastBackupIso), [lastBackupIso]);

  const criticalCount = useMemo(
    () => summary.lowStockItems.filter((item) => item.severity === "critical").length,
    [summary.lowStockItems],
  );

  const periodSubtitle =
    period === "all"
      ? "جميع الفترات المسجلة"
      : period === "month"
        ? "خلال آخر 30 يومًا"
        : "خلال آخر 7 أيام";

  const candidatePins = useMemo<PinnedFavoriteItem[]>(() => {
    const presets: PinnedFavoriteItem[] = [
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
      {
        id: "fav_sales",
        label: "حسابات المبيعات",
        subtitle: "المبيعات",
        target: { kind: "route", route: "sales" },
      },
      {
        id: "fav_currency",
        label: "صرف العملات",
        subtitle: "تحويل عملة",
        target: { kind: "route", route: "currency" },
      },
      {
        id: "fav_qr",
        label: "ماسح QR",
        subtitle: "مسح سريع",
        target: { kind: "action", action: "qr-scan" },
      },
    ];
    const topAccounts: PinnedFavoriteItem[] = accounts.slice(0, 6).map((acc) => ({
      id: `fav_acc_${acc.id}`,
      label: acc.name,
      subtitle: acc.category === "purchases" ? "مورد" : acc.category === "sales" ? "مبيعات" : "حساب",
      target: { kind: "account", accountId: acc.id },
    }));
    return [...presets, ...topAccounts];
  }, [accounts]);

  const handleStartEditThreshold = (item: LowStockAlertItem) => {
    triggerHaptic("light");
    setEditingThresholdItemId(item.id);
    setThresholdDraft(String(item.effectiveThreshold));
  };

  const handleSaveThreshold = async (item: LowStockAlertItem) => {
    const nextThreshold = Math.max(0, parseArabicNumber(thresholdDraft));
    setSavingThreshold(true);
    try {
      await onUpdateItemThreshold(item, nextThreshold);
      setEditingThresholdItemId(null);
      triggerHaptic("success");
      onNotify(`تم تحديث الحد الأدنى لصنف "${item.name}" إلى ${formatAmount(nextThreshold)}`);
    } finally {
      setSavingThreshold(false);
    }
  };

  const reorderWidgets = (sourceId: DashboardWidgetId, targetId: DashboardWidgetId) => {
    if (sourceId === targetId) return;
    const next = [...widgetOrder];
    const fromIdx = next.indexOf(sourceId);
    const toIdx = next.indexOf(targetId);
    if (fromIdx === -1 || toIdx === -1) return;
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    onChangeWidgetOrder(next);
    triggerHaptic("drop");
  };

  const moveWidgetBy = (id: DashboardWidgetId, delta: -1 | 1) => {
    const idx = widgetOrder.indexOf(id);
    const nextIdx = idx + delta;
    if (idx === -1 || nextIdx < 0 || nextIdx >= widgetOrder.length) return;
    const next = [...widgetOrder];
    const [item] = next.splice(idx, 1);
    next.splice(nextIdx, 0, item);
    onChangeWidgetOrder(next);
    triggerHaptic("drop");
  };

  const handleDragStart = (e: DragEvent<HTMLElement>, id: DashboardWidgetId) => {
    setDraggedWidget(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
    triggerHaptic("light");
  };

  const handleDragOver = (e: DragEvent<HTMLElement>, id: DashboardWidgetId) => {
    e.preventDefault();
    if (dragOverWidget !== id) {
      setDragOverWidget(id);
    }
  };

  const handleDrop = (e: DragEvent<HTMLElement>, targetId: DashboardWidgetId) => {
    e.preventDefault();
    const sourceId = (draggedWidget || e.dataTransfer.getData("text/plain")) as DashboardWidgetId;
    if (sourceId && DEFAULT_WIDGET_ORDER.includes(sourceId)) {
      reorderWidgets(sourceId, targetId);
    }
    setDraggedWidget(null);
    setDragOverWidget(null);
  };

  const renderWidget = (widgetId: DashboardWidgetId) => {
    if (widgetId === "kpis") {
      return (
        <section className="exec-kpi-grid" aria-label="ملخص المؤشرات الرئيسية">
          <button
            type="button"
            className="exec-kpi-card"
            onClick={() => {
              triggerHaptic("light");
              onOpenSales();
            }}
            data-testid="kpi-total-sales"
          >
            <div className="exec-kpi-top">
              <span className="exec-kpi-label">إجمالي المبيعات</span>
              <span className="exec-kpi-icon sales" aria-hidden="true">
                <ActivityLogIcon />
              </span>
            </div>
            <strong className="exec-kpi-value">
              {loading ? "..." : `${formatAmount(summary.totalSales)} ${defaultCurrency}`}
            </strong>
            <span className="exec-kpi-meta">
              {summary.salesInvoiceCount} فاتورة مبيعات · {summary.salesAccountCount} حساب مبيعات
            </span>
          </button>

          <button
            type="button"
            className="exec-kpi-card"
            onClick={() => {
              triggerHaptic("light");
              onOpenDailyJournal();
            }}
            data-testid="kpi-recent-invoices"
          >
            <div className="exec-kpi-top">
              <span className="exec-kpi-label">الفواتير المسجلة</span>
              <span className="exec-kpi-icon invoices" aria-hidden="true">
                <FileTextIcon />
              </span>
            </div>
            <strong className="exec-kpi-value">
              {loading ? "..." : `${summary.totalInvoicesCount} فاتورة`}
            </strong>
            <span className="exec-kpi-meta">
              إجمالي القيمة: {formatAmount(summary.totalInvoicesVolume)} {defaultCurrency}
            </span>
          </button>

          <button
            type="button"
            className="exec-kpi-card"
            onClick={() => {
              triggerHaptic("light");
              onOpenInventoryReport();
            }}
            data-testid="kpi-low-stock"
          >
            <div className="exec-kpi-top">
              <span className="exec-kpi-label">تنبيهات المخزون</span>
              <span
                className={`exec-kpi-icon ${summary.lowStockItems.length > 0 ? "alerts" : "healthy"}`}
                aria-hidden="true"
              >
                {summary.lowStockItems.length > 0 ? <ExclamationTriangleIcon /> : <CheckCircledIcon />}
              </span>
            </div>
            <strong
              className={`exec-kpi-value ${
                criticalCount > 0 ? "critical" : summary.lowStockItems.length > 0 ? "warning" : "healthy"
              }`}
            >
              {loading ? "..." : `${summary.lowStockItems.length} أصناف`}
            </strong>
            <span className="exec-kpi-meta">
              من أصل {summary.totalInventoryItems} صنف ·{" "}
              {criticalCount > 0
                ? `${criticalCount} نفاد وشيك`
                : summary.lowStockItems.length > 0
                  ? "دون الحد الأدنى المحدد"
                  : "المخزون ضمن الحد الآمن"}
            </span>
          </button>
        </section>
      );
    }

    if (widgetId === "sales-trend") {
      return <SalesTrendChart points={salesTrend} currency={defaultCurrency} loading={loading} />;
    }

    if (widgetId === "supplier-performance") {
      return (
        <SupplierPerformanceChart
          suppliers={supplierPerf}
          currency={defaultCurrency}
          loading={loading}
          onSelectSupplier={onOpenSupplier}
        />
      );
    }

    if (widgetId === "expense-trends") {
      return (
        <ExpenseTrendsChart
          accounts={accounts}
          ledger={ledger}
          currency={defaultCurrency}
          loading={loading}
          onNotify={onNotify}
        />
      );
    }

    if (widgetId === "recent-invoices") {
      return (
        <section className="exec-panel" aria-labelledby="recent-invoices-heading">
          <div className="exec-panel-head">
            <div>
              <h2 id="recent-invoices-heading">أحدث الفواتير</h2>
              <p>عرض آخر {summary.recentInvoices.length} مستندات فواتير ومردودات</p>
            </div>
            <div className="exec-panel-actions">
              <button
                type="button"
                className="exec-action-primary"
                onClick={() => {
                  triggerHaptic("light");
                  onCreateInvoice();
                }}
                data-testid="dashboard-create-invoice-btn"
              >
                <FilePlusIcon />
                <span>فاتورة جديدة</span>
              </button>
              <button type="button" className="exec-action-link" onClick={onOpenDailyJournal}>
                <span>الكل</span>
                <ArrowLeftIcon />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="exec-empty">جاري مزامنة الفواتير من السحابة...</div>
          ) : summary.recentInvoices.length === 0 ? (
            <div className="exec-empty">
              <p>لا توجد فواتير مسجلة ضمن الفترة المحددة.</p>
              <button type="button" className="exec-action-primary" onClick={onCreateInvoice}>
                <PlusIcon />
                <span>إصدار أول فاتورة</span>
              </button>
            </div>
          ) : (
            <ul className="exec-list" data-testid="recent-invoices-list">
              {summary.recentInvoices.map((entry) => {
                const paymentLabel =
                  entry.payment === "cash" ? "نقدي" : entry.payment === "credit" ? "آجل" : "رصيد";
                return (
                  <li key={entry.id}>
                    <button
                      type="button"
                      className="exec-row"
                      onClick={() => {
                        triggerHaptic("light");
                        onPreviewInvoice(entry.id);
                      }}
                    >
                      <div className="exec-row-main">
                        <strong>{entry.accountName}</strong>
                        <span className="exec-row-meta">
                          #{entry.entryNumber} · {entry.typeLabel} · {paymentLabel} · {entry.entryDate}
                          {entry.expenseCategory ? ` · ${entry.expenseCategory}` : ""}
                        </span>
                        {entry.details ? (
                          <span className="exec-row-detail">{entry.details.split("\n")[0]}</span>
                        ) : null}
                      </div>
                      <div className="exec-row-side">
                        <strong className={`exec-amount ${entry.kind === "return" ? "debit" : ""}`}>
                          {formatAmount(entry.amount)} {entry.currency}
                        </strong>
                        <span className="exec-row-link">
                          معاينة <ArrowLeftIcon />
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      );
    }

    return (
      <section className="exec-panel" aria-labelledby="low-stock-heading">
        <div className="exec-panel-head">
          <div>
            <h2 id="low-stock-heading">الأصناف دون الحد الأدنى</h2>
            <p>
              {selectedThresholdConfig.useItem
                ? "الأصناف التي انخفضت كميتها عن الحد الأدنى المحدد لكل صنف"
                : `الأصناف الأقل من ${selectedThresholdConfig.value} وحدة`}
            </p>
          </div>
          <div className="exec-panel-actions">
            <div className="exec-threshold-group" role="group" aria-label="حد تنبيه المخزون">
              {THRESHOLD_MODE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={thresholdMode === opt.id ? "active" : ""}
                  aria-pressed={thresholdMode === opt.id}
                  onClick={() => {
                    triggerHaptic("light");
                    setThresholdMode(opt.id);
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="exec-action-secondary"
              onClick={() => {
                triggerHaptic("light");
                onAddInventoryItem();
              }}
              aria-label="إضافة صنف للمخزن"
            >
              <PlusIcon />
              <span>صنف</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="exec-empty">جاري فحص أرصدة المخازن...</div>
        ) : summary.lowStockItems.length === 0 ? (
          <div className="exec-empty">
            <p>جميع الأصناف المسجلة تفي بالحد الأدنى المطلوب.</p>
            <button type="button" className="exec-action-link" onClick={onOpenInventoryReport}>
              <ReaderIcon />
              <span>عرض تقرير المخزون</span>
            </button>
          </div>
        ) : (
          <ul className="exec-list" data-testid="low-stock-list">
            {summary.lowStockItems.map((item) => {
              const isEditing = editingThresholdItemId === item.id;
              return (
                <li key={item.id} className="exec-stock-li">
                  <div className="exec-stock-row">
                    <button
                      type="button"
                      className="exec-stock-main-btn"
                      onClick={onOpenInventoryReport}
                    >
                      <div className="exec-row-main">
                        <strong>{item.name}</strong>
                        <span className="exec-row-meta">
                          {item.warehouseName}
                          {item.sku ? ` · ${item.sku}` : ""} · الحد الأدنى:{" "}
                          {formatAmount(item.effectiveThreshold)} {item.unit} · نقص{" "}
                          {formatAmount(item.shortage)}
                        </span>
                      </div>
                      <div className="exec-row-side">
                        <strong className="exec-qty">
                          {formatAmount(item.quantity)} / {formatAmount(item.effectiveThreshold)}{" "}
                          {item.unit}
                        </strong>
                        <span className={`exec-severity ${item.severity}`}>
                          {item.severity === "critical" ? "نفاد وشيك" : "دون الحد الأدنى"}
                        </span>
                      </div>
                    </button>
                    <button
                      type="button"
                      className="exec-threshold-edit-btn"
                      aria-label={`تعديل الحد الأدنى لصنف ${item.name}`}
                      onClick={() =>
                        isEditing ? setEditingThresholdItemId(null) : handleStartEditThreshold(item)
                      }
                    >
                      <Pencil1Icon />
                    </button>
                  </div>

                  {isEditing ? (
                    <div className="exec-threshold-inline">
                      <label>
                        <span>الحد الأدنى:</span>
                        <input
                          type="number"
                          min={0}
                          value={thresholdDraft}
                          aria-label={`الحد الأدنى الجديد لصنف ${item.name}`}
                          onChange={(e) => setThresholdDraft(e.target.value)}
                        />
                      </label>
                      <button
                        type="button"
                        className="exec-action-primary"
                        disabled={savingThreshold}
                        onClick={() => handleSaveThreshold(item)}
                      >
                        {savingThreshold ? "حفظ..." : "حفظ الحد"}
                      </button>
                      <button
                        type="button"
                        className="exec-action-link"
                        onClick={() => setEditingThresholdItemId(null)}
                      >
                        إلغاء
                      </button>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}

        <footer className="exec-panel-foot">
          <button type="button" className="exec-action-link" onClick={onOpenInventoryReport}>
            <BackpackIcon />
            <span>فتح تقرير حركة المخزون الكامل</span>
            <ArrowLeftIcon />
          </button>
        </footer>
      </section>
    );
  };

  return (
    <MobileScroll className="app-screen exec-dashboard-scroll">
      <main className="exec-dashboard-page" data-testid="analytics-dashboard-screen">
        <header className="exec-toolbar">
          <div className="exec-toolbar-copy">
            <h1>{companyName || "نسقو برو"}</h1>
            <p>ملخص المبيعات والفواتير والمخزون · {periodSubtitle}</p>
          </div>
          <div className="exec-toolbar-controls">
            <div className="exec-segmented" role="group" aria-label="تصفية الفترة الزمنية">
              {PERIOD_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={period === option.id ? "active" : ""}
                  aria-pressed={period === option.id}
                  onClick={() => {
                    triggerHaptic("light");
                    setPeriod(option.id);
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="exec-segmented" role="group" aria-label="وضع الألوان والمظهر">
              {THEME_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={themeMode === option.id ? "active" : ""}
                  aria-pressed={themeMode === option.id}
                  onClick={() => {
                    triggerHaptic("light");
                    onChangeThemeMode(option.id);
                  }}
                  data-testid={`theme-toggle-${option.id}`}
                >
                  {option.id === "light" ? (
                    <SunIcon />
                  ) : option.id === "dark" ? (
                    <MoonIcon />
                  ) : null}
                  <span>{option.label}</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              className={`exec-action-secondary ${customizeOpen ? "active" : ""}`}
              aria-expanded={customizeOpen}
              onClick={() => {
                triggerHaptic("light");
                setCustomizeOpen((v) => !v);
              }}
              data-testid="toggle-dashboard-settings-btn"
            >
              <MixerHorizontalIcon />
              <span>تخصيص</span>
            </button>

            <button
              type="button"
              className="exec-action-secondary"
              onClick={() => {
                triggerHaptic("light");
                onOpenNotifications();
              }}
              data-testid="open-notification-center-btn"
            >
              <BellIcon />
              <span>التنبيهات</span>
              {unreadNotificationsCount > 0 ? (
                <span className="exec-unread-count">{unreadNotificationsCount}</span>
              ) : null}
            </button>

            <PdfReportButton
              companyName={companyName}
              defaultCurrency={defaultCurrency}
              periodLabel={periodSubtitle}
              summary={summary}
              onNotify={onNotify}
            />
          </div>
        </header>

        {backupStatus.overdue ? (
          <aside className="exec-backup-banner overdue" role="status" data-testid="backup-freshness-banner">
            <div className="exec-backup-copy">
              <ExclamationTriangleIcon />
              <div>
                <strong>
                  {backupStatus.daysSince === null
                    ? "لم يتم إنشاء نسخة احتياطية كاملة بعد"
                    : `النسخة الاحتياطية قديمة (منذ ${backupStatus.daysSince} يومًا)`}
                </strong>
                <span>يُنصح بتصدير نسخة JSON كل 7 أيام لضمان أمان بياناتك وسهولة الاستعادة.</span>
              </div>
            </div>
            <button
              type="button"
              className="exec-action-primary"
              onClick={() => {
                triggerHaptic("success");
                onTriggerBackupNow();
              }}
              data-testid="backup-now-banner-btn"
            >
              <ArchiveIcon />
              <span>تنزيل نسخة احتياطية</span>
            </button>
          </aside>
        ) : null}

        {customizeOpen ? (
          <section className="exec-customize-panel" aria-label="إعدادات وتخصيص اللوحة" data-testid="dashboard-settings-panel">
            <div className="exec-customize-row">
              <div className="exec-customize-block">
                <strong>لون العلامة التجارية الأساسي</strong>
                <div className="exec-color-swatches">
                  {BRAND_COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      className={`exec-color-swatch ${brandColor === preset.hex ? "active" : ""}`}
                      style={{ background: preset.hex }}
                      aria-label={preset.label}
                      title={preset.label}
                      onClick={() => {
                        triggerHaptic("light");
                        onChangeBrandColor(preset.hex);
                        onNotify(`تم تغيير اللون الأساسي إلى ${preset.label}`);
                      }}
                      data-testid={`brand-swatch-${preset.id}`}
                    />
                  ))}
                  <label className="exec-color-custom" title="اختيار لون مخصص">
                    <input
                      type="color"
                      aria-label="لون مخصص للوحة"
                      value={brandColor}
                      onChange={(e) => onChangeBrandColor(e.target.value)}
                      data-testid="brand-color-picker"
                    />
                    <span>مخصص</span>
                  </label>
                  <button
                    type="button"
                    className="exec-action-link"
                    onClick={() => {
                      triggerHaptic("light");
                      onResetBrandColor();
                    }}
                  >
                    <ResetIcon />
                    <span>افتراضي</span>
                  </button>
                </div>
              </div>

              <div className="exec-customize-block">
                <strong>ترتيب البطاقات والتفاعل اللمسي</strong>
                <div className="exec-customize-toggles">
                  <button
                    type="button"
                    className={`exec-action-secondary ${reorderMode ? "active" : ""}`}
                    onClick={() => {
                      triggerHaptic("light");
                      setReorderMode((v) => !v);
                    }}
                    data-testid="toggle-reorder-mode-btn"
                  >
                    <DragHandleDots2Icon />
                    <span>{reorderMode ? "إنهاء الترتيب" : "ترتيب البطاقات بالسحب"}</span>
                  </button>
                  <button
                    type="button"
                    className="exec-action-link"
                    onClick={() => {
                      onChangeWidgetOrder([...DEFAULT_WIDGET_ORDER]);
                      triggerHaptic("light");
                      onNotify("تمت استعادة الترتيب الافتراضي للبطاقات");
                    }}
                  >
                    إعادة الترتيب
                  </button>
                  <label className="exec-haptic-toggle">
                    <input
                      type="checkbox"
                      checked={hapticsEnabled}
                      onChange={(e) => onToggleHaptics(e.target.checked)}
                    />
                    <span>الاهتزاز اللمسي</span>
                  </label>
                </div>
              </div>

              <div className="exec-customize-block">
                <strong>النسخ الاحتياطي السحابي</strong>
                <div className="exec-backup-status-inline">
                  <span>
                    {backupStatus.lastBackupIso
                      ? `آخر تصدير: ${backupStatus.lastBackupIso.slice(0, 10)} (منذ ${backupStatus.daysSince ?? 0} يوم)`
                      : "لم يتم تصدير نسخة بعد"}
                  </span>
                  <button
                    type="button"
                    className="exec-action-secondary"
                    onClick={() => {
                      triggerHaptic("success");
                      onTriggerBackupNow();
                    }}
                  >
                    <ArchiveIcon />
                    <span>تصدير JSON الآن</span>
                  </button>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <section className="exec-favorites-bar" aria-label="المفضلة المثبتة" data-testid="favorites-bar">
          <div className="exec-favorites-head">
            <span className="exec-favorites-title">
              <BookmarkFilledIcon />
              <strong>المفضلة المثبتة</strong>
            </span>
            <button
              type="button"
              className="exec-action-link"
              onClick={() => {
                triggerHaptic("light");
                setPinPickerOpen((v) => !v);
              }}
              data-testid="manage-favorites-btn"
            >
              <PlusIcon />
              <span>{pinPickerOpen ? "إغلاق" : "تثبيت مهمة"}</span>
            </button>
          </div>

          {favorites.length === 0 ? (
            <p className="exec-favorites-empty">لا توجد مهام مثبتة — اضغط «تثبيت مهمة» لإضافة اختصاراتك.</p>
          ) : (
            <div className="exec-favorites-rail">
              {favorites.map((fav) => (
                <div key={fav.id} className="exec-favorite-chip">
                  <button
                    type="button"
                    className="exec-favorite-launch"
                    onClick={() => {
                      triggerHaptic("light");
                      onLaunchFavorite(fav);
                    }}
                    data-testid={`favorite-item-${fav.id}`}
                  >
                    <strong>{fav.label}</strong>
                    {fav.subtitle ? <small>{fav.subtitle}</small> : null}
                  </button>
                  <button
                    type="button"
                    className="exec-favorite-unpin"
                    aria-label={`إزالة ${fav.label} من المفضلة`}
                    onClick={() => {
                      triggerHaptic("pin");
                      onUnpinFavorite(fav.id);
                    }}
                  >
                    <Cross2Icon />
                  </button>
                </div>
              ))}
            </div>
          )}

          {pinPickerOpen ? (
            <div className="exec-pin-picker" data-testid="pin-favorites-picker">
              {candidatePins.map((cand) => {
                const pinned = favorites.some((f) => f.id === cand.id);
                return (
                  <button
                    key={cand.id}
                    type="button"
                    className={`exec-pin-option ${pinned ? "pinned" : ""}`}
                    onClick={() => {
                      triggerHaptic("pin");
                      if (pinned) {
                        onUnpinFavorite(cand.id);
                      } else {
                        onPinFavorite(cand);
                      }
                    }}
                  >
                    {pinned ? <BookmarkFilledIcon /> : <BookmarkIcon />}
                    <span>{cand.label}</span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </section>

        <section className="exec-quick-actions" aria-label="الإجراءات السريعة">
          <button
            type="button"
            className="exec-quick-btn primary"
            onClick={() => {
              triggerHaptic("light");
              onCreateInvoice();
            }}
            data-testid="quick-action-new-invoice"
          >
            <FilePlusIcon />
            <div>
              <strong>فاتورة جديدة</strong>
              <small>إصدار فاتورة مبيعات أو خدمة</small>
            </div>
          </button>

          <button
            type="button"
            className="exec-quick-btn"
            onClick={() => {
              triggerHaptic("light");
              onCreatePurchase();
            }}
            data-testid="quick-action-new-purchase"
          >
            <CardStackIcon />
            <div>
              <strong>مشتريات جديدة</strong>
              <small>تسجيل فاتورة توريد لمورد</small>
            </div>
          </button>

          <button
            type="button"
            className="exec-quick-btn"
            onClick={() => {
              triggerHaptic("light");
              onCreateContact();
            }}
            data-testid="quick-action-new-contact"
          >
            <PersonIcon />
            <div>
              <strong>جهة اتصال جديدة</strong>
              <small>إضافة عميل أو مورد جديد</small>
            </div>
          </button>

          <button
            type="button"
            className="exec-quick-btn"
            onClick={() => {
              triggerHaptic("light");
              onOpenQrScanner();
            }}
            data-testid="quick-action-qr-scan"
          >
            <CameraIcon />
            <div>
              <strong>مسح رمز QR</strong>
              <small>إضافة للمخزون أو استعلام بالكاميرا</small>
            </div>
          </button>
        </section>

        <div className="exec-widgets-stack" data-testid="dashboard-widgets-stack">
          {widgetOrder.map((widgetId, index) => {
            const isDragging = draggedWidget === widgetId;
            const isDragOver = dragOverWidget === widgetId && draggedWidget !== widgetId;
            return (
              <div
                key={widgetId}
                className={`exec-widget-slot ${reorderMode ? "reordering" : ""} ${isDragging ? "dragging" : ""} ${
                  isDragOver ? "drag-over" : ""
                }`}
                draggable
                onDragStart={(e) => handleDragStart(e, widgetId)}
                onDragOver={(e) => handleDragOver(e, widgetId)}
                onDrop={(e) => handleDrop(e, widgetId)}
                onDragEnd={() => {
                  setDraggedWidget(null);
                  setDragOverWidget(null);
                }}
                data-widget-id={widgetId}
              >
                <div className="exec-widget-drag-bar">
                  <span className="exec-drag-handle" aria-label={`سحب لإعادة ترتيب ${WIDGET_LABELS[widgetId]}`}>
                    <DragHandleDots2Icon />
                    <small>{WIDGET_LABELS[widgetId]}</small>
                  </span>
                  <div className="exec-widget-move-btns">
                    <button
                      type="button"
                      aria-label={`تحريك ${WIDGET_LABELS[widgetId]} لأعلى`}
                      disabled={index === 0}
                      onClick={() => moveWidgetBy(widgetId, -1)}
                    >
                      <ArrowUpIcon />
                    </button>
                    <button
                      type="button"
                      aria-label={`تحريك ${WIDGET_LABELS[widgetId]} لأسفل`}
                      disabled={index === widgetOrder.length - 1}
                      onClick={() => moveWidgetBy(widgetId, 1)}
                    >
                      <ArrowDownIcon />
                    </button>
                  </div>
                </div>
                {renderWidget(widgetId)}
              </div>
            );
          })}
        </div>
      </main>
    </MobileScroll>
  );
}

export const DashboardScreen = Dashboard;
export default Dashboard;
