import { useEffect, useMemo, useState } from "react";
import {
  CameraIcon,
  ChevronDownIcon,
  PlusIcon,
  SpeakerLoudIcon,
  TableIcon,
} from "@radix-ui/react-icons";
import { KeyboardInput, useKeyboard } from "../mobile";
import {
  accountMatchesQuery,
  computeAccountSummary,
  formatAmount,
  parseArabicNumber,
} from "../accounting";
import { createLedgerEntry } from "../firebase";
import {
  CURRENCIES,
  type AccountRecord,
  type CurrencyCode,
  type LedgerEntryRecord,
} from "../types";
import { triggerHaptic } from "../utils/haptics";

interface TransferModalProps {
  open: boolean;
  uid: string;
  accounts: readonly AccountRecord[];
  ledger: readonly LedgerEntryRecord[];
  defaultAccountId?: string;
  onClose: () => void;
  onCreateAccount: () => void;
  onNotify: (msg: string) => void;
  onSendWhatsApp: (account: AccountRecord | undefined, message: string) => void;
  onGenerateImage: (data: {
    title: string;
    subtitle: string;
    rows: [string, string][];
  }) => void;
}

export function TransferModal({
  open,
  uid,
  accounts,
  ledger,
  defaultAccountId,
  onClose,
  onCreateAccount,
  onNotify,
  onSendWhatsApp,
  onGenerateImage,
}: TransferModalProps) {
  const keyboard = useKeyboard();
  const [closeAfterSave, setCloseAfterSave] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState(defaultAccountId ?? accounts[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<CurrencyCode>("ريال");
  const [commission, setCommission] = useState("");
  const [commissionCurrency, setCommissionCurrency] = useState<CurrencyCode>("ريال");
  const [senderName, setSenderName] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [transferCompany, setTransferCompany] = useState("");
  const [transferNumber, setTransferNumber] = useState("");
  const [details, setDetails] = useState("");
  const [cashboxId, setCashboxId] = useState("");
  const [direction, setDirection] = useState<"outgoing" | "incoming">("outgoing");
  const [saving, setSaving] = useState(false);

  const cashboxes = useMemo(
    () => accounts.filter((a) => a.isCashAccount || a.category === "shop"),
    [accounts],
  );

  useEffect(() => {
    if (!open) return;
    if (defaultAccountId) {
      setSelectedAccountId(defaultAccountId);
    } else if (!selectedAccountId && accounts[0]) {
      setSelectedAccountId(accounts[0].id);
    }
    if (!cashboxId && (cashboxes[0] || accounts[0])) {
      setCashboxId((cashboxes[0] ?? accounts[0])?.id ?? "");
    }
  }, [accounts, cashboxId, cashboxes, defaultAccountId, open, selectedAccountId]);

  const filteredAccounts = useMemo(
    () => (search.trim() ? accounts.filter((a) => accountMatchesQuery(a, search)) : accounts),
    [accounts, search],
  );

  const activeAccount =
    filteredAccounts.find((a) => a.id === selectedAccountId) ??
    filteredAccounts[0] ??
    accounts.find((a) => a.id === selectedAccountId) ??
    accounts[0];

  const activeSummary = useMemo(
    () => (activeAccount ? computeAccountSummary(activeAccount, ledger) : null),
    [activeAccount, ledger],
  );

  if (!open) return null;

  const now = new Date();
  const dayLabel = now.toLocaleDateString("ar-SA", { weekday: "long" });
  const stampLabel = `${now.toLocaleDateString("en-GB")} ${now.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })} ${dayLabel}`;

  const parsedAmount = parseArabicNumber(amount);
  const parsedCommission = parseArabicNumber(commission);

  const composeDetailsText = () => {
    const parts: string[] = [];
    parts.push(direction === "outgoing" ? "حوالة صادرة" : "حوالة واردة");
    if (senderName.trim()) parts.push(`المرسل: ${senderName.trim()}`);
    if (recipientName.trim()) parts.push(`المستلم: ${recipientName.trim()}`);
    if (transferCompany.trim()) parts.push(`الشركة: ${transferCompany.trim()}`);
    if (parsedCommission > 0) parts.push(`العمولة: ${formatAmount(parsedCommission)} ${commissionCurrency}`);
    if (details.trim()) parts.push(details.trim());
    return parts.join(" | ");
  };

  const resetFormFields = () => {
    setAmount("");
    setCommission("");
    setSenderName("");
    setRecipientName("");
    setTransferCompany("");
    setTransferNumber("");
    setDetails("");
  };

  const submitTransfer = async (andAction?: "whatsapp" | "image") => {
    keyboard.hide();
    if (!activeAccount || parsedAmount <= 0) {
      triggerHaptic("warning");
      onNotify("أدخل مبلغ الحوالة واختر الحساب أولًا");
      return;
    }
    setSaving(true);
    try {
      const nextNum = Math.max(1000, ...ledger.map((e) => e.entryNumber)) + 1;
      const cashboxAcc = accounts.find((a) => a.id === cashboxId);
      const composedDetails = composeDetailsText();
      await createLedgerEntry(uid, {
        accountId: activeAccount.id,
        accountName: activeAccount.name,
        counterpartAccountId: cashboxAcc?.id ?? "",
        counterpartAccountName: cashboxAcc?.name ?? "الصندوق",
        kind: "transfer",
        typeLabel: direction === "outgoing" ? "حوالة صادرة" : "حوالة واردة",
        payment: "cash",
        direction: direction === "outgoing" ? "debit" : "credit",
        amount: parsedAmount,
        currency,
        exchangeRate: 1,
        details: composedDetails,
        documentNumber: transferNumber.trim() || String(nextNum),
        entryNumber: nextNum,
        deleted: false,
        entryDate: now.toISOString().slice(0, 10),
      });
      triggerHaptic("success");
      onNotify(`تم حفظ الحوالة رقم #${nextNum} بنجاح`);

      if (andAction === "whatsapp") {
        const msg = `إشعار حوالة (${direction === "outgoing" ? "صادرة" : "واردة"}) #${nextNum}\nالحساب: ${activeAccount.name}\nالمبلغ: ${formatAmount(parsedAmount)} ${currency}${parsedCommission > 0 ? `\nالعمولة: ${formatAmount(parsedCommission)} ${commissionCurrency}` : ""}${senderName.trim() ? `\nالمرسل: ${senderName.trim()}` : ""}${recipientName.trim() ? `\nالمستلم: ${recipientName.trim()}` : ""}${transferCompany.trim() ? `\nالشركة: ${transferCompany.trim()}` : ""}${transferNumber.trim() ? `\nرقم الحوالة: ${transferNumber.trim()}` : ""}`;
        onSendWhatsApp(activeAccount, msg);
      } else if (andAction === "image") {
        onGenerateImage({
          title: `سند حوالة ${direction === "outgoing" ? "صادرة" : "واردة"} #${nextNum}`,
          subtitle: activeAccount.name,
          rows: [
            ["التاريخ", stampLabel],
            ["المبلغ", `${formatAmount(parsedAmount)} ${currency}`],
            ["العمولة", `${formatAmount(parsedCommission)} ${commissionCurrency}`],
            ["المرسل", senderName.trim() || "—"],
            ["المستلم", recipientName.trim() || "—"],
            ["شركة التحويل", transferCompany.trim() || "—"],
            ["رقم الحوالة", transferNumber.trim() || `#${nextNum}`],
            ["الصندوق", cashboxAcc?.name ?? "الصندوق"],
          ],
        });
      }

      if (closeAfterSave) {
        onClose();
      } else {
        resetFormFields();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="center-modal-layer" data-testid="transfer-modal">
      <button
        type="button"
        className="center-modal-backdrop"
        onClick={() => {
          keyboard.hide();
          onClose();
        }}
        aria-label="إغلاق الحوالة"
      />
      <section
        className="ref-dialog-card transfer-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="transfer-modal-title"
      >
        <div className="transfer-modal-head">
          <h2 id="transfer-modal-title">إضافة حوالة جديدة</h2>
          <label className="transfer-close-check">
            <span>الإغلاق بعد الحفظ</span>
            <input
              type="checkbox"
              checked={closeAfterSave}
              onChange={(e) => setCloseAfterSave(e.target.checked)}
            />
          </label>
        </div>

        <div className="transfer-stamp-row">
          <span className="transfer-stamp-badge">
            <bdi>{stampLabel}</bdi>
          </span>
          <button
            type="button"
            className="transfer-icon-btn"
            aria-label="إدخال صوتي"
            onClick={() => onNotify("استخدم لوحة المفاتيح الصوتية لإملاء بيانات الحوالة")}
          >
            <SpeakerLoudIcon />
          </button>
        </div>

        <div className="transfer-account-box">
          <button
            type="button"
            className="transfer-plus-btn"
            aria-label="إضافة حساب جديد"
            onClick={() => {
              keyboard.hide();
              onCreateAccount();
            }}
          >
            <PlusIcon />
          </button>
          <KeyboardInput
            aria-label="بحث عن حساب للحوالة"
            placeholder="ابحث عن حساب"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            aria-label="اختر حساب الحوالة"
            value={activeAccount?.id ?? ""}
            onChange={(e) => {
              setSelectedAccountId(e.target.value);
              setSearch("");
            }}
          >
            {filteredAccounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))}
          </select>
          <ChevronDownIcon className="transfer-select-chevron" />
        </div>

        <div className="transfer-balance-strip">
          <span>الرصيد</span>
          <strong dir="ltr">
            {activeSummary ? formatAmount(activeSummary.netBalance) : "0"}
          </strong>
        </div>

        <div className="transfer-amount-commission-row">
          <div className="transfer-money-cell">
            <KeyboardInput
              aria-label="مبلغ الحوالة"
              data-testid="transfer-amount-input"
              inputMode="decimal"
              placeholder="المبلغ"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <select
              aria-label="عملة الحوالة"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="transfer-money-cell">
            <KeyboardInput
              aria-label="عمولة الحوالة"
              inputMode="decimal"
              placeholder="العمولة"
              value={commission}
              onChange={(e) => setCommission(e.target.value)}
            />
            <select
              aria-label="عملة العمولة"
              value={commissionCurrency}
              onChange={(e) => setCommissionCurrency(e.target.value as CurrencyCode)}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="transfer-grid-2">
          <KeyboardInput
            aria-label="اسم المرسل"
            placeholder="اسم المرسل"
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
          />
          <KeyboardInput
            aria-label="اسم المستلم"
            placeholder="اسم المستلم"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
          />
          <KeyboardInput
            aria-label="شركة التحويل"
            placeholder="شركة التحويل"
            value={transferCompany}
            onChange={(e) => setTransferCompany(e.target.value)}
          />
          <KeyboardInput
            aria-label="رقم الحوالة"
            placeholder="رقم الحوالة"
            value={transferNumber}
            onChange={(e) => setTransferNumber(e.target.value)}
          />
        </div>

        <div className="transfer-details-row">
          <button
            type="button"
            className="transfer-square-icon"
            aria-label="حاسبة"
            onClick={() => onNotify("أدخل صافي مبلغ الحوالة والعمولة بالأرقام")}
          >
            <TableIcon />
          </button>
          <KeyboardInput
            aria-label="تفاصيل الحوالة"
            placeholder="التفاصيل"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
          />
          <button
            type="button"
            className="transfer-square-icon"
            aria-label="صورة الإيصال"
            onClick={() => void submitTransfer("image")}
          >
            <CameraIcon />
          </button>
        </div>

        <label className="transfer-cashbox-row">
          <span>حساب الصندوق</span>
          <select
            aria-label="حساب الصندوق للحوالة"
            value={cashboxId}
            onChange={(e) => setCashboxId(e.target.value)}
          >
            {(cashboxes.length ? cashboxes : accounts).map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))}
          </select>
        </label>

        <div className="transfer-direction-row" role="radiogroup" aria-label="اتجاه الحوالة">
          <label>
            <input
              type="radio"
              name="transfer-dir"
              checked={direction === "outgoing"}
              onChange={() => setDirection("outgoing")}
            />
            <span>صادرة</span>
          </label>
          <label>
            <input
              type="radio"
              name="transfer-dir"
              checked={direction === "incoming"}
              onChange={() => setDirection("incoming")}
            />
            <span>واردة</span>
          </label>
        </div>

        <div className="ref-action-bar cols-4">
          <button
            type="button"
            className="ref-btn blue"
            disabled={saving}
            onClick={() => void submitTransfer()}
            data-testid="transfer-save-btn"
          >
            {saving ? "..." : "حفظ"}
          </button>
          <button
            type="button"
            className="ref-btn green"
            disabled={saving}
            onClick={() => void submitTransfer("whatsapp")}
          >
            إرسال
          </button>
          <button
            type="button"
            className="ref-btn blue"
            disabled={saving}
            onClick={() => void submitTransfer("image")}
          >
            صورة
          </button>
          <button
            type="button"
            className="ref-btn purple"
            onClick={() => {
              keyboard.hide();
              onClose();
            }}
          >
            إغلاق
          </button>
        </div>
      </section>
    </div>
  );
}
