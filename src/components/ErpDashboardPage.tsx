import { useMemo, useState } from "react";
import {
  BarChartIcon,
  CalendarIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  CubeIcon,
  FilePlusIcon,
  FileTextIcon,
  LightningBoltIcon,
  PersonIcon,
} from "@radix-ui/react-icons";
import { MobileScroll } from "../mobile";
import {
  computeCategoryTotals,
  computeDashboardSummary,
  computeMonthlySalesPurchases,
  filterEntriesByFiscalYear,
  formatAmount,
} from "../accounting";
import type {
  AccountRecord,
  CurrencyCode,
  InventoryItemRecord,
  LedgerEntryRecord,
  WarehouseRecord,
} from "../types";
import { triggerHaptic } from "../utils/haptics";
import { ErpSalesPurchasesChart } from "./ErpSalesPurchasesChart";

export interface ErpDashboardPageProps {
  companyName: string;
  defaultCurrency: CurrencyCode;
  accounts: readonly AccountRecord[];
  ledger: readonly LedgerEntryRecord[];
  warehouses: readonly WarehouseRecord[];
  inventory: readonly InventoryItemRecord[];
  onOpenSales: () => void;
  onOpenPurchases: () => void;
  onOpenClients: () => void;
  onOpenEmployees: () => void;
  onOpenShop: () => void;
  onOpenInventoryReport: () => void;
  onOpenDailyJournal: () => void;
  onOpenAnalytics: () => void;
  onOpenTransaction: () => void;
  onOpenCurrency: () => void;
  onOpenInvoiceSales: () => void;
  onOpenInvoicePurchases: () => void;
  onOpenAccountPicker: () => void;
  onOpenAccountCreate: () => void;
  onOpenSettings: () => void;
  onNotify: (message: string) => void;
}

function BuildingSvg() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="3" width="11" height="18" rx="1.5" />
      <path d="M15 9h4a1 1 0 0 1 1 1v11H15" />
      <path d="M8 7h3M8 11h3M8 15h3M9.5 21v-3" />
    </svg>
  );
}

function BranchTreeSvg() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <rect x="3" y="16" width="5" height="4" rx="1" />
      <rect x="9.5" y="16" width="5" height="4" rx="1" />
      <rect x="16" y="16" width="5" height="4" rx="1" />
      <path d="M12 7v4.5M5.5 16v-2.5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2V16M12 11.5V16" />
    </svg>
  );
}

function CartSvg() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="17.5" cy="20" r="1.4" />
      <path d="M3 4h2.4l2.1 10.6a1.5 1.5 0 0 0 1.5 1.2h8.7a1.5 1.5 0 0 0 1.4-1.1L21 8H6.2" />
    </svg>
  );
}

function CartPlusSvg() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="20" r="1.35" />
      <circle cx="17.5" cy="20" r="1.35" />
      <path d="M3 4h2.4l2.1 10.4a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.4-1.1L20.5 9" />
      <path d="M13 5.5h5M15.5 3v5" />
    </svg>
  );
}

function CubesStackSvg() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3 4 2.2v4.4L12 11.8 8 9.6V5.2L12 3Z" />
      <path d="m7.5 11.5 4 2.2v4.4l-4 2.2-4-2.2v-4.4l4-2.2Z" />
      <path d="m16.5 11.5 4 2.2v4.4l-4 2.2-4-2.2v-4.4l4-2.2Z" />
    </svg>
  );
}

function ShopStoreSvg() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 9.5V19a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 20 19V9.5" />
      <path d="M3 8.5 4.8 4h14.4L21 8.5a2.4 2.4 0 0 1-4.5 1 2.4 2.4 0 0 1-4.5 0 2.4 2.4 0 0 1-4.5 0A2.4 2.4 0 0 1 3 8.5Z" />
      <path d="M9.5 20.5V15h5v5.5" />
    </svg>
  );
}

function UsersGroupSvg() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19.2a5.5 5.5 0 0 1 11 0" />
      <circle cx="16.8" cy="9" r="2.5" />
      <path d="M16 14.3a4.5 4.5 0 0 1 4.8 4.9" />
    </svg>
  );
}

function CoinsExchangeSvg() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="9.5" cy="6.5" rx="5.5" ry="2.5" />
      <path d="M4 6.5v3.2c0 1.4 2.5 2.5 5.5 2.5s5.5-1.1 5.5-2.5V6.5" />
      <path d="M4 9.7v3.2c0 1.4 2.5 2.5 5.5 2.5" />
      <path d="m14.5 16.5 2.5 2.5 3-3" />
      <path d="M17 19V13" />
    </svg>
  );
}

function DocSearchSvg() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 3.5H7A1.5 1.5 0 0 0 5.5 5v14A1.5 1.5 0 0 0 7 20.5h7" />
      <path d="M14 3.5 18.5 8v3" />
      <path d="M9 10h4M9 13.5h2.5" />
      <circle cx="16.5" cy="16.5" r="3" />
      <path d="m18.7 18.7 2 2" />
    </svg>
  );
}

function UserPlusSvg() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9.5" cy="8" r="3.4" />
      <path d="M3.5 19.5a6 6 0 0 1 12 0" />
      <path d="M17.5 10.5h4M19.5 8.5v4" />
    </svg>
  );
}

function formatSignedValue(signed: number): string {
  const rounded = Math.round(signed * 100) / 100;
  if (Math.abs(rounded) < 0.005) return "0";
  return rounded < 0 ? `-${formatAmount(Math.abs(rounded))}` : formatAmount(rounded);
}

export function ErpDashboardPage({
  companyName,
  defaultCurrency,
  accounts,
  ledger,
  warehouses,
  inventory,
  onOpenSales,
  onOpenPurchases,
  onOpenClients,
  onOpenEmployees,
  onOpenShop,
  onOpenInventoryReport,
  onOpenDailyJournal,
  onOpenAnalytics,
  onOpenTransaction,
  onOpenCurrency,
  onOpenInvoiceSales,
  onOpenInvoicePurchases,
  onOpenAccountPicker,
  onOpenAccountCreate,
  onOpenSettings,
  onNotify,
}: ErpDashboardPageProps) {
  const currentYear = new Date().getFullYear();
  const [fiscalYear, setFiscalYear] = useState<number | "all">(currentYear);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("main");

  const yearOptions = useMemo(() => {
    const years = new Set<number>([currentYear, currentYear - 1, currentYear - 2]);
    for (const entry of ledger) {
      const yr = Number(entry.entryDate.slice(0, 4));
      if (Number.isFinite(yr) && yr >= 2020 && yr <= 2100) {
        years.add(yr);
      }
    }
    return Array.from(years).sort((a, b) => b - a);
  }, [currentYear, ledger]);

  const filteredLedger = useMemo(
    () => filterEntriesByFiscalYear(ledger, fiscalYear),
    [fiscalYear, ledger],
  );

  const branchInventory = useMemo(() => {
    if (selectedBranchId === "main") return inventory;
    return inventory.filter((item) => item.warehouseId === selectedBranchId);
  }, [inventory, selectedBranchId]);

  const branchWarehouses = useMemo(() => {
    if (selectedBranchId === "main") return warehouses;
    return warehouses.filter((w) => w.id === selectedBranchId);
  }, [selectedBranchId, warehouses]);

  const summary = useMemo(
    () =>
      computeDashboardSummary(accounts, filteredLedger, branchWarehouses, branchInventory, {
        lowStockThreshold: 25,
        useItemThresholds: true,
        recentInvoicesLimit: 6,
      }),
    [accounts, branchInventory, branchWarehouses, filteredLedger],
  );

  const categoryTotals = useMemo(
    () => computeCategoryTotals(accounts, filteredLedger),
    [accounts, filteredLedger],
  );

  const chartData = useMemo(
    () =>
      computeMonthlySalesPurchases(accounts, ledger, {
        fiscalYear,
      }),
    [accounts, fiscalYear, ledger],
  );

  const selectedBranchLabel =
    selectedBranchId === "main"
      ? "الفرع الرئيسي"
      : warehouses.find((w) => w.id === selectedBranchId)?.name || "الفرع الرئيسي";

  const quickActions = [
    {
      id: "new-voucher",
      label: "سند جديد",
      tone: "blue",
      icon: <FilePlusIcon />,
      onClick: onOpenTransaction,
    },
    {
      id: "currency",
      label: "صرف عملات",
      tone: "amber",
      icon: <CoinsExchangeSvg />,
      onClick: onOpenCurrency,
    },
    {
      id: "purchase-invoice",
      label: "فاتورة شراء",
      tone: "purple",
      icon: <CartPlusSvg />,
      onClick: onOpenInvoicePurchases,
    },
    {
      id: "sales-invoice",
      label: "فاتورة بيع",
      tone: "green",
      icon: <CartPlusSvg />,
      onClick: onOpenInvoiceSales,
    },
    {
      id: "statement",
      label: "كشف حساب",
      tone: "blue",
      icon: <DocSearchSvg />,
      onClick: onOpenAccountPicker,
    },
    {
      id: "inventory-report",
      label: "تقرير المخزون",
      tone: "amber",
      icon: <CubeIcon />,
      onClick: onOpenInventoryReport,
    },
    {
      id: "daily-journal",
      label: "الحركة اليومية",
      tone: "purple",
      icon: <CalendarIcon />,
      onClick: onOpenDailyJournal,
    },
    {
      id: "new-account",
      label: "حساب جديد",
      tone: "green",
      icon: <UserPlusSvg />,
      onClick: onOpenAccountCreate,
    },
  ] as const;

  const importantReports = [
    {
      id: "daily-sales-report",
      label: "تقرير المبيعات اليومية",
      icon: <FileTextIcon />,
      onClick: onOpenAnalytics,
    },
    {
      id: "stock-report",
      label: "تقرير المخزون",
      icon: <CubeIcon />,
      onClick: onOpenInventoryReport,
    },
    {
      id: "suppliers-accounts",
      label: "حسابات الموردين",
      icon: <UsersGroupSvg />,
      onClick: onOpenPurchases,
    },
    {
      id: "clients-accounts",
      label: "حسابات العملاء",
      icon: <PersonIcon />,
      onClick: onOpenClients,
    },
  ] as const;

  return (
    <MobileScroll className="app-screen erp-dashboard-scroll">
      <div className="erp-context-bar" aria-label="سياق الشركة والفرع والسنة المالية">
        <button
          type="button"
          className="erp-company-pill"
          onClick={() => {
            triggerHaptic("light");
            onOpenSettings();
          }}
          aria-label="تحديد أو تعديل بيانات الشركة"
          data-testid="erp-company-selector"
        >
          <span className="erp-pill-icon">
            <BuildingSvg />
          </span>
          <span className="erp-pill-label">{companyName || "الشركة الرئيسية"}</span>
          <ChevronDownIcon className="erp-pill-chevron" />
        </button>

        <label className="erp-branch-pill" aria-label="اختيار الفرع أو المخزن">
          <span className="erp-pill-icon">
            <BranchTreeSvg />
          </span>
          <span className="erp-pill-label">{selectedBranchLabel}</span>
          <select
            aria-label="الفرع"
            value={selectedBranchId}
            onChange={(e) => {
              triggerHaptic("light");
              const nextId = e.target.value;
              setSelectedBranchId(nextId);
              const label =
                nextId === "main"
                  ? "الفرع الرئيسي"
                  : warehouses.find((w) => w.id === nextId)?.name || "الفرع";
              onNotify(`تم التبديل إلى ${label}`);
            }}
            data-testid="erp-branch-select"
          >
            <option value="main">الفرع الرئيسي</option>
            {warehouses.map((wh) => (
              <option key={wh.id} value={wh.id}>
                {wh.name}
              </option>
            ))}
          </select>
        </label>

        <div className="erp-year-box">
          <span className="erp-year-caption">السنة المالية</span>
          <div className="erp-year-row">
            <span className="erp-year-cal" aria-hidden="true">
              <CalendarIcon />
            </span>
            <label className="erp-year-select-wrap">
              <select
                aria-label="السنة المالية"
                value={String(fiscalYear)}
                onChange={(e) => {
                  triggerHaptic("light");
                  const raw = e.target.value;
                  setFiscalYear(raw === "all" ? "all" : Number(raw));
                }}
                data-testid="erp-fiscal-year-select"
              >
                {yearOptions.map((yr) => (
                  <option key={yr} value={String(yr)}>
                    {yr}
                  </option>
                ))}
                <option value="all">الكل</option>
              </select>
              <ChevronDownIcon className="erp-pill-chevron" />
            </label>
          </div>
        </div>
      </div>

      <main className="erp-dashboard-page" data-testid="dashboard-screen">
        <section className="erp-kpi-container" aria-label="ملخص الأرصدة والمؤشرات">
          <div className="erp-kpi-grid">
            <button
              type="button"
              className="erp-kpi-tile sales"
              onClick={() => {
                triggerHaptic("light");
                onOpenSales();
              }}
              data-testid="erp-kpi-sales"
            >
              <span className="erp-kpi-tile-icon" aria-hidden="true">
                <CartSvg />
              </span>
              <strong dir="ltr">{formatAmount(summary.totalSales)}</strong>
              <span>المبيعات</span>
            </button>

            <button
              type="button"
              className="erp-kpi-tile stock"
              onClick={() => {
                triggerHaptic("light");
                onOpenInventoryReport();
              }}
              data-testid="erp-kpi-low-stock"
            >
              <span className="erp-kpi-tile-icon" aria-hidden="true">
                <CubesStackSvg />
              </span>
              <strong dir="ltr">{formatAmount(summary.lowStockItems.length)}</strong>
              <span>نواقص المخزون</span>
            </button>

            <button
              type="button"
              className="erp-kpi-tile invoices"
              onClick={() => {
                triggerHaptic("light");
                onOpenDailyJournal();
              }}
              data-testid="erp-kpi-invoices"
            >
              <span className="erp-kpi-tile-icon" aria-hidden="true">
                <FilePlusIcon />
              </span>
              <strong dir="ltr">{formatAmount(summary.totalInvoicesCount)}</strong>
              <span>الفواتير</span>
            </button>

            <button
              type="button"
              className="erp-kpi-tile shop"
              onClick={() => {
                triggerHaptic("light");
                onOpenShop();
              }}
              data-testid="erp-kpi-shop"
            >
              <span className="erp-kpi-tile-icon" aria-hidden="true">
                <ShopStoreSvg />
              </span>
              <strong dir="ltr">{formatSignedValue(categoryTotals.shop.netSigned)}</strong>
              <span>المحل</span>
            </button>

            <button
              type="button"
              className="erp-kpi-tile clients"
              onClick={() => {
                triggerHaptic("light");
                onOpenClients();
              }}
              data-testid="erp-kpi-clients"
            >
              <span className="erp-kpi-tile-icon" aria-hidden="true">
                <PersonIcon />
              </span>
              <strong dir="ltr">{formatSignedValue(categoryTotals.clients.netSigned)}</strong>
              <span>العملاء</span>
            </button>

            <button
              type="button"
              className="erp-kpi-tile employees"
              onClick={() => {
                triggerHaptic("light");
                onOpenEmployees();
              }}
              data-testid="erp-kpi-employees"
            >
              <span className="erp-kpi-tile-icon" aria-hidden="true">
                <UsersGroupSvg />
              </span>
              <strong dir="ltr">{formatSignedValue(categoryTotals.employees.netSigned)}</strong>
              <span>الموظفين</span>
            </button>
          </div>
        </section>

        <ErpSalesPurchasesChart
          points={chartData.points}
          maxVal={chartData.maxVal}
          ticks={chartData.ticks}
          currency={defaultCurrency}
        />

        <section className="erp-section-card" aria-label="العمليات السريعة">
          <header className="erp-section-head">
            <div className="erp-section-title">
              <span className="erp-section-icon" aria-hidden="true">
                <LightningBoltIcon />
              </span>
              <h2>العمليات السريعة</h2>
            </div>
          </header>

          <div className="erp-quick-grid">
            {quickActions.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`erp-quick-tile ${item.tone}`}
                onClick={() => {
                  triggerHaptic("light");
                  item.onClick();
                }}
                data-testid={`erp-quick-${item.id}`}
              >
                <span className="erp-quick-icon" aria-hidden="true">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="erp-section-card" aria-label="تقارير هامة">
          <header className="erp-section-head">
            <div className="erp-section-title">
              <span className="erp-section-icon" aria-hidden="true">
                <BarChartIcon />
              </span>
              <h2>تقارير هامة</h2>
            </div>
          </header>

          <div className="erp-reports-list">
            {importantReports.map((report) => (
              <button
                key={report.id}
                type="button"
                className="erp-report-row"
                onClick={() => {
                  triggerHaptic("light");
                  report.onClick();
                }}
                data-testid={`erp-report-${report.id}`}
              >
                <span className="erp-report-icon" aria-hidden="true">
                  {report.icon}
                </span>
                <span className="erp-report-label">{report.label}</span>
                <ChevronLeftIcon className="erp-report-chevron" aria-hidden="true" />
              </button>
            ))}
          </div>
        </section>
      </main>
    </MobileScroll>
  );
}
