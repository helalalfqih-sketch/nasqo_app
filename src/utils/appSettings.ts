export type WhatsAppClientVariant = "green" | "business" | "omar";

export interface ExtendedAppSettings {
  usageMode: "sync" | "local";
  syncMode: "auto" | "manual";
  hideAds: boolean;
  logoDataUrl: string;
  companyNameEn: string;
  addressAr: string;
  addressEn: string;
  mobileEn: string;
  taxNumber: string;
  drawSignature: boolean;
  autoWhatsapp: boolean;
  reportColor: string;
  fontSize: number;
  yellowPaper: boolean;
  printTarget: "pdf" | "printer";
  backupReminderOnExit: boolean;
  whatsappVariant: WhatsAppClientVariant;
  passwordLock: boolean;
  showBalanceInVoucher: boolean;
  showTimeInVoucher: boolean;
  hideCashboxesOnHome: boolean;
  hideVoucherSuggestions: boolean;
  useReceiptPaymentVoucher: boolean;
  useTwoDecimals: boolean;
  showAllCurrenciesToLocal: boolean;
  hideAllUsersOption: boolean;
  thermalPrintPdf: boolean;
  showGeneralEntryOnHome: boolean;
  useNotifMsgInPaymentReq: boolean;
  showDateInSms: boolean;
  showVoucherNoInSms: boolean;
  statementFooterNote: string;
  messageIntro: string;
  messageOutro: string;
  creditBalanceLabel: string;
  debitBalanceLabel: string;
  salesInvoiceFooterNote: string;
  sellBelowCost: boolean;
  sellWithoutBalance: boolean;
  invoicePrintTemplate: "1" | "2";
  hidePriceIn80mm: boolean;
  useWeightedAverage: boolean;
  hideItemCost: boolean;
  showItemsInInvoiceDetails: boolean;
  hideExpiryInInvoice: boolean;
  useFreeBonusQty: boolean;
  hidePrintDateInInvoice: boolean;
  useLargestUnitAsMain: boolean;
}

export const DEFAULT_EXTENDED_SETTINGS: ExtendedAppSettings = {
  usageMode: "sync",
  syncMode: "auto",
  hideAds: true,
  logoDataUrl: "",
  companyNameEn: "Nasqo Pro Business",
  addressAr: "شارع بينون، صنعاء، اليمن",
  addressEn: "YEMEN SANAA",
  mobileEn: "771370740",
  taxNumber: "",
  drawSignature: true,
  autoWhatsapp: false,
  reportColor: "#2563eb",
  fontSize: 4,
  yellowPaper: false,
  printTarget: "pdf",
  backupReminderOnExit: true,
  whatsappVariant: "business",
  passwordLock: false,
  showBalanceInVoucher: true,
  showTimeInVoucher: true,
  hideCashboxesOnHome: false,
  hideVoucherSuggestions: false,
  useReceiptPaymentVoucher: true,
  useTwoDecimals: false,
  showAllCurrenciesToLocal: false,
  hideAllUsersOption: false,
  thermalPrintPdf: true,
  showGeneralEntryOnHome: true,
  useNotifMsgInPaymentReq: true,
  showDateInSms: true,
  showVoucherNoInSms: false,
  statementFooterNote: "الرصيد صحيح إذا لم تتم المراجعة خلال سبعة أيام من تاريخ صدور الكشف",
  messageIntro: "",
  messageOutro: "",
  creditBalanceLabel: "الرصيد لكم",
  debitBalanceLabel: "الرصيد عليكم",
  salesInvoiceFooterNote: "البضاعة لا ترد إلا في حالة أي خلل مصنعي فقط",
  sellBelowCost: true,
  sellWithoutBalance: true,
  invoicePrintTemplate: "1",
  hidePriceIn80mm: false,
  useWeightedAverage: false,
  hideItemCost: false,
  showItemsInInvoiceDetails: true,
  hideExpiryInInvoice: false,
  useFreeBonusQty: false,
  hidePrintDateInInvoice: false,
  useLargestUnitAsMain: false,
};

const EXTENDED_SETTINGS_KEY = "nasqo-extended-settings-v1";

export function readExtendedSettings(): ExtendedAppSettings {
  if (typeof window === "undefined") return { ...DEFAULT_EXTENDED_SETTINGS };
  try {
    const raw = window.localStorage.getItem(EXTENDED_SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_EXTENDED_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<ExtendedAppSettings>;
    return {
      ...DEFAULT_EXTENDED_SETTINGS,
      ...(parsed && typeof parsed === "object" ? parsed : {}),
      fontSize:
        typeof parsed?.fontSize === "number"
          ? Math.min(12, Math.max(1, Math.round(parsed.fontSize)))
          : DEFAULT_EXTENDED_SETTINGS.fontSize,
    };
  } catch {
    return { ...DEFAULT_EXTENDED_SETTINGS };
  }
}

export function writeExtendedSettings(settings: ExtendedAppSettings): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(EXTENDED_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Ignore quota or storage restrictions
  }
}
