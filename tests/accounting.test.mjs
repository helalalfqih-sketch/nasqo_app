import test from "node:test";
import assert from "node:assert/strict";
import {
  accountMatchesQuery,
  buildCsvContent,
  computeAccountSummary,
  computeCategoryTotals,
  computeInventorySummary,
  computeStatementRows,
  normalizeArabicSearch,
  parseArabicNumber,
  sanitizeAccountPayload,
  sanitizeLedgerPayload,
} from "../src/accounting.ts";

const baseAccount = {
  id: "acc_1",
  ownerId: "user_1",
  name: "البراري للتوريد",
  category: "purchases",
  phone: "0558321042",
  creditLimit: 1000000,
  currency: "ريال",
  isCashAccount: false,
  accountImage: "1",
  sortOrder: 1,
  settlement: false,
  documentNumberRequired: false,
  messageMethod: "sms",
  sendMode: "never",
  note: "",
  openingBalance: 100000,
  openingDirection: "credit",
  codeNumber: 34,
};

test("parseArabicNumber parses Arabic/Persian digits and formatting commas", () => {
  assert.equal(parseArabicNumber("١٢٬٥٠٠٫٥"), 12500.5);
  assert.equal(parseArabicNumber("3,000"), 3000);
  assert.equal(parseArabicNumber("invalid"), 0);
  assert.equal(parseArabicNumber(""), 0);
});

test("normalizeArabicSearch strips tatweel and normalizes alef variants", () => {
  assert.equal(normalizeArabicSearch("نقـد هلال"), "نقد هلال");
  assert.equal(normalizeArabicSearch("إبراهيم وأحمد"), "ابراهيم واحمد");
});

test("computeAccountSummary computes balances from opening + debit/credit entries and ignores quotes/orders/deleted", () => {
  const entries = [
    {
      id: "e1",
      ownerId: "user_1",
      accountId: "acc_1",
      accountName: "البراري للتوريد",
      counterpartAccountId: "",
      counterpartAccountName: "",
      kind: "invoice",
      typeLabel: "فاتورة آجلة",
      payment: "credit",
      direction: "credit",
      amount: 50000,
      currency: "ريال",
      exchangeRate: 1,
      details: "توريد",
      documentNumber: "",
      warehouseId: "",
      warehouseName: "",
      invoiceContent: "items",
      entryNumber: 1,
      deleted: false,
      entryDate: "2026-01-01",
      createdAtMs: 100,
    },
    {
      id: "e2",
      ownerId: "user_1",
      accountId: "acc_1",
      accountName: "البراري للتوريد",
      counterpartAccountId: "",
      counterpartAccountName: "",
      kind: "voucher",
      typeLabel: "عليه",
      payment: "cash",
      direction: "debit",
      amount: 20000,
      currency: "ريال",
      exchangeRate: 1,
      details: "سداد",
      documentNumber: "",
      warehouseId: "",
      warehouseName: "",
      invoiceContent: "none",
      entryNumber: 2,
      deleted: false,
      entryDate: "2026-01-02",
      createdAtMs: 200,
    },
    {
      id: "e3",
      ownerId: "user_1",
      accountId: "acc_1",
      accountName: "البراري للتوريد",
      counterpartAccountId: "",
      counterpartAccountName: "",
      kind: "quote",
      typeLabel: "عرض سعر",
      payment: "credit",
      direction: "credit",
      amount: 99999,
      currency: "ريال",
      exchangeRate: 1,
      details: "عرض سعر غير ملزم",
      documentNumber: "",
      warehouseId: "",
      warehouseName: "",
      invoiceContent: "free",
      entryNumber: 3,
      deleted: false,
      entryDate: "2026-01-03",
      createdAtMs: 300,
    },
    {
      id: "e4",
      ownerId: "user_1",
      accountId: "acc_1",
      accountName: "البراري للتوريد",
      counterpartAccountId: "",
      counterpartAccountName: "",
      kind: "voucher",
      typeLabel: "سند",
      payment: "cash",
      direction: "debit",
      amount: 5000,
      currency: "ريال",
      exchangeRate: 1,
      details: "محذوف",
      documentNumber: "",
      warehouseId: "",
      warehouseName: "",
      invoiceContent: "none",
      entryNumber: 4,
      deleted: true,
      entryDate: "2026-01-04",
      createdAtMs: 400,
    },
  ];

  const summary = computeAccountSummary(baseAccount, entries);
  assert.equal(summary.creditTotal, 150000);
  assert.equal(summary.debitTotal, 20000);
  assert.equal(summary.netBalance, 130000);
  assert.equal(summary.tone, "credit");
  assert.equal(summary.entryCount, 3);
});

test("computeStatementRows calculates chronological running balances and filters by search mode", () => {
  const entries = [
    {
      id: "e1",
      ownerId: "user_1",
      accountId: "acc_1",
      accountName: "البراري للتوريد",
      counterpartAccountId: "",
      counterpartAccountName: "",
      kind: "invoice",
      typeLabel: "فاتورة آجلة",
      payment: "credit",
      direction: "credit",
      amount: 33000,
      currency: "ريال",
      exchangeRate: 1,
      details: "عازل سطوح",
      documentNumber: "DOC-9",
      warehouseId: "",
      warehouseName: "المخزن الرئيسي",
      invoiceContent: "items",
      entryNumber: 1178,
      deleted: false,
      entryDate: "2025-12-28",
      createdAtMs: 1000,
    },
    {
      id: "e2",
      ownerId: "user_1",
      accountId: "acc_1",
      accountName: "البراري للتوريد",
      counterpartAccountId: "",
      counterpartAccountName: "",
      kind: "voucher",
      typeLabel: "عليه",
      payment: "cash",
      direction: "debit",
      amount: 13000,
      currency: "ريال",
      exchangeRate: 1,
      details: "سداد نقدي",
      documentNumber: "",
      warehouseId: "",
      warehouseName: "",
      invoiceContent: "none",
      entryNumber: 1179,
      deleted: false,
      entryDate: "2025-12-29",
      createdAtMs: 2000,
    },
  ];

  const statement = computeStatementRows(baseAccount, entries, { showPreviousBalance: false });
  assert.equal(statement.rows.length, 2);
  // Reverse chronological: newest (1179) first with balance 20000, older (1178) with 33000
  assert.equal(statement.rows[0].entryNumber, 1179);
  assert.equal(statement.rows[0].runningBalance, 20000);
  assert.equal(statement.rows[1].runningBalance, 33000);
  assert.equal(statement.netBalance, 20000);

  const filtered = computeStatementRows(baseAccount, entries, {
    searchQuery: "عازل",
    searchMode: "البيان",
  });
  assert.equal(filtered.rows.length, 1);
  assert.equal(filtered.rows[0].entryNumber, 1178);
});

test("computeCategoryTotals & computeInventorySummary aggregate across accounts and inventory items", () => {
  const totals = computeCategoryTotals([baseAccount], []);
  assert.equal(totals.purchases.netSigned, 100000);
  assert.equal(totals.clients.netSigned, 0);

  const inv = computeInventorySummary(
    [
      { id: "i1", ownerId: "user_1", name: "ابجورة", unit: "حبة", quantity: 10, avgCost: 500, warehouseId: "w1" },
      { id: "i2", ownerId: "user_1", name: "مصباح", unit: "حبة", quantity: 5, avgCost: 200, warehouseId: "w2" },
    ],
    "w1",
  );
  assert.equal(inv.items.length, 1);
  assert.equal(inv.totalQuantity, 10);
  assert.equal(inv.totalValue, 5000);
});

test("sanitizers clamp bounds and reject invalid enums; buildCsvContent adds UTF-8 BOM and escapes commas", () => {
  const longName = "ا".repeat(150);
  const acc = sanitizeAccountPayload({
    ownerId: "u1",
    name: longName,
    category: "invalid_cat",
    openingBalance: "٥٠٠",
  });
  assert.equal(acc.name.length, 100);
  assert.equal(acc.category, "purchases");
  assert.equal(acc.openingBalance, 500);

  const led = sanitizeLedgerPayload({
    ownerId: "u1",
    accountId: "acc_1",
    accountName: "مورد",
    amount: "-50",
    exchangeRate: "0",
  });
  assert.equal(led.amount, 50 > 0 ? 0 : 0); // clamped >= 0
  assert.equal(led.exchangeRate, 1);

  assert.equal(accountMatchesQuery(baseAccount, "براري"), true);
  const csv = buildCsvContent(["الاسم", "ملاحظة"], [["أحمد", 'قيمة "1", سطر']]);
  assert.ok(csv.startsWith("\uFEFFالاسم,ملاحظة"));
  assert.ok(csv.includes('"قيمة ""1"", سطر"'));
});

import {
  computeDashboardSummary,
  computeExpenseTrendsByCategory,
  computeSalesTrend7Days,
  computeSupplierPerformance,
  computeWorkspaceNotifications,
  inferExpenseCategory,
  isBackupOverdue,
  normalizeExpenseCategory,
  parseQrStockPayload,
} from "../src/accounting.ts";

test("computeDashboardSummary aggregates total sales, sorts recent invoices, and flags low-stock inventory", () => {
  const accounts = [
    baseAccount,
    {
      ...baseAccount,
      id: "acc_sales",
      name: "المبيعات العامة",
      category: "sales",
      openingBalance: 10000,
      openingDirection: "debit",
    },
  ];
  const entries = [
    {
      id: "inv_old",
      ownerId: "user_1",
      accountId: "acc_sales",
      accountName: "المبيعات العامة",
      counterpartAccountId: "",
      counterpartAccountName: "",
      kind: "invoice",
      typeLabel: "فاتورة مبيعات",
      payment: "cash",
      direction: "debit",
      amount: 5000,
      currency: "ريال",
      exchangeRate: 1,
      details: "بيع 1",
      documentNumber: "",
      warehouseId: "w1",
      warehouseName: "المخزن الرئيسي",
      invoiceContent: "items",
      entryNumber: 101,
      deleted: false,
      entryDate: "2026-10-01",
      createdAtMs: 100,
    },
    {
      id: "inv_new",
      ownerId: "user_1",
      accountId: "acc_sales",
      accountName: "المبيعات العامة",
      counterpartAccountId: "",
      counterpartAccountName: "",
      kind: "invoice",
      typeLabel: "فاتورة مبيعات",
      payment: "credit",
      direction: "debit",
      amount: 8000,
      currency: "ريال",
      exchangeRate: 1,
      details: "بيع 2",
      documentNumber: "",
      warehouseId: "w1",
      warehouseName: "المخزن الرئيسي",
      invoiceContent: "items",
      entryNumber: 102,
      deleted: false,
      entryDate: "2026-11-10",
      createdAtMs: 200,
    },
    {
      id: "ret_1",
      ownerId: "user_1",
      accountId: "acc_sales",
      accountName: "المبيعات العامة",
      counterpartAccountId: "",
      counterpartAccountName: "",
      kind: "return",
      typeLabel: "مردود مبيعات",
      payment: "credit",
      direction: "credit",
      amount: 2000,
      currency: "ريال",
      exchangeRate: 1,
      details: "مرتجع",
      documentNumber: "",
      warehouseId: "w1",
      warehouseName: "المخزن الرئيسي",
      invoiceContent: "items",
      entryNumber: 103,
      deleted: false,
      entryDate: "2026-11-11",
      createdAtMs: 300,
    },
    {
      id: "q_1",
      ownerId: "user_1",
      accountId: "acc_sales",
      accountName: "المبيعات العامة",
      counterpartAccountId: "",
      counterpartAccountName: "",
      kind: "quote",
      typeLabel: "عرض سعر",
      payment: "credit",
      direction: "debit",
      amount: 99000,
      currency: "ريال",
      exchangeRate: 1,
      details: "عرض سعر",
      documentNumber: "",
      warehouseId: "w1",
      warehouseName: "المخزن الرئيسي",
      invoiceContent: "free",
      entryNumber: 104,
      deleted: false,
      entryDate: "2026-11-12",
      createdAtMs: 400,
    },
  ];
  const warehouses = [{ id: "w1", ownerId: "user_1", name: "المخزن الرئيسي", details: "", isDefault: true, codeNumber: 1 }];
  const inventory = [
    { id: "i1", ownerId: "user_1", name: "صنف منخفض جدا", unit: "حبة", quantity: 8, avgCost: 100, warehouseId: "w1", minThreshold: 20 },
    { id: "i2", ownerId: "user_1", name: "صنف منخفض", unit: "حبة", quantity: 20, avgCost: 50, warehouseId: "w1", minThreshold: 30 },
    { id: "i3", ownerId: "user_1", name: "صنف وافر", unit: "حبة", quantity: 60, avgCost: 30, warehouseId: "w1", minThreshold: 10 },
  ];

  const allSummary = computeDashboardSummary(accounts, entries, warehouses, inventory, {
    lowStockThreshold: 25,
    useItemThresholds: true,
    period: "all",
  });
  // opening (10,000) + inv_old (5,000) + inv_new (8,000) - ret_1 (2,000) = 21,000
  assert.equal(allSummary.totalSales, 21000);
  assert.equal(allSummary.salesInvoiceCount, 2);
  assert.equal(allSummary.salesAccountCount, 1);
  // quotes are excluded from recentInvoices; ret_1 (Nov 11) comes first
  assert.equal(allSummary.recentInvoices.length, 3);
  assert.equal(allSummary.recentInvoices[0].id, "ret_1");
  assert.equal(allSummary.recentInvoices[1].id, "inv_new");
  assert.equal(allSummary.lowStockItems.length, 2);
  assert.equal(allSummary.lowStockItems[0].id, "i1");
  assert.equal(allSummary.lowStockItems[0].effectiveThreshold, 20);
  assert.equal(allSummary.lowStockItems[0].severity, "critical");
  assert.equal(allSummary.lowStockItems[1].effectiveThreshold, 30);
  assert.equal(allSummary.lowStockItems[1].severity, "warning");
  assert.equal(allSummary.lowStockItems[0].warehouseName, "المخزن الرئيسي");

  const weekSummary = computeDashboardSummary(accounts, entries, warehouses, inventory, {
    period: "week",
    referenceDate: new Date("2026-11-14T00:00:00Z"),
  });
  // Within 7 days of Nov 14: inv_new (8,000) - ret_1 (2,000) = 6,000
  assert.equal(weekSummary.totalSales, 6000);
  assert.equal(weekSummary.recentInvoices.length, 2);
});

test("computeSalesTrend7Days builds a 7-day daily sales series", () => {
  const accounts = [
    { ...baseAccount, id: "acc_sales", name: "مبيعات", category: "sales", openingBalance: 0, openingDirection: "debit" },
  ];
  const entries = [
    {
      id: "s1",
      ownerId: "user_1",
      accountId: "acc_sales",
      accountName: "مبيعات",
      counterpartAccountId: "",
      counterpartAccountName: "",
      kind: "invoice",
      typeLabel: "فاتورة مبيعات",
      payment: "cash",
      direction: "debit",
      amount: 4000,
      currency: "ريال",
      exchangeRate: 1,
      details: "بيع اليوم",
      documentNumber: "",
      warehouseId: "w1",
      warehouseName: "",
      invoiceContent: "items",
      entryNumber: 1,
      deleted: false,
      entryDate: "2026-11-14",
      createdAtMs: 100,
    },
    {
      id: "s2",
      ownerId: "user_1",
      accountId: "acc_sales",
      accountName: "مبيعات",
      counterpartAccountId: "",
      counterpartAccountName: "",
      kind: "invoice",
      typeLabel: "فاتورة مبيعات",
      payment: "cash",
      direction: "debit",
      amount: 2500,
      currency: "ريال",
      exchangeRate: 1,
      details: "بيع سابق",
      documentNumber: "",
      warehouseId: "w1",
      warehouseName: "",
      invoiceContent: "items",
      entryNumber: 2,
      deleted: false,
      entryDate: "2026-11-10",
      createdAtMs: 90,
    },
  ];
  const trend = computeSalesTrend7Days(accounts, entries, new Date("2026-11-14T12:00:00Z"));
  assert.equal(trend.length, 7);
  assert.equal(trend[0].dateIso, "2026-11-08");
  assert.equal(trend[6].dateIso, "2026-11-14");
  assert.equal(trend[6].salesTotal, 4000);
  assert.equal(trend[2].salesTotal, 2500);
});

test("parseQrStockPayload parses JSON, key-value strings, and plain SKU codes", () => {
  const jsonPayload = parseQrStockPayload('{"sku":"SKU-101","name":"محول كهرباء","qty":12,"cost":45,"min":10}');
  assert.equal(jsonPayload.sku, "SKU-101");
  assert.equal(jsonPayload.name, "محول كهرباء");
  assert.equal(jsonPayload.quantity, 12);
  assert.equal(jsonPayload.avgCost, 45);
  assert.equal(jsonPayload.minThreshold, 10);

  const kvPayload = parseQrStockPayload("sku=SKU-202;name=كابل شحن;qty=5;cost=15");
  assert.equal(kvPayload.sku, "SKU-202");
  assert.equal(kvPayload.name, "كابل شحن");
  assert.equal(kvPayload.quantity, 5);
  assert.equal(kvPayload.avgCost, 15);

  const plainSku = parseQrStockPayload("sku:ABC-909");
  assert.equal(plainSku.sku, "ABC-909");
  assert.equal(plainSku.lookupKey, "ABC-909");
});

test("isBackupOverdue and computeWorkspaceNotifications surface due invoices, low stock, credit limits, and backup alerts", () => {
  const refDate = new Date("2026-11-15T00:00:00Z");
  assert.equal(isBackupOverdue(null, refDate).overdue, true);
  assert.equal(isBackupOverdue("2026-11-01T00:00:00Z", refDate).overdue, true);
  assert.equal(isBackupOverdue("2026-11-13T00:00:00Z", refDate).overdue, false);

  const accounts = [
    { ...baseAccount, id: "acc_over", name: "عميل متجاوز", category: "clients", creditLimit: 5000, openingBalance: 8000, openingDirection: "debit" },
  ];
  const entries = [
    {
      id: "inv_due",
      ownerId: "user_1",
      accountId: "acc_over",
      accountName: "عميل متجاوز",
      counterpartAccountId: "",
      counterpartAccountName: "",
      kind: "invoice",
      typeLabel: "فاتورة آجلة",
      payment: "credit",
      direction: "debit",
      amount: 3000,
      currency: "ريال",
      exchangeRate: 1,
      details: "استحقاق قريب",
      documentNumber: "",
      warehouseId: "w1",
      warehouseName: "",
      invoiceContent: "items",
      entryNumber: 50,
      deleted: false,
      entryDate: "2026-11-01",
      dueDate: "2026-11-12",
      createdAtMs: 100,
    },
  ];
  const warehouses = [{ id: "w1", ownerId: "user_1", name: "رئيسي", details: "", isDefault: true, codeNumber: 1 }];
  const inventory = [
    { id: "i_low", ownerId: "user_1", name: "صنف حرج", unit: "حبة", quantity: 3, avgCost: 20, warehouseId: "w1", minThreshold: 15 },
  ];

  const notifications = computeWorkspaceNotifications(accounts, entries, warehouses, inventory, null, refDate, {
    lastBackupIso: null,
  });
  assert.ok(notifications.some((n) => n.id === "due_inv_due"));
  assert.ok(notifications.some((n) => n.id === "limit_acc_over"));
  assert.ok(notifications.some((n) => n.id === "stock_i_low"));
  assert.ok(notifications.some((n) => n.id === "sys_backup_overdue"));
});

test("inferExpenseCategory, normalizeExpenseCategory, computeSupplierPerformance, and computeExpenseTrendsByCategory", () => {
  assert.equal(inferExpenseCategory("بوليصة شحن وتوصيل بضاعة", "ناقل"), "شحن ونقل");
  assert.equal(inferExpenseCategory("دفع رواتب شهر نوفمبر", "موظف", "employees"), "رواتب وأجور");
  assert.equal(normalizeExpenseCategory("شحن ونقل"), "شحن ونقل");
  assert.equal(normalizeExpenseCategory("غير موجود"), null);

  const accounts = [
    baseAccount,
    { ...baseAccount, id: "sup_2", name: "مؤسسة الأمل", category: "purchases", openingBalance: 0, codeNumber: 35 },
  ];
  const entries = [
    {
      id: "p1",
      ownerId: "user_1",
      accountId: "acc_1",
      accountName: "البراري للتوريد",
      counterpartAccountId: "",
      counterpartAccountName: "",
      kind: "invoice",
      typeLabel: "فاتورة مشتريات",
      payment: "credit",
      direction: "credit",
      amount: 12000,
      currency: "ريال",
      exchangeRate: 1,
      details: "توريد أجهزة كهربائية",
      documentNumber: "",
      warehouseId: "w1",
      warehouseName: "",
      invoiceContent: "items",
      entryNumber: 201,
      deleted: false,
      entryDate: "2026-11-10",
      deliveryDays: 2,
      expenseCategory: "مشتريات بضائع",
      createdAtMs: 100,
    },
    {
      id: "p2",
      ownerId: "user_1",
      accountId: "sup_2",
      accountName: "مؤسسة الأمل",
      counterpartAccountId: "",
      counterpartAccountName: "",
      kind: "voucher",
      typeLabel: "سند صرف",
      payment: "cash",
      direction: "credit",
      amount: 3000,
      currency: "ريال",
      exchangeRate: 1,
      details: "شحن وتوصيل سريع",
      documentNumber: "",
      warehouseId: "",
      warehouseName: "",
      invoiceContent: "none",
      entryNumber: 202,
      deleted: false,
      entryDate: "2026-10-05",
      deliveryDays: 4,
      createdAtMs: 200,
    },
  ];

  const perf = computeSupplierPerformance(accounts, entries);
  assert.equal(perf.length, 2);
  assert.equal(perf[0].accountId, "acc_1");
  assert.equal(perf[0].avgDeliveryDays, 2);

  const refDate = new Date("2026-11-15T00:00:00Z");
  const monthTrends = computeExpenseTrendsByCategory(accounts, entries, "month", refDate);
  assert.equal(monthTrends.totalSpend, 12000);
  assert.equal(monthTrends.slices.length, 1);
  assert.equal(monthTrends.slices[0].category, "مشتريات بضائع");

  const quarterTrends = computeExpenseTrendsByCategory(accounts, entries, "quarter", refDate);
  assert.equal(quarterTrends.totalSpend, 15000);
  assert.equal(quarterTrends.slices.length, 2);
  assert.ok(quarterTrends.slices.some((s) => s.category === "شحن ونقل"));
});

import {
  DEFAULT_FAVORITES,
  DEFAULT_HOME_METRIC_ORDER,
  DEFAULT_WIDGET_ORDER,
  readHomeMetricOrder,
  readPinnedFavorites,
  readWidgetOrder,
} from "../src/utils/dashboardPrefs.ts";
import { buildWhatsAppMessageUrl, normalizeWhatsAppPhone } from "../src/accounting.ts";

test("dashboardPrefs provides safe default metric order, widget order, and favorites in non-DOM contexts", () => {
  assert.equal(DEFAULT_HOME_METRIC_ORDER.length, 8);
  assert.deepEqual(readHomeMetricOrder(), [...DEFAULT_HOME_METRIC_ORDER]);
  assert.equal(DEFAULT_WIDGET_ORDER.length, 6);
  assert.deepEqual(readWidgetOrder(), [...DEFAULT_WIDGET_ORDER]);
  assert.ok(DEFAULT_FAVORITES.length >= 3);
  assert.deepEqual(readPinnedFavorites(), [...DEFAULT_FAVORITES]);
});

test("normalizeWhatsAppPhone and buildWhatsAppMessageUrl format Arabic/international digits cleanly", () => {
  assert.equal(normalizeWhatsAppPhone("٠٠٩٦٧-٧٧٦٢٠٤٩٤٤"), "967776204944");
  assert.equal(normalizeWhatsAppPhone("776 204 944"), "776204944");
  assert.equal(
    buildWhatsAppMessageUrl("+967 776204944", "مرحبا"),
    "https://wa.me/967776204944?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7",
  );
  assert.equal(
    buildWhatsAppMessageUrl("", "رسالة"),
    "https://wa.me/?text=%D8%B1%D8%B3%D8%A7%D9%84%D8%A9",
  );
});

import { DEFAULT_EXTENDED_SETTINGS, readExtendedSettings } from "../src/utils/appSettings.ts";

test("appSettings returns safe Arabic defaults and bounds in non-DOM contexts", () => {
  const settings = readExtendedSettings();
  assert.deepEqual(settings, DEFAULT_EXTENDED_SETTINGS);
  assert.equal(settings.usageMode, "sync");
  assert.equal(settings.syncMode, "auto");
  assert.equal(settings.creditBalanceLabel, "الرصيد لكم");
  assert.equal(settings.debitBalanceLabel, "الرصيد عليكم");
  assert.equal(settings.invoicePrintTemplate, "1");
});

import {
  computeMonthlySalesPurchases,
  filterEntriesByFiscalYear,
} from "../src/accounting.ts";

test("filterEntriesByFiscalYear and computeMonthlySalesPurchases aggregate H1/H2 sales and purchases accurately", () => {
  const accounts = [
    { ...baseAccount, id: "acc_sales", name: "المبيعات", category: "sales", openingBalance: 0, openingDirection: "debit" },
    { ...baseAccount, id: "acc_sup", name: "المورد الرئيسي", category: "purchases", openingBalance: 0, openingDirection: "credit" },
  ];
  const entries = [
    {
      id: "m1_sales",
      ownerId: "user_1",
      accountId: "acc_sales",
      accountName: "المبيعات",
      counterpartAccountId: "",
      counterpartAccountName: "",
      kind: "invoice",
      typeLabel: "فاتورة بيع",
      payment: "cash",
      direction: "debit",
      amount: 180000,
      currency: "ريال",
      exchangeRate: 1,
      details: "مبيعات يناير",
      documentNumber: "",
      warehouseId: "w1",
      warehouseName: "",
      invoiceContent: "items",
      entryNumber: 1,
      deleted: false,
      entryDate: "2026-01-15",
      createdAtMs: 100,
    },
    {
      id: "m1_ret",
      ownerId: "user_1",
      accountId: "acc_sales",
      accountName: "المبيعات",
      counterpartAccountId: "",
      counterpartAccountName: "",
      kind: "return",
      typeLabel: "مردود بيع",
      payment: "cash",
      direction: "credit",
      amount: 20000,
      currency: "ريال",
      exchangeRate: 1,
      details: "مردود",
      documentNumber: "",
      warehouseId: "w1",
      warehouseName: "",
      invoiceContent: "items",
      entryNumber: 2,
      deleted: false,
      entryDate: "2026-01-16",
      createdAtMs: 200,
    },
    {
      id: "m3_pur",
      ownerId: "user_1",
      accountId: "acc_sup",
      accountName: "المورد الرئيسي",
      counterpartAccountId: "",
      counterpartAccountName: "",
      kind: "invoice",
      typeLabel: "فاتورة شراء",
      payment: "credit",
      direction: "credit",
      amount: 140000,
      currency: "ريال",
      exchangeRate: 1,
      details: "توريد مارس",
      documentNumber: "",
      warehouseId: "w1",
      warehouseName: "",
      invoiceContent: "items",
      entryNumber: 3,
      deleted: false,
      entryDate: "2026-03-10",
      createdAtMs: 300,
    },
    {
      id: "m_quote_ignored",
      ownerId: "user_1",
      accountId: "acc_sales",
      accountName: "المبيعات",
      counterpartAccountId: "",
      counterpartAccountName: "",
      kind: "quote",
      typeLabel: "عرض سعر",
      payment: "credit",
      direction: "debit",
      amount: 999999,
      currency: "ريال",
      exchangeRate: 1,
      details: "عرض سعر",
      documentNumber: "",
      warehouseId: "w1",
      warehouseName: "",
      invoiceContent: "free",
      entryNumber: 4,
      deleted: false,
      entryDate: "2026-02-10",
      createdAtMs: 400,
    },
    {
      id: "m_deleted_ignored",
      ownerId: "user_1",
      accountId: "acc_sup",
      accountName: "المورد الرئيسي",
      counterpartAccountId: "",
      counterpartAccountName: "",
      kind: "invoice",
      typeLabel: "فاتورة شراء",
      payment: "credit",
      direction: "credit",
      amount: 500000,
      currency: "ريال",
      exchangeRate: 1,
      details: "محذوف",
      documentNumber: "",
      warehouseId: "w1",
      warehouseName: "",
      invoiceContent: "items",
      entryNumber: 5,
      deleted: true,
      entryDate: "2026-04-01",
      createdAtMs: 500,
    },
    {
      id: "y2025_h2_sales",
      ownerId: "user_1",
      accountId: "acc_sales",
      accountName: "المبيعات",
      counterpartAccountId: "",
      counterpartAccountName: "",
      kind: "invoice",
      typeLabel: "فاتورة بيع",
      payment: "cash",
      direction: "debit",
      amount: 75000,
      currency: "ريال",
      exchangeRate: 1,
      details: "مبيعات نوفمبر",
      documentNumber: "",
      warehouseId: "w1",
      warehouseName: "",
      invoiceContent: "items",
      entryNumber: 6,
      deleted: false,
      entryDate: "2025-11-20",
      createdAtMs: 600,
    },
  ];

  assert.equal(filterEntriesByFiscalYear(entries, "all").length, 6);
  assert.equal(filterEntriesByFiscalYear(entries, 2026).length, 5);
  assert.equal(filterEntriesByFiscalYear(entries, 2025).length, 1);

  const chart2026 = computeMonthlySalesPurchases(accounts, entries, { fiscalYear: 2026 });
  assert.equal(chart2026.points.length, 6);
  assert.equal(chart2026.points[0].monthKey, "2026-01");
  assert.equal(chart2026.points[0].label, "يناير");
  assert.equal(chart2026.points[0].sales, 160000);
  assert.equal(chart2026.points[1].sales, 0); // quote excluded
  assert.equal(chart2026.points[2].purchases, 140000);
  assert.equal(chart2026.points[3].purchases, 0); // deleted excluded
  assert.equal(chart2026.maxVal, 200000);
  assert.deepEqual(chart2026.ticks, [0, 50000, 100000, 150000, 200000]);

  const chart2025 = computeMonthlySalesPurchases(accounts, entries, { fiscalYear: 2025 });
  assert.equal(chart2025.points[0].monthKey, "2025-07");
  assert.equal(chart2025.points[4].monthKey, "2025-11");
  assert.equal(chart2025.points[4].sales, 75000);
});




