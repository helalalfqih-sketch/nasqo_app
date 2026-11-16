import {
  BarChartIcon,
  CardStackIcon,
  CubeIcon,
  FilePlusIcon,
  FileTextIcon,
  LayersIcon,
  PersonIcon,
  PlusIcon,
  ReaderIcon,
  SwitchIcon,
} from "@radix-ui/react-icons";
import { MobileScroll } from "../mobile";
import {
  computeAccountSummary,
  computeCategoryTotals,
  computeDashboardSummary,
  computeInventorySummary,
  formatAmount,
} from "../accounting";
import type {
  AccountRecord,
  CurrencyCode,
  InventoryItemRecord,
  LedgerEntryRecord,
  WarehouseRecord,
} from "../types";

export type ErpModuleId =
  | "financials"
  | "hr"
  | "pos"
  | "procurement"
  | "manufacturing";

export function erpModuleTitle(moduleId: ErpModuleId): string {
  switch (moduleId) {
    case "financials":
      return "القوائم المالية والأستاذ العام";
    case "hr":
      return "الموارد البشرية والرواتب";
    case "pos":
      return "نقطة البيع وخط المبيعات (CRM)";
    case "procurement":
      return "أوامر الشراء وسلسلة التوريد";
    case "manufacturing":
      return "التصنيع (BOM) ومراكز التكلفة";
  }
}

export interface ErpModulePageProps {
  moduleId: ErpModuleId;
  defaultCurrency: CurrencyCode;
  accounts: readonly AccountRecord[];
  ledger: readonly LedgerEntryRecord[];
  warehouses: readonly WarehouseRecord[];
  inventory: readonly InventoryItemRecord[];
  onOpenDailyJournal: () => void;
  onOpenCurrency: () => void;
  onOpenEmployees: () => void;
  onOpenClients: () => void;
  onOpenPurchases: () => void;
  onOpenSales: () => void;
  onOpenShop: () => void;
  onOpenWarehouses: () => void;
  onOpenInventoryReport: () => void;
  onOpenSupplier: (accountId: string) => void;
  onOpenTransaction: (account?: AccountRecord) => void;
  onOpenInvoiceSales: () => void;
  onOpenInvoicePurchases: () => void;
  onOpenOrderPurchases: () => void;
  onOpenQuotes: () => void;
  onOpenAccountCreate: (category: AccountRecord["category"]) => void;
  onOpenInventoryAdd: () => void;
  onPrintFinancials: () => void;
}

export function ErpModulePage({
  moduleId,
  defaultCurrency,
  accounts,
  ledger,
  warehouses,
  inventory,
  onOpenDailyJournal,
  onOpenCurrency,
  onOpenEmployees,
  onOpenClients,
  onOpenPurchases,
  onOpenSales,
  onOpenShop,
  onOpenWarehouses,
  onOpenInventoryReport,
  onOpenSupplier,
  onOpenTransaction,
  onOpenInvoiceSales,
  onOpenInvoicePurchases,
  onOpenOrderPurchases,
  onOpenQuotes,
  onOpenAccountCreate,
  onOpenInventoryAdd,
  onPrintFinancials,
}: ErpModulePageProps) {
  const categoryTotals = computeCategoryTotals(accounts, ledger);
  const salesTotals = categoryTotals.sales;
  const purchasesTotals = categoryTotals.purchases;
  const clientsTotals = categoryTotals.clients;
  const employeesTotals = categoryTotals.employees;
  const shopTotals = categoryTotals.shop;

  const inventorySummary = computeInventorySummary(inventory);
  const dashboardSummary = computeDashboardSummary(accounts, ledger, warehouses, inventory);

  const activeEntries = ledger.filter((e) => !e.deleted);
  const revenue = Math.max(salesTotals.debitTotal, salesTotals.creditTotal);
  const expenses = Math.max(purchasesTotals.debitTotal, purchasesTotals.creditTotal);
  const netOperating = revenue - expenses;

  const employeeAccounts = accounts.filter((a) => a.category === "employees");
  const clientAccounts = accounts.filter((a) => a.category === "clients");
  const purchaseAccounts = accounts.filter((a) => a.category === "purchases");
  const shopAccounts = accounts.filter((a) => a.category === "shop");

  const salesInvoices = activeEntries
    .filter((e) => e.kind === "invoice")
    .slice(0, 6);
  const openOrders = activeEntries.filter((e) => e.kind === "order");
  const lowStockItems = inventory.filter((item) => item.quantity <= (item.minThreshold ?? 25));

  return (
    <MobileScroll className="app-screen erp-module-scroll">
      <main className="erp-module-page" data-testid={`erp-module-${moduleId}`}>
        {moduleId === "financials" ? (
          <>
            <section className="erp-module-hero">
              <div className="erp-module-hero-head">
                <BarChartIcon />
                <div>
                  <strong>ملخص المركز المالي</strong>
                  <small>قائمة الدخل والأستاذ العام بالعملة الأساسية ({defaultCurrency})</small>
                </div>
              </div>
              <div className="erp-module-kpi-grid">
                <article className="erp-module-kpi">
                  <span>إجمالي المبيعات</span>
                  <strong className="tone-green">{formatAmount(revenue)}</strong>
                </article>
                <article className="erp-module-kpi">
                  <span>إجمالي المشتريات</span>
                  <strong className="tone-red">{formatAmount(expenses)}</strong>
                </article>
                <article className="erp-module-kpi">
                  <span>صافي التشغيل</span>
                  <strong className={netOperating >= 0 ? "tone-green" : "tone-red"}>
                    {formatAmount(Math.abs(netOperating))}
                    {netOperating < 0 ? "-" : ""}
                  </strong>
                </article>
                <article className="erp-module-kpi">
                  <span>رصيد الصناديق والمحل</span>
                  <strong>{formatAmount(Math.abs(shopTotals.netSigned))}</strong>
                </article>
              </div>
            </section>

            <section className="erp-module-actions">
              <button type="button" onClick={onOpenDailyJournal}>
                <ReaderIcon />
                <span>دفتر الأستاذ والحركة اليومية</span>
              </button>
              <button type="button" onClick={onOpenCurrency}>
                <SwitchIcon />
                <span>صرف العملات والتسوية</span>
              </button>
              <button type="button" onClick={onPrintFinancials}>
                <FileTextIcon />
                <span>طباعة التقرير المالي</span>
              </button>
            </section>

            <section className="erp-module-card">
              <h3>ميزان المراجعة حسب الأقسام</h3>
              <div className="erp-module-list">
                {[
                  { label: "العملاء والذمم المدينة", total: Math.abs(clientsTotals.netSigned), count: clientsTotals.count, onClick: onOpenClients },
                  { label: "الموردون والمشتريات", total: Math.abs(purchasesTotals.netSigned), count: purchasesTotals.count, onClick: onOpenPurchases },
                  { label: "المبيعات والإيرادات", total: Math.abs(salesTotals.netSigned), count: salesTotals.count, onClick: onOpenSales },
                  { label: "الموظفون والمستحقات", total: Math.abs(employeesTotals.netSigned), count: employeesTotals.count, onClick: onOpenEmployees },
                  { label: "الصندوق والمحل", total: Math.abs(shopTotals.netSigned), count: shopTotals.count, onClick: onOpenShop },
                ].map((row) => (
                  <button key={row.label} type="button" className="erp-module-row" onClick={row.onClick}>
                    <div>
                      <strong>{row.label}</strong>
                      <small>{row.count} حساب نشط</small>
                    </div>
                    <b><bdi dir="ltr">{formatAmount(row.total)}</bdi> {defaultCurrency}</b>
                  </button>
                ))}
              </div>
            </section>
          </>
        ) : null}

        {moduleId === "hr" ? (
          <>
            <section className="erp-module-hero">
              <div className="erp-module-hero-head">
                <PersonIcon />
                <div>
                  <strong>إدارة الموارد البشرية والرواتب</strong>
                  <small>متابعة مستحقات الموظفين والسلف والحركات المالية</small>
                </div>
              </div>
              <div className="erp-module-kpi-grid">
                <article className="erp-module-kpi">
                  <span>عدد الموظفين</span>
                  <strong>{employeeAccounts.length}</strong>
                </article>
                <article className="erp-module-kpi">
                  <span>صافي الأرصدة</span>
                  <strong className={employeesTotals.netSigned < 0 ? "tone-red" : "tone-green"}>
                    {formatAmount(Math.abs(employeesTotals.netSigned))}
                  </strong>
                </article>
              </div>
            </section>

            <section className="erp-module-actions">
              <button type="button" onClick={onOpenEmployees}>
                <PersonIcon />
                <span>قائمة حسابات الموظفين</span>
              </button>
              <button type="button" onClick={() => onOpenTransaction(employeeAccounts[0])}>
                <CardStackIcon />
                <span>صرف راتب أو سلفة</span>
              </button>
              <button type="button" onClick={() => onOpenAccountCreate("employees")}>
                <PlusIcon />
                <span>إضافة موظف جديد</span>
              </button>
            </section>

            <section className="erp-module-card">
              <h3>كشوف الموظفين</h3>
              {employeeAccounts.length === 0 ? (
                <p className="erp-module-empty">لا توجد حسابات موظفين مسجلة بعد.</p>
              ) : (
                <div className="erp-module-list">
                  {employeeAccounts.map((acc) => {
                    const summary = computeAccountSummary(acc, ledger);
                    return (
                      <button
                        key={acc.id}
                        type="button"
                        className="erp-module-row"
                        onClick={() => onOpenSupplier(acc.id)}
                      >
                        <div>
                          <strong>{acc.name}</strong>
                          <small>{summary.entryCount} حركة · كود #{acc.codeNumber}</small>
                        </div>
                        <b className={summary.tone === "credit" ? "tone-green" : "tone-red"}>
                          <bdi dir="ltr">{formatAmount(summary.netBalance)}</bdi> {acc.currency}
                        </b>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        ) : null}

        {moduleId === "pos" ? (
          <>
            <section className="erp-module-hero">
              <div className="erp-module-hero-head">
                <FilePlusIcon />
                <div>
                  <strong>نقطة البيع وخط المبيعات (CRM)</strong>
                  <small>فواتير البيع السريعة ومتابعة عملاء المبيعات وعروض الأسعار</small>
                </div>
              </div>
              <div className="erp-module-kpi-grid">
                <article className="erp-module-kpi">
                  <span>إجمالي الفواتير</span>
                  <strong>{dashboardSummary.salesInvoiceCount}</strong>
                </article>
                <article className="erp-module-kpi">
                  <span>أرصدة العملاء</span>
                  <strong className="tone-green">{formatAmount(Math.abs(clientsTotals.netSigned))}</strong>
                </article>
              </div>
            </section>

            <section className="erp-module-actions">
              <button type="button" onClick={onOpenInvoiceSales}>
                <PlusIcon />
                <span>فاتورة بيع سريعة (POS)</span>
              </button>
              <button type="button" onClick={onOpenClients}>
                <PersonIcon />
                <span>إدارة العملاء (CRM)</span>
              </button>
              <button type="button" onClick={onOpenQuotes}>
                <FileTextIcon />
                <span>عرض سعر جديد</span>
              </button>
            </section>

            <section className="erp-module-card">
              <h3>أحدث فواتير المبيعات ({salesInvoices.length})</h3>
              {salesInvoices.length === 0 ? (
                <p className="erp-module-empty">لا توجد فواتير مسجلة حتى الآن.</p>
              ) : (
                <div className="erp-module-list">
                  {salesInvoices.map((entry) => {
                    const account = accounts.find((a) => a.id === entry.accountId);
                    return (
                      <button
                        key={entry.id}
                        type="button"
                        className="erp-module-row"
                        onClick={() => account && onOpenSupplier(account.id)}
                      >
                        <div>
                          <strong>{account?.name || "فاتورة مبيعات"}</strong>
                          <small>#{entry.entryNumber} · {entry.details || "فاتورة"}</small>
                        </div>
                        <b><bdi dir="ltr">{formatAmount(entry.amount)}</bdi> {entry.currency}</b>
                      </button>
                    );
                  })}
                </div>
              )}
              {clientAccounts.length > 0 ? (
                <p className="erp-module-footnote">العملاء المسجلون: {clientAccounts.length} عميل</p>
              ) : null}
            </section>
          </>
        ) : null}

        {moduleId === "procurement" ? (
          <>
            <section className="erp-module-hero">
              <div className="erp-module-hero-head">
                <CubeIcon />
                <div>
                  <strong>أوامر الشراء وسلسلة التوريد</strong>
                  <small>متابعة الموردين والطلبيات ونواقص المخزون</small>
                </div>
              </div>
              <div className="erp-module-kpi-grid">
                <article className="erp-module-kpi">
                  <span>الموردون النشطون</span>
                  <strong>{purchaseAccounts.length}</strong>
                </article>
                <article className="erp-module-kpi">
                  <span>طلبيات الشراء</span>
                  <strong>{openOrders.length}</strong>
                </article>
                <article className="erp-module-kpi">
                  <span>نواقص المخزون</span>
                  <strong className={lowStockItems.length > 0 ? "tone-red" : "tone-green"}>
                    {lowStockItems.length}
                  </strong>
                </article>
              </div>
            </section>

            <section className="erp-module-actions">
              <button type="button" onClick={onOpenOrderPurchases}>
                <FilePlusIcon />
                <span>طلبية شراء جديدة</span>
              </button>
              <button type="button" onClick={onOpenInvoicePurchases}>
                <PlusIcon />
                <span>فاتورة شراء</span>
              </button>
              <button type="button" onClick={onOpenPurchases}>
                <ReaderIcon />
                <span>دليل الموردين والمشتريات</span>
              </button>
            </section>

            <section className="erp-module-card">
              <h3>تنبيهات التوريد والنواقص</h3>
              {lowStockItems.length === 0 ? (
                <p className="erp-module-empty">جميع الأصناف أعلى من حد التنبيه الحالي.</p>
              ) : (
                <div className="erp-module-list">
                  {lowStockItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="erp-module-row"
                      onClick={onOpenInventoryReport}
                    >
                      <div>
                        <strong>{item.name}</strong>
                        <small>الحد الأدنى: {item.minThreshold ?? 25} {item.unit}</small>
                      </div>
                      <b className="tone-red">
                        <bdi dir="ltr">{formatAmount(item.quantity)}</bdi> {item.unit}
                      </b>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </>
        ) : null}

        {moduleId === "manufacturing" ? (
          <>
            <section className="erp-module-hero">
              <div className="erp-module-hero-head">
                <LayersIcon />
                <div>
                  <strong>التصنيع (BOM) ومراكز التكلفة</strong>
                  <small>قيمة المخزون عبر المخازن ومراكز التكلفة التشغيلية</small>
                </div>
              </div>
              <div className="erp-module-kpi-grid">
                <article className="erp-module-kpi">
                  <span>المخازن</span>
                  <strong>{warehouses.length}</strong>
                </article>
                <article className="erp-module-kpi">
                  <span>إجمالي الكميات</span>
                  <strong>{formatAmount(inventorySummary.totalQuantity)}</strong>
                </article>
                <article className="erp-module-kpi">
                  <span>قيمة المخزون</span>
                  <strong className="tone-green">{formatAmount(inventorySummary.totalValue)}</strong>
                </article>
                <article className="erp-module-kpi">
                  <span>مراكز التكلفة</span>
                  <strong>{shopAccounts.length}</strong>
                </article>
              </div>
            </section>

            <section className="erp-module-actions">
              <button type="button" onClick={onOpenWarehouses}>
                <CubeIcon />
                <span>إدارة المخازن</span>
              </button>
              <button type="button" onClick={onOpenInventoryReport}>
                <BarChartIcon />
                <span>تقرير حركة المخزون</span>
              </button>
              <button type="button" onClick={onOpenInventoryAdd}>
                <PlusIcon />
                <span>إضافة صنف خام / منتج</span>
              </button>
            </section>

            <section className="erp-module-card">
              <h3>مراكز التكلفة والمستودعات</h3>
              <div className="erp-module-list">
                {warehouses.map((wh) => {
                  const whSummary = computeInventorySummary(inventory, wh.id);
                  return (
                    <button
                      key={wh.id}
                      type="button"
                      className="erp-module-row"
                      onClick={onOpenWarehouses}
                    >
                      <div>
                        <strong>{wh.name}</strong>
                        <small>{whSummary.items.length} صنف · {wh.details || "مخزن"}</small>
                      </div>
                      <b><bdi dir="ltr">{formatAmount(whSummary.totalValue)}</bdi> {defaultCurrency}</b>
                    </button>
                  );
                })}
              </div>
            </section>
          </>
        ) : null}
      </main>
    </MobileScroll>
  );
}
