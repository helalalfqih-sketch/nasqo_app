import {
  ACCOUNT_CATEGORIES,
  CURRENCIES,
  EXPENSE_CATEGORIES,
  LEDGER_KINDS,
  SCHEMA_LIMITS,
  type AccountCategory,
  type AccountRecord,
  type CurrencyCode,
  type ExpenseCategory,
  type InventoryItemRecord,
  type InvoiceLineItem,
  type InvoiceRecord,
  type InvoiceTotals,
  type LedgerEntryRecord,
  type LedgerKind,
  type StatementRowWithBalance,
  type WarehouseRecord,
  type WorkspaceSettings,
} from "./types.ts";

const ARABIC_INDIC = "٠١٢٣٤٥٦٧٨٩";
const PERSIAN_INDIC = "۰۱۲۳۴۵۶۷۸۹";

export function parseArabicNumber(raw: string | number | null | undefined): number {
  if (typeof raw === "number") {
    return Number.isFinite(raw) ? raw : 0;
  }
  if (!raw) return 0;
  const ascii = String(raw)
    .replace(/[٠-٩]/g, (d) => String(ARABIC_INDIC.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String(PERSIAN_INDIC.indexOf(d)))
    .replace(/[,٬\s]/g, "")
    .replace(/٫/g, ".");
  const parsed = Number(ascii);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatAmount(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  const rounded = Math.round(safe * 100) / 100;
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(rounded);
}

export function normalizeArabicSearch(text: string): string {
  return text
    .replace(/[أإآ]/g, "ا")
    .replace(/[ـ,٬]/g, "")
    .replace(/[٠-٩]/g, (d) => String(ARABIC_INDIC.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String(PERSIAN_INDIC.indexOf(d)))
    .toLocaleLowerCase()
    .trim();
}

export function clampString(value: string, max: number): string {
  const trimmed = String(value ?? "").trim();
  return trimmed.length > max ? trimmed.slice(0, max) : trimmed;
}

export function isValidCurrency(val: string): val is CurrencyCode {
  return (CURRENCIES as readonly string[]).includes(val);
}

export function isValidCategory(val: string): val is AccountCategory {
  return (ACCOUNT_CATEGORIES as readonly string[]).includes(val);
}

export function isValidLedgerKind(val: string): val is LedgerKind {
  return (LEDGER_KINDS as readonly string[]).includes(val);
}

export function sanitizeWorkspacePayload(input: Partial<WorkspaceSettings> & { ownerId: string }) {
  return {
    ownerId: clampString(input.ownerId, SCHEMA_LIMITS.ownerIdMax),
    companyName: clampString(input.companyName || "نسقو برو", SCHEMA_LIMITS.companyNameMax) || "نسقو برو",
    defaultCurrency: isValidCurrency(input.defaultCurrency ?? "") ? input.defaultCurrency! : "ريال",
    whatsappProvider: input.whatsappProvider === "external" ? "external" : "nasqo",
    whatsappInstantEnabled: Boolean(input.whatsappInstantEnabled),
    whatsappPhone: clampString(input.whatsappPhone ?? "", SCHEMA_LIMITS.phoneMax),
  };
}

export function sanitizeAccountPayload(input: Partial<AccountRecord> & { ownerId: string; name: string }) {
  const safeOpening = Math.max(0, parseArabicNumber(input.openingBalance));
  const safeLimit = Math.max(0, parseArabicNumber(input.creditLimit));
  return {
    ownerId: clampString(input.ownerId, SCHEMA_LIMITS.ownerIdMax),
    name: clampString(input.name, SCHEMA_LIMITS.accountNameMax),
    category: isValidCategory(input.category ?? "") ? input.category! : "purchases",
    phone: clampString(input.phone ?? "", SCHEMA_LIMITS.phoneMax),
    creditLimit: safeLimit,
    currency: isValidCurrency(input.currency ?? "") ? input.currency! : "ريال",
    isCashAccount: Boolean(input.isCashAccount),
    accountImage: input.accountImage === "2" || input.accountImage === "3" ? input.accountImage : "1",
    sortOrder: Number.isFinite(input.sortOrder) ? Number(input.sortOrder) : 1,
    settlement: Boolean(input.settlement),
    documentNumberRequired: Boolean(input.documentNumberRequired),
    messageMethod: input.messageMethod === "whatsapp" ? "whatsapp" : "sms",
    sendMode: input.sendMode === "auto" || input.sendMode === "confirm" ? input.sendMode : "never",
    note: clampString(input.note ?? "", SCHEMA_LIMITS.accountNoteMax),
    openingBalance: safeOpening,
    openingDirection: input.openingDirection === "credit" ? "credit" : "debit",
    codeNumber: Number.isFinite(input.codeNumber) ? Number(input.codeNumber) : 1,
  };
}

export function sanitizeLedgerPayload(
  input: Partial<LedgerEntryRecord> & { ownerId: string; accountId: string; accountName: string },
) {
  const safeAmount = Math.max(0, parseArabicNumber(input.amount));
  const safeRate = Math.max(0.0001, parseArabicNumber(input.exchangeRate) || 1);
  const dueDate = clampString(input.dueDate ?? "", SCHEMA_LIMITS.entryDateMax);
  const expenseCategory = clampString(input.expenseCategory ?? "", SCHEMA_LIMITS.expenseCategoryMax);
  const rawDelivery =
    input.deliveryDays !== undefined && input.deliveryDays !== null
      ? parseArabicNumber(input.deliveryDays)
      : undefined;
  const deliveryDays =
    rawDelivery !== undefined && Number.isFinite(rawDelivery)
      ? Math.min(365, Math.max(0, Math.round(rawDelivery)))
      : undefined;
  const invoiceId = clampString(input.invoiceId ?? "", SCHEMA_LIMITS.ownerIdMax);
  const customerName = clampString(input.customerName ?? "", SCHEMA_LIMITS.accountNameMax);
  const customerPhone = clampString(input.customerPhone ?? "", SCHEMA_LIMITS.phoneMax);
  const customerTaxNumber = clampString(input.customerTaxNumber ?? "", SCHEMA_LIMITS.taxNumberMax);
  const rawSubtotal =
    input.subtotal !== undefined && input.subtotal !== null ? Math.max(0, parseArabicNumber(input.subtotal)) : undefined;
  const rawTaxRate =
    input.taxRate !== undefined && input.taxRate !== null
      ? Math.min(100, Math.max(0, parseArabicNumber(input.taxRate)))
      : undefined;
  const rawTaxAmount =
    input.taxAmount !== undefined && input.taxAmount !== null
      ? Math.max(0, parseArabicNumber(input.taxAmount))
      : undefined;
  return {
    ownerId: clampString(input.ownerId, SCHEMA_LIMITS.ownerIdMax),
    accountId: clampString(input.accountId, SCHEMA_LIMITS.ownerIdMax),
    accountName: clampString(input.accountName, SCHEMA_LIMITS.accountNameMax) || "حساب",
    counterpartAccountId: clampString(input.counterpartAccountId ?? "", SCHEMA_LIMITS.ownerIdMax),
    counterpartAccountName: clampString(input.counterpartAccountName ?? "", SCHEMA_LIMITS.accountNameMax),
    kind: isValidLedgerKind(input.kind ?? "") ? input.kind! : "voucher",
    typeLabel: clampString(input.typeLabel || "سند", SCHEMA_LIMITS.typeLabelMax) || "سند",
    payment: input.payment === "cash" || input.payment === "credit" ? input.payment : "balance",
    direction: input.direction === "credit" ? "credit" : "debit",
    amount: safeAmount,
    currency: isValidCurrency(input.currency ?? "") ? input.currency! : "ريال",
    exchangeRate: safeRate,
    details: clampString(input.details ?? "", SCHEMA_LIMITS.ledgerDetailsMax),
    documentNumber: clampString(input.documentNumber ?? "", SCHEMA_LIMITS.documentNumberMax),
    warehouseId: clampString(input.warehouseId ?? "", SCHEMA_LIMITS.ownerIdMax),
    warehouseName: clampString(input.warehouseName ?? "", SCHEMA_LIMITS.warehouseNameMax),
    invoiceContent:
      input.invoiceContent === "items" || input.invoiceContent === "free" ? input.invoiceContent : "none",
    entryNumber: Number.isFinite(input.entryNumber) ? Number(input.entryNumber) : 1,
    deleted: Boolean(input.deleted),
    entryDate:
      clampString(input.entryDate || new Date().toISOString().slice(0, 10), SCHEMA_LIMITS.entryDateMax) ||
      new Date().toISOString().slice(0, 10),
    ...(dueDate ? { dueDate } : {}),
    ...(expenseCategory ? { expenseCategory } : {}),
    ...(deliveryDays !== undefined ? { deliveryDays } : {}),
    ...(invoiceId ? { invoiceId } : {}),
    ...(rawSubtotal !== undefined ? { subtotal: Math.round(rawSubtotal * 100) / 100 } : {}),
    ...(rawTaxRate !== undefined ? { taxRate: Math.round(rawTaxRate * 100) / 100 } : {}),
    ...(rawTaxAmount !== undefined ? { taxAmount: Math.round(rawTaxAmount * 100) / 100 } : {}),
    ...(customerName ? { customerName } : {}),
    ...(customerPhone ? { customerPhone } : {}),
    ...(customerTaxNumber ? { customerTaxNumber } : {}),
  };
}

export function roundCurrency(value: number): number {
  const safe = Number.isFinite(value) ? value : 0;
  return Math.round(safe * 100) / 100;
}

export function calculateInvoiceTotals(
  items: readonly { quantity: number | string; unitPrice: number | string }[],
  taxRate: number | string = 15,
  discount: number | string = 0,
): InvoiceTotals {
  let subtotal = 0;
  for (const row of items) {
    const qty = Math.max(0, parseArabicNumber(row.quantity));
    const unitPrice = Math.max(0, parseArabicNumber(row.unitPrice));
    subtotal += roundCurrency(qty * unitPrice);
  }
  subtotal = roundCurrency(subtotal);
  const discountAmount = roundCurrency(Math.min(subtotal, Math.max(0, parseArabicNumber(discount))));
  const taxableAmount = roundCurrency(Math.max(0, subtotal - discountAmount));
  const safeTaxRate = roundCurrency(Math.min(100, Math.max(0, parseArabicNumber(taxRate))));
  const taxAmount = roundCurrency((taxableAmount * safeTaxRate) / 100);
  const totalAmount = roundCurrency(taxableAmount + taxAmount);

  return {
    subtotal,
    discountAmount,
    taxableAmount,
    taxRate: safeTaxRate,
    taxAmount,
    totalAmount,
  };
}

export function buildInvoiceDetailsSummary(
  items: readonly { itemName: string; unit?: string; quantity: number; unitPrice: number; lineTotal: number }[],
  options: {
    customerName?: string;
    taxRate?: number;
    taxAmount?: number;
    discountAmount?: number;
    notes?: string;
    fallbackLabel?: string;
  } = {},
): string {
  const lines: string[] = [];
  if (options.customerName && options.customerName.trim()) {
    lines.push(`العميل: ${options.customerName.trim()}`);
  }
  for (const item of items) {
    const name = item.itemName.trim();
    if (!name || item.quantity <= 0) continue;
    const unitPart = item.unit?.trim() ? ` ${item.unit.trim()}` : "";
    lines.push(`${name} | ${formatAmount(item.quantity)}${unitPart} × ${formatAmount(item.unitPrice)} = ${formatAmount(item.lineTotal)}`);
  }
  if ((options.discountAmount ?? 0) > 0) {
    lines.push(`الخصم: ${formatAmount(options.discountAmount!)}`);
  }
  if ((options.taxAmount ?? 0) > 0) {
    lines.push(`الضريبة (${options.taxRate ?? 15}%): ${formatAmount(options.taxAmount!)}`);
  }
  if (options.notes && options.notes.trim()) {
    lines.push(options.notes.trim());
  }
  const joined = lines.join("\n").trim();
  return clampString(joined || options.fallbackLabel || "فاتورة", SCHEMA_LIMITS.ledgerDetailsMax);
}

export function sanitizeInvoicePayload(
  input: Partial<InvoiceRecord> & {
    ownerId: string;
    ledgerEntryId: string;
    customerId: string;
    customerName: string;
  },
) {
  const subtotal = roundCurrency(Math.max(0, parseArabicNumber(input.subtotal)));
  const discountAmount = roundCurrency(Math.min(subtotal, Math.max(0, parseArabicNumber(input.discountAmount))));
  const taxRate = roundCurrency(Math.min(100, Math.max(0, parseArabicNumber(input.taxRate))));
  const taxable = Math.max(0, subtotal - discountAmount);
  const taxAmount =
    input.taxAmount !== undefined
      ? roundCurrency(Math.max(0, parseArabicNumber(input.taxAmount)))
      : roundCurrency((taxable * taxRate) / 100);
  const totalAmount =
    input.totalAmount !== undefined
      ? roundCurrency(Math.max(0, parseArabicNumber(input.totalAmount)))
      : roundCurrency(taxable + taxAmount);
  const dueDate = clampString(input.dueDate ?? "", SCHEMA_LIMITS.entryDateMax);
  const expenseCategory = clampString(input.expenseCategory ?? "", SCHEMA_LIMITS.expenseCategoryMax);
  const intent =
    input.intent === "return" || input.intent === "quote" || input.intent === "order" ? input.intent : "invoice";

  return {
    ownerId: clampString(input.ownerId, SCHEMA_LIMITS.ownerIdMax),
    ledgerEntryId: clampString(input.ledgerEntryId, SCHEMA_LIMITS.ownerIdMax),
    entryNumber: Number.isFinite(input.entryNumber) ? Math.max(1, Math.round(Number(input.entryNumber))) : 1,
    invoiceNumber: clampString(input.invoiceNumber || String(input.entryNumber ?? 1), SCHEMA_LIMITS.documentNumberMax) || "1",
    intent,
    invoiceKind: input.invoiceKind === "purchase" ? "purchase" : "sale",
    payment: input.payment === "cash" ? "cash" : "credit",
    contentMode: input.contentMode === "free" ? "free" : "items",
    customerId: clampString(input.customerId, SCHEMA_LIMITS.ownerIdMax),
    customerName: clampString(input.customerName, SCHEMA_LIMITS.accountNameMax) || "عميل",
    customerPhone: clampString(input.customerPhone ?? "", SCHEMA_LIMITS.phoneMax),
    customerTaxNumber: clampString(input.customerTaxNumber ?? "", SCHEMA_LIMITS.taxNumberMax),
    customerAddress: clampString(input.customerAddress ?? "", SCHEMA_LIMITS.customerAddressMax),
    warehouseId: clampString(input.warehouseId ?? "", SCHEMA_LIMITS.ownerIdMax),
    warehouseName: clampString(input.warehouseName ?? "", SCHEMA_LIMITS.warehouseNameMax),
    currency: isValidCurrency(input.currency ?? "") ? input.currency! : "ريال",
    exchangeRate: Math.max(0.0001, parseArabicNumber(input.exchangeRate) || 1),
    invoiceDate:
      clampString(input.invoiceDate || new Date().toISOString().slice(0, 10), SCHEMA_LIMITS.entryDateMax) ||
      new Date().toISOString().slice(0, 10),
    ...(dueDate ? { dueDate } : {}),
    subtotal,
    discountAmount,
    taxRate,
    taxAmount,
    totalAmount,
    itemCount: Number.isFinite(input.itemCount) ? Math.min(200, Math.max(0, Math.round(Number(input.itemCount)))) : 0,
    notes: clampString(input.notes ?? "", SCHEMA_LIMITS.invoiceNotesMax),
    ...(expenseCategory ? { expenseCategory } : {}),
    deleted: Boolean(input.deleted),
  };
}

export function sanitizeInvoiceItemPayload(
  input: Partial<InvoiceLineItem> & {
    ownerId: string;
    invoiceId: string;
    itemName: string;
  },
) {
  const quantity = roundCurrency(Math.max(0, parseArabicNumber(input.quantity)));
  const unitPrice = roundCurrency(Math.max(0, parseArabicNumber(input.unitPrice)));
  const lineTotal = roundCurrency(quantity * unitPrice);
  const inventoryItemId = clampString(input.inventoryItemId ?? "", SCHEMA_LIMITS.ownerIdMax);
  return {
    ownerId: clampString(input.ownerId, SCHEMA_LIMITS.ownerIdMax),
    invoiceId: clampString(input.invoiceId, SCHEMA_LIMITS.ownerIdMax),
    ...(inventoryItemId ? { inventoryItemId } : {}),
    itemName: clampString(input.itemName, SCHEMA_LIMITS.inventoryNameMax) || "صنف",
    unit: clampString(input.unit || "حبة", SCHEMA_LIMITS.inventoryUnitMax) || "حبة",
    quantity,
    unitPrice,
    lineTotal,
    sortOrder: Number.isFinite(input.sortOrder) ? Math.max(0, Math.round(Number(input.sortOrder))) : 0,
  };
}

export function sanitizeWarehousePayload(input: Partial<WarehouseRecord> & { ownerId: string; name: string }) {
  return {
    ownerId: clampString(input.ownerId, SCHEMA_LIMITS.ownerIdMax),
    name: clampString(input.name, SCHEMA_LIMITS.warehouseNameMax),
    details: clampString(input.details ?? "", SCHEMA_LIMITS.warehouseDetailsMax),
    isDefault: Boolean(input.isDefault),
    codeNumber: Number.isFinite(input.codeNumber) ? Number(input.codeNumber) : 1,
  };
}

export function sanitizeInventoryPayload(
  input: Partial<InventoryItemRecord> & { ownerId: string; name: string; warehouseId: string },
) {
  const minThreshold =
    input.minThreshold !== undefined ? Math.max(0, parseArabicNumber(input.minThreshold)) : 25;
  const sku = clampString(input.sku ?? "", SCHEMA_LIMITS.skuMax);
  return {
    ownerId: clampString(input.ownerId, SCHEMA_LIMITS.ownerIdMax),
    name: clampString(input.name, SCHEMA_LIMITS.inventoryNameMax),
    unit: clampString(input.unit || "حبة", SCHEMA_LIMITS.inventoryUnitMax) || "حبة",
    quantity: Math.max(0, parseArabicNumber(input.quantity)),
    avgCost: Math.max(0, parseArabicNumber(input.avgCost)),
    minThreshold,
    ...(sku ? { sku } : {}),
    warehouseId: clampString(input.warehouseId, SCHEMA_LIMITS.ownerIdMax),
  };
}

export type AccountSummary = {
  debitTotal: number;
  creditTotal: number;
  netBalance: number;
  tone: "credit" | "debit" | "neutral";
  entryCount: number;
};

export function affectsAccountBalance(entry: Pick<LedgerEntryRecord, "deleted" | "kind">): boolean {
  if (entry.deleted) return false;
  return entry.kind !== "quote" && entry.kind !== "order";
}

export function computeAccountSummary(
  account: AccountRecord,
  entries: readonly LedgerEntryRecord[],
  currencyFilter?: string,
): AccountSummary {
  let debitTotal = 0;
  let creditTotal = 0;
  let entryCount = 0;

  if (account.openingBalance > 0 && (!currencyFilter || currencyFilter === "الكل" || currencyFilter === account.currency)) {
    if (account.openingDirection === "credit") {
      creditTotal += account.openingBalance;
    } else {
      debitTotal += account.openingBalance;
    }
  }

  for (const entry of entries) {
    if (entry.deleted) continue;
    const isPrimary = entry.accountId === account.id;
    const isCounterpart = entry.counterpartAccountId === account.id && entry.counterpartAccountId !== "";
    if (!isPrimary && !isCounterpart) continue;

    if (
      currencyFilter &&
      currencyFilter !== "الكل" &&
      currencyFilter !== "جميع العملات بدون مصارفة" &&
      currencyFilter !== "مصارفة الكل بعملة ريال" &&
      entry.currency !== currencyFilter
    ) {
      continue;
    }

    entryCount += 1;
    if (!affectsAccountBalance(entry)) continue;

    const effectiveAmount =
      currencyFilter === "مصارفة الكل بعملة ريال" ? entry.amount * (entry.exchangeRate || 1) : entry.amount;

    if (isPrimary) {
      if (account.isCashAccount && entry.payment === "cash") {
        // Cash settlement washes both sides while preserving turnover totals.
        creditTotal += effectiveAmount;
        debitTotal += effectiveAmount;
      } else if (entry.direction === "credit") {
        creditTotal += effectiveAmount;
      } else {
        debitTotal += effectiveAmount;
      }
    } else if (isCounterpart) {
      // Counterpart in simple entry receives the opposite side.
      if (entry.direction === "credit") {
        debitTotal += effectiveAmount;
      } else {
        creditTotal += effectiveAmount;
      }
    }
  }

  const netSigned = creditTotal - debitTotal;
  const tone: "credit" | "debit" | "neutral" =
    Math.abs(netSigned) < 0.005 ? "neutral" : netSigned > 0 ? "credit" : "debit";

  return {
    debitTotal,
    creditTotal,
    netBalance: Math.abs(netSigned),
    tone,
    entryCount,
  };
}

export function computeCategoryTotals(
  accounts: readonly AccountRecord[],
  entries: readonly LedgerEntryRecord[],
): Record<AccountCategory, { netSigned: number; debitTotal: number; creditTotal: number; count: number }> {
  const result: Record<AccountCategory, { netSigned: number; debitTotal: number; creditTotal: number; count: number }> =
    {
      purchases: { netSigned: 0, debitTotal: 0, creditTotal: 0, count: 0 },
      sales: { netSigned: 0, debitTotal: 0, creditTotal: 0, count: 0 },
      clients: { netSigned: 0, debitTotal: 0, creditTotal: 0, count: 0 },
      employees: { netSigned: 0, debitTotal: 0, creditTotal: 0, count: 0 },
      transfers: { netSigned: 0, debitTotal: 0, creditTotal: 0, count: 0 },
      shop: { netSigned: 0, debitTotal: 0, creditTotal: 0, count: 0 },
    };

  for (const account of accounts) {
    const summary = computeAccountSummary(account, entries);
    const bucket = result[account.category];
    bucket.count += 1;
    bucket.debitTotal += summary.debitTotal;
    bucket.creditTotal += summary.creditTotal;
    bucket.netSigned += summary.creditTotal - summary.debitTotal;
  }

  return result;
}

export function computeStatementRows(
  account: AccountRecord,
  entries: readonly LedgerEntryRecord[],
  options: {
    currency?: string;
    searchQuery?: string;
    searchMode?: string;
    showPreviousBalance?: boolean;
  } = {},
): {
  rows: StatementRowWithBalance[];
  debitTotal: number;
  creditTotal: number;
  netBalance: number;
  netDirection: "credit" | "debit" | "neutral";
} {
  const currency = options.currency ?? "الكل";
  const query = normalizeArabicSearch(options.searchQuery ?? "");
  const searchMode = options.searchMode ?? "الكل";

  const relevant = entries
    .filter((entry) => {
      if (entry.deleted) return false;
      const belongs = entry.accountId === account.id || entry.counterpartAccountId === account.id;
      if (!belongs) return false;
      if (
        currency !== "الكل" &&
        currency !== "جميع العملات بدون مصارفة" &&
        currency !== "مصارفة الكل بعملة ريال" &&
        entry.currency !== currency
      ) {
        return false;
      }
      if (!query) return true;
      return ledgerEntryMatchesQuery(entry, query, searchMode);
    })
    .sort((a, b) => a.createdAtMs - b.createdAtMs || a.entryNumber - b.entryNumber);

  let running = options.showPreviousBalance
    ? account.openingDirection === "credit"
      ? account.openingBalance
      : -account.openingBalance
    : 0;
  let debitTotal = 0;
  let creditTotal = 0;

  const chronological: StatementRowWithBalance[] = relevant.map((entry) => {
    const isPrimary = entry.accountId === account.id;
    const amount =
      currency === "مصارفة الكل بعملة ريال" ? entry.amount * (entry.exchangeRate || 1) : entry.amount;

    if (affectsAccountBalance(entry)) {
      if (account.isCashAccount && entry.payment === "cash") {
        creditTotal += amount;
        debitTotal += amount;
      } else if (isPrimary) {
        if (entry.direction === "credit") {
          creditTotal += amount;
          running += amount;
        } else {
          debitTotal += amount;
          running -= amount;
        }
      } else {
        if (entry.direction === "credit") {
          debitTotal += amount;
          running -= amount;
        } else {
          creditTotal += amount;
          running += amount;
        }
      }
    }

    return {
      ...entry,
      runningBalance: account.isCashAccount ? 0 : Math.abs(running),
    };
  });

  // Newest entries appear at the top of statements cleanly
  const rows = [...chronological].reverse();
  const netSigned = creditTotal - debitTotal + (options.showPreviousBalance ? (account.openingDirection === "credit" ? account.openingBalance : -account.openingBalance) : 0);

  return {
    rows,
    debitTotal,
    creditTotal,
    netBalance: Math.abs(netSigned),
    netDirection: Math.abs(netSigned) < 0.005 ? "neutral" : netSigned > 0 ? "credit" : "debit",
  };
}

export function ledgerEntryMatchesQuery(entry: LedgerEntryRecord, normalizedQuery: string, mode: string): boolean {
  if (!normalizedQuery) return true;
  const amountText = String(entry.amount);
  const fields: Record<string, string> = {
    "الرقم": String(entry.entryNumber),
    "البيان": entry.details,
    "رقم المستند": entry.documentNumber,
    "اسم المرسل": entry.counterpartAccountName,
    "اسم المستلم": entry.accountName,
    "اسم الشركة": entry.warehouseName,
    "المبلغ عليه": entry.direction === "debit" ? amountText : "",
    "المبلغ له": entry.direction === "credit" ? amountText : "",
  };
  if (mode === "الكل") {
    return normalizeArabicSearch([...Object.values(fields), entry.typeLabel, entry.entryDate].join(" ")).includes(
      normalizedQuery,
    );
  }
  return normalizeArabicSearch(fields[mode] ?? "").includes(normalizedQuery);
}

export function accountMatchesQuery(account: AccountRecord, query: string): boolean {
  const needle = normalizeArabicSearch(query);
  if (!needle) return true;
  return normalizeArabicSearch(`${account.name} ${account.phone} ${account.codeNumber}`).includes(needle);
}

function escapeCsvCell(cell: string | number | boolean): string {
  const str = String(cell ?? "");
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function buildCsvContent(headers: readonly string[], rows: readonly (readonly (string | number | boolean)[])[]): string {
  const headerLine = headers.map(escapeCsvCell).join(",");
  const dataLines = rows.map((row) => row.map(escapeCsvCell).join(","));
  return `\uFEFF${[headerLine, ...dataLines].join("\r\n")}`;
}

export function computeInventorySummary(items: readonly InventoryItemRecord[], warehouseId?: string) {
  const filtered = warehouseId ? items.filter((item) => item.warehouseId === warehouseId) : items;
  let totalQuantity = 0;
  let totalValue = 0;
  for (const item of filtered) {
    totalQuantity += item.quantity;
    totalValue += item.quantity * item.avgCost;
  }
  return {
    items: filtered,
    totalQuantity,
    totalValue,
  };
}

export type LowStockAlertItem = InventoryItemRecord & {
  warehouseName: string;
  effectiveThreshold: number;
  shortage: number;
  severity: "critical" | "warning";
  stockValue: number;
};

export type DashboardSummary = {
  totalSales: number;
  salesInvoiceCount: number;
  salesAccountCount: number;
  recentInvoices: LedgerEntryRecord[];
  totalInvoicesCount: number;
  totalInvoicesVolume: number;
  lowStockItems: LowStockAlertItem[];
  totalInventoryItems: number;
  lowStockThreshold: number;
};

export type SalesTrendPoint = {
  dateIso: string;
  shortLabel: string;
  weekdayLabel: string;
  salesTotal: number;
  invoiceCount: number;
};

export type NotificationCategory = "due-invoice" | "low-stock" | "system";

export type WorkspaceNotification = {
  id: string;
  category: NotificationCategory;
  severity: "critical" | "warning" | "info";
  title: string;
  message: string;
  dateLabel: string;
  targetType?: "invoice" | "inventory" | "account" | "settings";
  targetId?: string;
};

export type ParsedQrStockPayload = {
  raw: string;
  lookupKey: string;
  sku?: string;
  name?: string;
  quantity?: number;
  unit?: string;
  avgCost?: number;
  minThreshold?: number;
};

function isSaleLedgerEntry(entry: LedgerEntryRecord, salesAccountIds: ReadonlySet<string>): boolean {
  return (
    salesAccountIds.has(entry.accountId) ||
    (entry.kind === "invoice" && entry.direction === "debit") ||
    (entry.kind === "return" && entry.direction === "credit" && salesAccountIds.has(entry.accountId))
  );
}

export function computeDashboardSummary(
  accounts: readonly AccountRecord[],
  entries: readonly LedgerEntryRecord[],
  warehouses: readonly WarehouseRecord[],
  inventory: readonly InventoryItemRecord[],
  options: {
    lowStockThreshold?: number;
    useItemThresholds?: boolean;
    recentInvoicesLimit?: number;
    period?: "all" | "month" | "week";
    referenceDate?: Date;
  } = {},
): DashboardSummary {
  const defaultThreshold = options.lowStockThreshold ?? 25;
  const useItemThresholds = options.useItemThresholds ?? true;
  const recentInvoicesLimit = options.recentInvoicesLimit ?? 6;
  const period = options.period ?? "all";
  const refDate = options.referenceDate ?? new Date();

  const cutoffIso =
    period === "week"
      ? new Date(refDate.getTime() - 7 * 86_400_000).toISOString().slice(0, 10)
      : period === "month"
        ? new Date(refDate.getTime() - 30 * 86_400_000).toISOString().slice(0, 10)
        : "";

  const salesAccountIds = new Set(accounts.filter((a) => a.category === "sales").map((a) => a.id));
  const warehouseMap = new Map(warehouses.map((w) => [w.id, w.name]));

  let totalSales = 0;
  if (period === "all") {
    for (const acc of accounts) {
      if (acc.category === "sales" && acc.openingBalance > 0) {
        totalSales += acc.openingBalance;
      }
    }
  }

  let salesInvoiceCount = 0;
  let totalInvoicesVolume = 0;
  const activeInvoices: LedgerEntryRecord[] = [];

  for (const entry of entries) {
    if (entry.deleted) continue;
    if (cutoffIso && entry.entryDate < cutoffIso) continue;

    const isInvoiceDoc = entry.kind === "invoice" || entry.kind === "return";
    if (isInvoiceDoc) {
      activeInvoices.push(entry);
      if (entry.kind === "invoice") {
        totalInvoicesVolume += entry.amount;
      }
    }

    if (isSaleLedgerEntry(entry, salesAccountIds)) {
      if (entry.kind === "return") {
        totalSales = Math.max(0, totalSales - entry.amount);
      } else if (entry.kind === "invoice" || entry.kind === "voucher") {
        totalSales += entry.amount;
        if (entry.kind === "invoice") {
          salesInvoiceCount += 1;
        }
      }
    }
  }

  activeInvoices.sort(
    (a, b) =>
      b.entryDate.localeCompare(a.entryDate) ||
      b.createdAtMs - a.createdAtMs ||
      b.entryNumber - a.entryNumber,
  );

  const lowStockItems: LowStockAlertItem[] = inventory
    .map((item) => {
      const effectiveThreshold = useItemThresholds
        ? typeof item.minThreshold === "number"
          ? item.minThreshold
          : defaultThreshold
        : defaultThreshold;
      const shortage = Math.max(0, effectiveThreshold - item.quantity);
      const isBelow = effectiveThreshold > 0 && item.quantity < effectiveThreshold;
      return {
        ...item,
        warehouseName: warehouseMap.get(item.warehouseId) ?? "مخزن عام",
        effectiveThreshold,
        shortage,
        severity:
          item.quantity <= Math.max(5, Math.floor(effectiveThreshold * 0.5))
            ? ("critical" as const)
            : ("warning" as const),
        stockValue: item.quantity * item.avgCost,
        isBelow,
      };
    })
    .filter((item) => item.isBelow)
    .map(({ isBelow: _discard, ...rest }) => rest)
    .sort((a, b) => b.shortage - a.shortage || a.quantity - b.quantity || a.name.localeCompare(b.name, "ar"));

  return {
    totalSales,
    salesInvoiceCount,
    salesAccountCount: salesAccountIds.size,
    recentInvoices: activeInvoices.slice(0, recentInvoicesLimit),
    totalInvoicesCount: activeInvoices.length,
    totalInvoicesVolume,
    lowStockItems,
    totalInventoryItems: inventory.length,
    lowStockThreshold: defaultThreshold,
  };
}

export function computeSalesTrend7Days(
  accounts: readonly AccountRecord[],
  entries: readonly LedgerEntryRecord[],
  referenceDate: Date = new Date(),
): SalesTrendPoint[] {
  const salesAccountIds = new Set(accounts.filter((a) => a.category === "sales").map((a) => a.id));
  const endUtc = Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), referenceDate.getUTCDate());
  const dayBuckets = new Map<string, { salesTotal: number; invoiceCount: number }>();

  const orderedDates: string[] = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const dayDate = new Date(endUtc - offset * 86_400_000);
    const iso = dayDate.toISOString().slice(0, 10);
    orderedDates.push(iso);
    dayBuckets.set(iso, { salesTotal: 0, invoiceCount: 0 });
  }

  for (const entry of entries) {
    if (entry.deleted) continue;
    const bucket = dayBuckets.get(entry.entryDate);
    if (!bucket) continue;
    if (!isSaleLedgerEntry(entry, salesAccountIds)) continue;

    if (entry.kind === "return") {
      bucket.salesTotal = Math.max(0, bucket.salesTotal - entry.amount);
    } else if (entry.kind === "invoice" || entry.kind === "voucher") {
      bucket.salesTotal += entry.amount;
      if (entry.kind === "invoice") {
        bucket.invoiceCount += 1;
      }
    }
  }

  const weekdayFormatter = new Intl.DateTimeFormat("ar", { weekday: "short", timeZone: "UTC" });

  return orderedDates.map((iso) => {
    const dateObj = new Date(`${iso}T00:00:00Z`);
    const bucket = dayBuckets.get(iso)!;
    return {
      dateIso: iso,
      shortLabel: iso.slice(5).replace("-", "/"),
      weekdayLabel: weekdayFormatter.format(dateObj),
      salesTotal: bucket.salesTotal,
      invoiceCount: bucket.invoiceCount,
    };
  });
}

function addDaysIso(isoDate: string, days: number): string {
  const parsed = Date.parse(`${isoDate}T00:00:00Z`);
  if (!Number.isFinite(parsed)) return isoDate;
  return new Date(parsed + days * 86_400_000).toISOString().slice(0, 10);
}

export function isBackupOverdue(
  lastBackupIso: string | null | undefined,
  referenceDate: Date = new Date(),
  maxDays: number = 7,
): { lastBackupIso: string | null; daysSince: number | null; overdue: boolean } {
  if (!lastBackupIso) {
    return { lastBackupIso: null, daysSince: null, overdue: true };
  }
  const parsed = Date.parse(lastBackupIso);
  if (!Number.isFinite(parsed)) {
    return { lastBackupIso: null, daysSince: null, overdue: true };
  }
  const diffDays = Math.max(0, Math.floor((referenceDate.getTime() - parsed) / 86_400_000));
  return {
    lastBackupIso,
    daysSince: diffDays,
    overdue: diffDays > maxDays,
  };
}

export function computeWorkspaceNotifications(
  accounts: readonly AccountRecord[],
  entries: readonly LedgerEntryRecord[],
  warehouses: readonly WarehouseRecord[],
  inventory: readonly InventoryItemRecord[],
  workspace: WorkspaceSettings | null,
  referenceDate: Date = new Date(),
  options: { lastBackupIso?: string | null } = {},
): WorkspaceNotification[] {
  const notifications: WorkspaceNotification[] = [];
  const todayIso = referenceDate.toISOString().slice(0, 10);
  const todayMs = Date.parse(`${todayIso}T00:00:00Z`);
  const warehouseMap = new Map(warehouses.map((w) => [w.id, w.name]));

  // 1. Upcoming / overdue credit invoice due dates & over-credit-limit accounts
  for (const entry of entries) {
    if (entry.deleted) continue;
    if (entry.kind !== "invoice" || entry.payment !== "credit") continue;
    const dueIso = entry.dueDate?.trim() || addDaysIso(entry.entryDate, 30);
    const dueMs = Date.parse(`${dueIso}T00:00:00Z`);
    if (!Number.isFinite(dueMs)) continue;
    const daysLeft = Math.round((dueMs - todayMs) / 86_400_000);
    if (daysLeft <= 10) {
      const overdue = daysLeft < 0;
      notifications.push({
        id: `due_${entry.id}`,
        category: "due-invoice",
        severity: overdue || daysLeft <= 2 ? "critical" : "warning",
        title: overdue
          ? `فاتورة آجلة متأخرة السداد (#${entry.entryNumber})`
          : `موعد استحقاق فاتورة قريب (#${entry.entryNumber})`,
        message: `${entry.accountName} · ${formatAmount(entry.amount)} ${entry.currency} · ${
          overdue ? `متأخرة منذ ${Math.abs(daysLeft)} يوم` : daysLeft === 0 ? "تستحق اليوم" : `بعد ${daysLeft} يوم`
        }`,
        dateLabel: dueIso,
        targetType: "invoice",
        targetId: entry.id,
      });
    }
  }

  for (const acc of accounts) {
    if (acc.creditLimit <= 0) continue;
    const s = computeAccountSummary(acc, entries);
    if (s.netBalance > acc.creditLimit) {
      notifications.push({
        id: `limit_${acc.id}`,
        category: "due-invoice",
        severity: "critical",
        title: `تجاوز سقف المديونية: ${acc.name}`,
        message: `الرصيد الحالي ${formatAmount(s.netBalance)} يتجاوز السقف ${formatAmount(acc.creditLimit)} ${acc.currency}`,
        dateLabel: todayIso,
        targetType: "account",
        targetId: acc.id,
      });
    }
  }

  // 2. Low-stock updates for items below their defined minimum threshold
  for (const item of inventory) {
    const threshold = typeof item.minThreshold === "number" ? item.minThreshold : 25;
    if (threshold > 0 && item.quantity < threshold) {
      const whName = warehouseMap.get(item.warehouseId) ?? "مخزن عام";
      notifications.push({
        id: `stock_${item.id}`,
        category: "low-stock",
        severity: item.quantity <= Math.max(5, Math.floor(threshold * 0.5)) ? "critical" : "warning",
        title: `انخفاض مخزون: ${item.name}`,
        message: `المتوفر ${formatAmount(item.quantity)} من الحد الأدنى ${formatAmount(threshold)} ${item.unit} · ${whName}`,
        dateLabel: todayIso,
        targetType: "inventory",
        targetId: item.id,
      });
    }
  }

  // 3. Important system messages & backup freshness check
  const backupStatus = isBackupOverdue(options.lastBackupIso, referenceDate, 7);
  if (backupStatus.overdue) {
    notifications.push({
      id: "sys_backup_overdue",
      category: "system",
      severity: "warning",
      title: "النسخة الاحتياطية بحاجة للتحديث",
      message:
        backupStatus.daysSince === null
          ? "لم يتم إنشاء نسخة احتياطية JSON بعد. يُنصح بتنزيل نسخة احتياطية لحماية بياناتك."
          : `مضى ${backupStatus.daysSince} يومًا على آخر نسخة احتياطية (أكثر من 7 أيام).`,
      dateLabel: todayIso,
      targetType: "settings",
    });
  }

  if (workspace && !workspace.whatsappInstantEnabled) {
    notifications.push({
      id: "sys_whatsapp_disabled",
      category: "system",
      severity: "info",
      title: "تنبيهات واتساب التلقائية غير مفعلة",
      message: "فعّل إشعارات واتساب الفورية من الإعدادات لإرسال إشعارات الفواتير تلقائيًا.",
      dateLabel: todayIso,
      targetType: "settings",
    });
  }

  notifications.push({
    id: "sys_cloud_sync",
    category: "system",
    severity: "info",
    title: "المزامنة السحابية نشطة ومؤمنة",
    message: `يتم حفظ ${accounts.length} حساب و${entries.filter((e) => !e.deleted).length} قيد في Firestore تلقائيًا.`,
    dateLabel: todayIso,
    targetType: "settings",
  });

  const severityRank: Record<WorkspaceNotification["severity"], number> = {
    critical: 0,
    warning: 1,
    info: 2,
  };
  return notifications.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
}

export function parseQrStockPayload(rawInput: string): ParsedQrStockPayload {
  const raw = String(rawInput ?? "").trim();
  if (!raw) {
    return { raw: "", lookupKey: "" };
  }

  if (raw.startsWith("{") && raw.endsWith("}")) {
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const sku = typeof parsed.sku === "string" ? parsed.sku.trim() : typeof parsed.code === "string" ? parsed.code.trim() : undefined;
      const name = typeof parsed.name === "string" ? parsed.name.trim() : undefined;
      const unit = typeof parsed.unit === "string" ? parsed.unit.trim() : undefined;
      const qtyRaw = parsed.quantity ?? parsed.qty;
      const costRaw = parsed.avgCost ?? parsed.cost ?? parsed.price;
      const threshRaw = parsed.minThreshold ?? parsed.min;
      return {
        raw,
        lookupKey: sku || name || (typeof parsed.id === "string" ? parsed.id.trim() : "") || raw,
        ...(sku ? { sku } : {}),
        ...(name ? { name } : {}),
        ...(qtyRaw !== undefined ? { quantity: Math.max(0, parseArabicNumber(String(qtyRaw))) } : {}),
        ...(unit ? { unit } : {}),
        ...(costRaw !== undefined ? { avgCost: Math.max(0, parseArabicNumber(String(costRaw))) } : {}),
        ...(threshRaw !== undefined ? { minThreshold: Math.max(0, parseArabicNumber(String(threshRaw))) } : {}),
      };
    } catch {
      // Fall through to structured key=value or plain lookup parsing
    }
  }

  if (raw.includes("=") && (raw.includes(";") || raw.includes("\n"))) {
    const map = new Map<string, string>();
    for (const part of raw.split(/[;\n]+/)) {
      const idx = part.indexOf("=");
      if (idx > 0) {
        map.set(part.slice(0, idx).trim().toLowerCase(), part.slice(idx + 1).trim());
      }
    }
    const sku = map.get("sku") || map.get("code");
    const name = map.get("name");
    const unit = map.get("unit");
    const qty = map.get("qty") ?? map.get("quantity");
    const cost = map.get("cost") ?? map.get("avgcost");
    const min = map.get("min") ?? map.get("minthreshold");
    return {
      raw,
      lookupKey: sku || name || raw,
      ...(sku ? { sku } : {}),
      ...(name ? { name } : {}),
      ...(qty !== undefined ? { quantity: Math.max(0, parseArabicNumber(qty)) } : {}),
      ...(unit ? { unit } : {}),
      ...(cost !== undefined ? { avgCost: Math.max(0, parseArabicNumber(cost)) } : {}),
      ...(min !== undefined ? { minThreshold: Math.max(0, parseArabicNumber(min)) } : {}),
    };
  }

  const cleaned = raw.replace(/^(sku:|item:|product:)/i, "").trim();
  return {
    raw,
    lookupKey: cleaned,
    sku: /^[a-zA-Z0-9_-]{3,32}$/.test(cleaned) ? cleaned : undefined,
    name: /^[a-zA-Z0-9_-]{3,32}$/.test(cleaned) ? undefined : cleaned,
  };
}

export function inferExpenseCategory(
  description: string,
  accountName: string = "",
  accountCategory?: AccountCategory,
): ExpenseCategory {
  const haystack = normalizeArabicSearch(`${description} ${accountName}`);
  if (/راتب|رواتب|اجور|مكاف|حوافز|موظف/.test(haystack) || accountCategory === "employees") {
    return "رواتب وأجور";
  }
  if (/شحن|توصيل|نقل|بوليصة|جمرك|تخليص|لوجست|سيارة|سائق/.test(haystack)) {
    return "شحن ونقل";
  }
  if (/صيانة|كهرباء|ماء|مياه|انترنت|نت|اتصال|طاقة|وقود|ديزل|بنزين/.test(haystack)) {
    return "صيانة ومرافق";
  }
  if (/ايجار|إيجار|مستودع|مكتب|معرض|عقد/.test(haystack)) {
    return "إيجار ومقر";
  }
  if (/اعلان|تسويق|حملة|تصميم|مطبوع|دعاية|سوشيال/.test(haystack)) {
    return "تسويق ومبيعات";
  }
  if (/محل|تشغيل|قرطاسية|تغليف|اكواب|مستلزمات|ضيافة|نظافة/.test(haystack) || accountCategory === "shop") {
    return "مصروفات تشغيلية";
  }
  if (
    /فاتورة|توريد|بضاعة|صنف|حبة|كيلو|كرتون|ابجورة|توصيلة|بطارية|فواحة|مكينة|عازل|فرامة|شراء|مشتريات/.test(
      haystack,
    ) ||
    accountCategory === "purchases"
  ) {
    return "مشتريات بضائع";
  }
  return "أخرى";
}

export function normalizeExpenseCategory(raw?: string): ExpenseCategory | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if ((EXPENSE_CATEGORIES as readonly string[]).includes(trimmed)) {
    return trimmed as ExpenseCategory;
  }
  return null;
}

export type SupplierPerformanceMetric = {
  accountId: string;
  name: string;
  totalSpend: number;
  orderCount: number;
  avgOrderCost: number;
  avgDeliveryDays: number;
  onTimeScore: number;
};

export function computeSupplierPerformance(
  accounts: readonly AccountRecord[],
  entries: readonly LedgerEntryRecord[],
): SupplierPerformanceMetric[] {
  const supplierAccounts = accounts.filter((a) => a.category === "purchases");
  const results: SupplierPerformanceMetric[] = [];

  for (const supplier of supplierAccounts) {
    const supplierEntries = entries
      .filter((e) => !e.deleted && (e.accountId === supplier.id || e.counterpartAccountId === supplier.id))
      .sort((a, b) => a.entryDate.localeCompare(b.entryDate));

    const purchaseDocs = supplierEntries.filter(
      (e) => e.kind === "invoice" || e.kind === "order" || (e.kind === "voucher" && e.direction === "credit"),
    );

    const totalSpendFromDocs = purchaseDocs.reduce((sum, e) => sum + e.amount * (e.exchangeRate || 1), 0);
    const totalSpend =
      totalSpendFromDocs > 0 ? totalSpendFromDocs : supplier.openingDirection === "credit" ? supplier.openingBalance : 0;
    const orderCount = Math.max(purchaseDocs.length, totalSpend > 0 ? 1 : 0);
    if (totalSpend <= 0 && orderCount === 0) continue;

    const avgOrderCost = orderCount > 0 ? Math.round((totalSpend / orderCount) * 100) / 100 : 0;

    const explicitDelivery = purchaseDocs
      .map((e) => e.deliveryDays)
      .filter((d): d is number => typeof d === "number" && Number.isFinite(d) && d >= 0);

    let avgDeliveryDays = 3;
    if (explicitDelivery.length > 0) {
      avgDeliveryDays =
        Math.round((explicitDelivery.reduce((s, d) => s + d, 0) / explicitDelivery.length) * 10) / 10;
    } else if (purchaseDocs.length >= 2) {
      const gaps: number[] = [];
      for (let i = 1; i < purchaseDocs.length; i += 1) {
        const prev = Date.parse(`${purchaseDocs[i - 1].entryDate}T00:00:00Z`);
        const cur = Date.parse(`${purchaseDocs[i].entryDate}T00:00:00Z`);
        if (Number.isFinite(prev) && Number.isFinite(cur)) {
          gaps.push(Math.min(14, Math.max(1, Math.round(Math.abs(cur - prev) / 86_400_000))));
        }
      }
      if (gaps.length > 0) {
        avgDeliveryDays = Math.round((gaps.reduce((s, g) => s + g, 0) / gaps.length) * 10) / 10;
      }
    } else {
      // Deterministic baseline when only opening balance / single cash supplier record exists
      avgDeliveryDays = supplier.isCashAccount ? 1.5 : 3 + (supplier.codeNumber % 4);
    }

    const onTimeScore = Math.max(35, Math.min(99, Math.round(100 - avgDeliveryDays * 6)));

    results.push({
      accountId: supplier.id,
      name: supplier.name,
      totalSpend,
      orderCount,
      avgOrderCost,
      avgDeliveryDays,
      onTimeScore,
    });
  }

  return results.sort((a, b) => b.totalSpend - a.totalSpend).slice(0, 6);
}

export type ExpenseTrendRange = "month" | "quarter" | "all";

export type ExpenseCategorySlice = {
  category: ExpenseCategory;
  total: number;
  count: number;
  percentage: number;
  color: string;
};

const EXPENSE_PALETTE: Record<ExpenseCategory, string> = {
  "مشتريات بضائع": "#0b5ca8",
  "مصروفات تشغيلية": "#f39a16",
  "شحن ونقل": "#0d9488",
  "رواتب وأجور": "#6366f1",
  "صيانة ومرافق": "#e11d48",
  "تسويق ومبيعات": "#0284c7",
  "إيجار ومقر": "#7c3aed",
  "أخرى": "#64748b",
};

export function computeExpenseTrendsByCategory(
  accounts: readonly AccountRecord[],
  entries: readonly LedgerEntryRecord[],
  range: ExpenseTrendRange = "month",
  referenceDate: Date = new Date(),
): {
  totalSpend: number;
  entryCount: number;
  slices: ExpenseCategorySlice[];
} {
  const accountMap = new Map(accounts.map((a) => [a.id, a]));
  const cutoffMs =
    range === "month"
      ? referenceDate.getTime() - 30 * 86_400_000
      : range === "quarter"
        ? referenceDate.getTime() - 90 * 86_400_000
        : 0;
  const cutoffIso = cutoffMs > 0 ? new Date(cutoffMs).toISOString().slice(0, 10) : "";

  const bucketMap = new Map<ExpenseCategory, { total: number; count: number }>();
  let totalSpend = 0;
  let entryCount = 0;

  for (const entry of entries) {
    if (entry.deleted) continue;
    if (entry.kind === "quote" || entry.kind === "order" || entry.kind === "return") continue;
    if (cutoffIso && entry.entryDate < cutoffIso) continue;

    const account = accountMap.get(entry.accountId);
    const isExpenseOrPurchase =
      account?.category === "purchases" ||
      account?.category === "shop" ||
      account?.category === "employees" ||
      (entry.kind === "invoice" && entry.direction === "credit") ||
      Boolean(entry.expenseCategory);

    if (!isExpenseOrPurchase) continue;

    const category =
      normalizeExpenseCategory(entry.expenseCategory) ??
      inferExpenseCategory(entry.details, entry.accountName, account?.category);
    const amount = entry.amount * (entry.exchangeRate || 1);
    if (amount <= 0) continue;

    const current = bucketMap.get(category) ?? { total: 0, count: 0 };
    current.total += amount;
    current.count += 1;
    bucketMap.set(category, current);
    totalSpend += amount;
    entryCount += 1;
  }

  const slices: ExpenseCategorySlice[] = Array.from(bucketMap.entries())
    .map(([category, data]) => ({
      category,
      total: data.total,
      count: data.count,
      percentage: totalSpend > 0 ? Math.round((data.total / totalSpend) * 1000) / 10 : 0,
      color: EXPENSE_PALETTE[category] ?? "#0b5ca8",
    }))
    .sort((a, b) => b.total - a.total);

  return {
    totalSpend,
    entryCount,
    slices,
  };
}

export function normalizeWhatsAppPhone(raw: string | undefined | null): string {
  if (!raw) return "";
  const asciiDigits = String(raw)
    .replace(/[٠-٩]/g, (ch) => String(ch.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (ch) => String(ch.charCodeAt(0) - 0x06f0))
    .replace(/[^0-9]/g, "");
  if (asciiDigits.startsWith("00")) {
    return asciiDigits.slice(2);
  }
  return asciiDigits;
}

export function buildWhatsAppMessageUrl(
  phone: string | undefined | null,
  message: string,
): string {
  const digits = normalizeWhatsAppPhone(phone);
  const encodedText = encodeURIComponent(message);
  if (digits.length >= 7) {
    return `https://wa.me/${digits}?text=${encodedText}`;
  }
  return `https://wa.me/?text=${encodedText}`;
}

export type MonthlySalesPurchasesPoint = {
  monthKey: string;
  label: string;
  sales: number;
  purchases: number;
};

const ARABIC_MONTH_SHORT = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
] as const;

export function filterEntriesByFiscalYear(
  entries: readonly LedgerEntryRecord[],
  fiscalYear: number | "all",
): LedgerEntryRecord[] {
  if (fiscalYear === "all") {
    return [...entries];
  }
  const prefix = `${fiscalYear}-`;
  return entries.filter((entry) => entry.entryDate.startsWith(prefix));
}

function niceChartMax(rawMax: number): number {
  if (rawMax <= 0) return 400000;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawMax)));
  const normalized = rawMax / magnitude;
  let niceFactor = 10;
  if (normalized <= 1) niceFactor = 1;
  else if (normalized <= 2) niceFactor = 2;
  else if (normalized <= 4) niceFactor = 4;
  else if (normalized <= 5) niceFactor = 5;
  else if (normalized <= 8) niceFactor = 8;
  return niceFactor * magnitude;
}

export function computeMonthlySalesPurchases(
  accounts: readonly AccountRecord[],
  entries: readonly LedgerEntryRecord[],
  options: { fiscalYear?: number | "all"; referenceDate?: Date } = {},
): {
  points: MonthlySalesPurchasesPoint[];
  maxVal: number;
  ticks: number[];
} {
  const refDate = options.referenceDate ?? new Date();
  const targetYear =
    options.fiscalYear && options.fiscalYear !== "all"
      ? options.fiscalYear
      : refDate.getFullYear();

  const accountMap = new Map(accounts.map((a) => [a.id, a]));
  const monthTotals = new Map<string, { sales: number; purchases: number }>();

  for (const entry of entries) {
    if (entry.deleted) continue;
    if (entry.kind === "quote" || entry.kind === "order") continue;
    const monthKey = entry.entryDate.slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(monthKey)) continue;
    if (options.fiscalYear && options.fiscalYear !== "all" && !monthKey.startsWith(`${targetYear}-`)) {
      continue;
    }

    const account = accountMap.get(entry.accountId);
    const value = entry.amount * (entry.exchangeRate || 1);
    if (value <= 0) continue;

    const bucket = monthTotals.get(monthKey) ?? { sales: 0, purchases: 0 };
    if (account?.category === "sales") {
      bucket.sales += entry.kind === "return" ? -value : value;
    } else if (
      account?.category === "purchases" ||
      (entry.kind === "invoice" && entry.direction === "credit")
    ) {
      bucket.purchases += entry.kind === "return" ? -value : value;
    }
    monthTotals.set(monthKey, bucket);
  }

  // Pick H1 (Jan-Jun) if any H1 activity or no H2 activity, otherwise H2 (Jul-Dec)
  let hasH1 = false;
  let hasH2 = false;
  for (const [key, val] of monthTotals.entries()) {
    if (!key.startsWith(`${targetYear}-`)) continue;
    if (val.sales <= 0 && val.purchases <= 0) continue;
    const monthNum = Number(key.slice(5, 7));
    if (monthNum >= 1 && monthNum <= 6) hasH1 = true;
    else if (monthNum >= 7 && monthNum <= 12) hasH2 = true;
  }

  const startMonth = hasH2 && !hasH1 ? 7 : 1;
  const points: MonthlySalesPurchasesPoint[] = [];
  let maxVal = 0;

  for (let offset = 0; offset < 6; offset += 1) {
    const m = startMonth + offset;
    const monthKey = `${targetYear}-${String(m).padStart(2, "0")}`;
    const raw = monthTotals.get(monthKey) ?? { sales: 0, purchases: 0 };
    const sales = Math.max(0, Math.round(raw.sales));
    const purchases = Math.max(0, Math.round(raw.purchases));
    maxVal = Math.max(maxVal, sales, purchases);
    points.push({
      monthKey,
      label: ARABIC_MONTH_SHORT[m - 1] ?? monthKey,
      sales,
      purchases,
    });
  }

  const chartMax = niceChartMax(maxVal);
  const step = chartMax / 4;
  const ticks = [0, step, step * 2, step * 3, chartMax];

  return {
    points,
    maxVal: chartMax,
    ticks,
  };
}

