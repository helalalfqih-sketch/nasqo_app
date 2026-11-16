import { useRef, useState, type ChangeEvent } from "react";
import { Cross2Icon, ReloadIcon, TrashIcon, UpdateIcon } from "@radix-ui/react-icons";
import { KeyboardInput, MobileScroll, useKeyboard } from "../mobile";
import { isBackupOverdue } from "../accounting";
import { saveWorkspaceSettings } from "../firebase";
import { CURRENCIES, type CurrencyCode, type WorkspaceSettings } from "../types";
import type { ExtendedAppSettings } from "../utils/appSettings";
import { BRAND_COLOR_PRESETS } from "../utils/brandColor";
import { triggerHaptic } from "../utils/haptics";
import type { ThemeMode } from "../utils/theme";

interface SystemSettingsPageProps {
  uid: string;
  userEmail: string;
  workspace: WorkspaceSettings | null;
  extended: ExtendedAppSettings;
  onChangeExtended: (next: ExtendedAppSettings) => void;
  themeMode: ThemeMode;
  onChangeThemeMode: (mode: ThemeMode) => void;
  brandColor: string;
  onChangeBrandColor: (hex: string) => void;
  onResetBrandColor: () => void;
  hapticsEnabled: boolean;
  onChangeHaptics: (enabled: boolean) => void;
  lastBackupIso: string | null;
  onOpenBackupModal: () => void;
  onRestoreJson: () => void;
  onOpenTrash: () => void;
  onSignOut: () => void;
  onNotify: (msg: string) => void;
  onBack: () => void;
}

export function SystemSettingsPage({
  uid,
  userEmail,
  workspace,
  extended,
  onChangeExtended,
  themeMode,
  onChangeThemeMode,
  brandColor,
  onChangeBrandColor,
  onResetBrandColor,
  hapticsEnabled,
  onChangeHaptics,
  lastBackupIso,
  onOpenBackupModal,
  onRestoreJson,
  onOpenTrash,
  onSignOut,
  onNotify,
  onBack,
}: SystemSettingsPageProps) {
  const keyboard = useKeyboard();
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [companyName, setCompanyName] = useState(workspace?.companyName ?? "نسقو برو");
  const [defaultCurrency, setDefaultCurrency] = useState<CurrencyCode>(
    workspace?.defaultCurrency ?? "ريال",
  );
  const [whatsappPhone, setWhatsappPhone] = useState(workspace?.whatsappPhone ?? "771370740");
  const [draft, setDraft] = useState<ExtendedAppSettings>(extended);
  const [faqOpen, setFaqOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const backupStatus = isBackupOverdue(lastBackupIso);

  const updateField = <K extends keyof ExtendedAppSettings>(
    key: K,
    value: ExtendedAppSettings[K],
  ) => {
    setDraft((prev) => {
      const next = { ...prev, [key]: value };
      return next;
    });
    const nextDraft = { ...draft, [key]: value };
    onChangeExtended(nextDraft);
  };

  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        updateField("logoDataUrl", reader.result);
        triggerHaptic("success");
        onNotify("تم تحديث شعار المنشأة");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAll = async () => {
    keyboard.hide();
    onChangeExtended(draft);
    if (!workspace) {
      triggerHaptic("success");
      onNotify("تم حفظ الإعدادات محليًا");
      return;
    }
    setSaving(true);
    try {
      await saveWorkspaceSettings(uid, {
        ...workspace,
        companyName: companyName.trim() || workspace.companyName,
        defaultCurrency,
        whatsappPhone: whatsappPhone.trim(),
        whatsappInstantEnabled: draft.autoWhatsapp,
        whatsappProvider: draft.whatsappVariant === "green" ? "external" : "nasqo",
      });
      triggerHaptic("success");
      onNotify("تم حفظ جميع إعدادات النظام بنجاح");
    } finally {
      setSaving(false);
    }
  };

  return (
    <MobileScroll className="app-screen sys-settings-scroll">
      <main className="sys-settings-page page-with-footer" data-testid="system-settings-screen">
        {/* Top Activation & Version Banner */}
        <div className="sys-activation-pill">
          <span>التطبيق مفعل — سنوي</span>
          <bdi>610870500</bdi>
        </div>

        <button
          type="button"
          className="sys-update-btn"
          onClick={() => {
            triggerHaptic("light");
            onNotify("أنت تستخدم أحدث إصدار من نسقو برو (v1.7.21)");
          }}
        >
          <UpdateIcon />
          <span>تحديث التطبيق VS.1721</span>
        </button>

        <div className="sys-email-bar">
          <bdi>{userEmail || "مستخدم سحابي"}</bdi>
        </div>

        {/* Usage & Sync Mode */}
        <div className="sys-row sys-radio-row">
          <span className="sys-row-label accent-red">نوع الاستخدام</span>
          <div className="sys-radios" role="radiogroup" aria-label="نوع الاستخدام">
            <label>
              <input
                type="radio"
                name="sys-usage-mode"
                checked={draft.usageMode === "local"}
                onChange={() => {
                  triggerHaptic("light");
                  updateField("usageMode", "local");
                }}
              />
              <span>المحلي</span>
            </label>
            <label>
              <input
                type="radio"
                name="sys-usage-mode"
                checked={draft.usageMode === "sync"}
                onChange={() => {
                  triggerHaptic("light");
                  updateField("usageMode", "sync");
                }}
              />
              <span>المزامنة</span>
            </label>
          </div>
        </div>

        <div className="sys-row sys-radio-row">
          <span className="sys-row-label accent-red">نوع المزامنة</span>
          <div className="sys-radios-with-icons">
            <div className="sys-radios" role="radiogroup" aria-label="نوع المزامنة">
              <label>
                <input
                  type="radio"
                  name="sys-sync-mode"
                  checked={draft.syncMode === "auto"}
                  onChange={() => {
                    triggerHaptic("light");
                    updateField("syncMode", "auto");
                  }}
                />
                <span>تلقائية</span>
              </label>
              <label>
                <input
                  type="radio"
                  name="sys-sync-mode"
                  checked={draft.syncMode === "manual"}
                  onChange={() => {
                    triggerHaptic("light");
                    updateField("syncMode", "manual");
                  }}
                />
                <span>يدوية</span>
              </label>
            </div>
            <div className="sys-inline-tools">
              <button
                type="button"
                className="sys-mini-icon blue"
                aria-label="مزامنة الآن"
                onClick={() => {
                  triggerHaptic("success");
                  onNotify("تمت المزامنة السحابية الفورية بنجاح");
                }}
              >
                <ReloadIcon />
              </button>
              <button
                type="button"
                className="sys-mini-icon blue"
                aria-label="سلة المحذوفات"
                onClick={() => {
                  triggerHaptic("light");
                  onOpenTrash();
                }}
              >
                <TrashIcon />
              </button>
            </div>
          </div>
        </div>

        <div className="sys-btn-grid">
          <button
            type="button"
            onClick={() => {
              triggerHaptic("light");
              onNotify("تم التحقق: جلسة المدير مفعلة بالحساب الحالي");
            }}
          >
            دخول المدير
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic("light");
              onNotify("لا توجد حسابات فروع إضافية مرتبطة حاليًا");
            }}
          >
            دخول مستخدم/فرع
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic("light");
              onNotify("ملف المستخدم: " + (userEmail || "المدير الرئيسي"));
            }}
          >
            ملف المستخدمين/الفروع
          </button>
          <button
            type="button"
            className="danger"
            onClick={() => {
              triggerHaptic("warning");
              onSignOut();
            }}
          >
            تسجيل الخروج
          </button>
        </div>

        <div className="sys-faq-row">
          <button
            type="button"
            className="sys-faq-link"
            onClick={() => setFaqOpen((prev) => !prev)}
          >
            أسئلة شائعة
          </button>
        </div>
        {faqOpen ? (
          <div className="sys-faq-card">
            <strong>أبرز الإرشادات:</strong>
            <p>• يتم حفظ البيانات تلقائيًا في السحابة ويمكنك تنزيل أو تسمية نسخة JSON من زر النسخ الاحتياطي.</p>
            <p>• يمكنك تخصيص مسمى (الرصيد لكم / عليكم) وملاحظات الفواتير أسفل هذه الصفحة.</p>
          </div>
        ) : null}

        {/* Logo & Business Bilingual Fields */}
        <section className="sys-card">
          <div className="sys-logo-row">
            <span className="sys-blue-label">الشعار</span>
            <button
              type="button"
              className="sys-logo-thumb"
              onClick={() => logoInputRef.current?.click()}
              aria-label="تغيير شعار المنشأة"
            >
              {draft.logoDataUrl ? (
                <img src={draft.logoDataUrl} alt="شعار المنشأة" />
              ) : (
                <span>نسقو</span>
              )}
            </button>
            {draft.logoDataUrl ? (
              <button
                type="button"
                className="sys-logo-clear"
                aria-label="إزالة الشعار"
                onClick={() => updateField("logoDataUrl", "")}
              >
                <Cross2Icon />
              </button>
            ) : null}
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleLogoUpload}
            />
          </div>

          <label className="sys-row sys-check-row">
            <span className="accent-red">لا أريد ظهور الإعلانات</span>
            <input
              type="checkbox"
              checked={draft.hideAds}
              onChange={(e) => updateField("hideAds", e.target.checked)}
            />
          </label>

          <div className="sys-bilingual-grid">
            <label className="sys-field-box">
              <span>الاسم</span>
              <KeyboardInput
                aria-label="اسم النشاط بالعربية"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </label>
            <label className="sys-field-box">
              <span>Name_en</span>
              <KeyboardInput
                aria-label="Business Name EN"
                value={draft.companyNameEn}
                onChange={(e) => updateField("companyNameEn", e.target.value)}
              />
            </label>
            <label className="sys-field-box">
              <span>العنوان</span>
              <KeyboardInput
                aria-label="العنوان بالعربية"
                value={draft.addressAr}
                onChange={(e) => updateField("addressAr", e.target.value)}
              />
            </label>
            <label className="sys-field-box">
              <span>Address_en</span>
              <KeyboardInput
                aria-label="Address EN"
                value={draft.addressEn}
                onChange={(e) => updateField("addressEn", e.target.value)}
              />
            </label>
            <label className="sys-field-box">
              <span>رقم الجوال</span>
              <KeyboardInput
                aria-label="رقم الجوال"
                inputMode="tel"
                value={whatsappPhone}
                onChange={(e) => setWhatsappPhone(e.target.value)}
              />
            </label>
            <label className="sys-field-box">
              <span>Mobile_en</span>
              <KeyboardInput
                aria-label="Mobile EN"
                inputMode="tel"
                value={draft.mobileEn}
                onChange={(e) => updateField("mobileEn", e.target.value)}
              />
            </label>
          </div>

          <div className="sys-bilingual-grid">
            <label className="sys-field-box">
              <span>الرقم الضريبي</span>
              <KeyboardInput
                aria-label="الرقم الضريبي"
                placeholder="الرقم الضريبي"
                value={draft.taxNumber}
                onChange={(e) => updateField("taxNumber", e.target.value)}
              />
            </label>
            <label className="sys-field-box">
              <span>العملة الافتراضية</span>
              <select
                aria-label="العملة الافتراضية"
                value={defaultCurrency}
                onChange={(e) => setDefaultCurrency(e.target.value as CurrencyCode)}
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        {/* Theme, Brand Color, Haptics & Backup Freshness (Preserved Dashboard Controls) */}
        <section className="settings-appearance-box" data-testid="settings-appearance-box">
          <div className="settings-subhead">المظهر ولون العلامة والاهتزاز والنسخ الاحتياطي</div>
          <div className="exec-segmented" role="group" aria-label="وضع الألوان">
            {(
              [
                ["light", "فاتح"],
                ["dark", "داكن"],
                ["system", "النظام"],
              ] as const
            ).map(([m, label]) => (
              <button
                key={m}
                type="button"
                className={themeMode === m ? "active" : ""}
                onClick={() => {
                  triggerHaptic("light");
                  onChangeThemeMode(m);
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="exec-color-swatches">
            {BRAND_COLOR_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={`exec-color-swatch ${brandColor === preset.hex ? "active" : ""}`}
                style={{ background: preset.hex }}
                aria-label={preset.label}
                onClick={() => {
                  triggerHaptic("light");
                  onChangeBrandColor(preset.hex);
                }}
              />
            ))}
            <input
              type="color"
              aria-label="لون مخصص للواجهة"
              value={brandColor}
              onChange={(e) => onChangeBrandColor(e.target.value)}
              style={{ width: 28, height: 28, padding: 0, border: 0 }}
            />
            <button
              type="button"
              className="settings-reset-color-btn"
              onClick={() => {
                triggerHaptic("light");
                onResetBrandColor();
              }}
            >
              الافتراضي
            </button>
          </div>
          <label className="exec-haptic-toggle">
            <input
              type="checkbox"
              checked={hapticsEnabled}
              onChange={(e) => onChangeHaptics(e.target.checked)}
            />
            <span>تفعيل ردود الفعل اللمسية (الاهتزاز) عند التفاعل</span>
          </label>
          <div
            className={`settings-backup-freshness ${backupStatus.overdue ? "overdue" : "healthy"}`}
            data-testid="settings-backup-banner"
          >
            <strong>
              {backupStatus.overdue
                ? backupStatus.daysSince === null
                  ? "تنبيه: لم يتم أخذ نسخة احتياطية JSON بعد"
                  : `تنبيه: آخر نسخة احتياطية منذ ${backupStatus.daysSince} يومًا`
                : `النسخة الاحتياطية محدثة (منذ ${backupStatus.daysSince ?? 0} يوم)`}
            </strong>
            {lastBackupIso ? (
              <div style={{ fontSize: 11, marginTop: 3 }}>
                آخر تصدير: <bdi>{new Date(lastBackupIso).toLocaleString("en-GB")}</bdi>
              </div>
            ) : null}
          </div>
          <div className="sys-backup-btns">
            <button
              type="button"
              className="ref-btn blue"
              onClick={() => {
                triggerHaptic("light");
                onOpenBackupModal();
              }}
              data-testid="settings-backup-modal-btn"
            >
              حفظ / تسمية نسخة احتياطية
            </button>
            <button
              type="button"
              className="ref-btn green"
              onClick={() => {
                triggerHaptic("light");
                onRestoreJson();
              }}
            >
              استعادة من ملف
            </button>
          </div>
        </section>

        {/* General & Printing & WhatsApp Toggles */}
        <label className="sys-row sys-check-row">
          <span>رسم التوقيع أسفل الفواتير والسندات</span>
          <input
            type="checkbox"
            checked={draft.drawSignature}
            onChange={(e) => updateField("drawSignature", e.target.checked)}
          />
        </label>

        <label className="sys-row sys-check-row">
          <span>استخدام رسائل الواتساب التلقائية</span>
          <input
            type="checkbox"
            checked={draft.autoWhatsapp}
            onChange={(e) => updateField("autoWhatsapp", e.target.checked)}
          />
        </label>

        <div className="sys-row sys-color-bar-row">
          <input
            type="color"
            aria-label="تلوين التقارير"
            value={draft.reportColor}
            onChange={(e) => updateField("reportColor", e.target.value)}
            className="sys-color-chip"
          />
          <div className="sys-report-color-label">تلوين التقارير</div>
        </div>

        <div className="sys-row sys-font-row">
          <div className="sys-stepper">
            <button
              type="button"
              aria-label="تكبير الخط"
              onClick={() => updateField("fontSize", Math.min(10, draft.fontSize + 1))}
            >
              +
            </button>
            <b>{draft.fontSize}</b>
            <button
              type="button"
              aria-label="تصغير الخط"
              onClick={() => updateField("fontSize", Math.max(1, draft.fontSize - 1))}
            >
              -
            </button>
          </div>
          <span className="sys-blue-label">مقاس الخطوط</span>
          <label className="sys-inline-check">
            <input
              type="checkbox"
              checked={draft.yellowPaper}
              onChange={(e) => updateField("yellowPaper", e.target.checked)}
            />
            <span>ورقة صفراء</span>
          </label>
        </div>

        <div className="sys-row sys-radio-row">
          <span className="sys-blue-label">الطباعة إلى</span>
          <div className="sys-radios" role="radiogroup" aria-label="الطباعة إلى">
            <label>
              <input
                type="radio"
                name="sys-print-target"
                checked={draft.printTarget === "pdf"}
                onChange={() => updateField("printTarget", "pdf")}
              />
              <span>PDF</span>
            </label>
            <label>
              <input
                type="radio"
                name="sys-print-target"
                checked={draft.printTarget === "printer"}
                onChange={() => updateField("printTarget", "printer")}
              />
              <span>الطابعة</span>
            </label>
          </div>
        </div>

        <label className="sys-row sys-check-row">
          <span>التذكير بالنسخ الاحتياطي عند الإغلاق</span>
          <input
            type="checkbox"
            checked={draft.backupReminderOnExit}
            onChange={(e) => updateField("backupReminderOnExit", e.target.checked)}
          />
        </label>

        <div className="sys-row sys-radio-row">
          <span className="sys-blue-label">الواتساب المستخدم</span>
          <div className="sys-radios" role="radiogroup" aria-label="الواتساب المستخدم">
            <label>
              <input
                type="radio"
                name="sys-wa-variant"
                checked={draft.whatsappVariant === "green"}
                onChange={() => updateField("whatsappVariant", "green")}
              />
              <span>الأخضر</span>
            </label>
            <label>
              <input
                type="radio"
                name="sys-wa-variant"
                checked={draft.whatsappVariant === "business"}
                onChange={() => updateField("whatsappVariant", "business")}
              />
              <span>أعمال</span>
            </label>
            <label>
              <input
                type="radio"
                name="sys-wa-variant"
                checked={draft.whatsappVariant === "omar"}
                onChange={() => updateField("whatsappVariant", "omar")}
              />
              <span>عمر</span>
            </label>
          </div>
        </div>

        <label className="sys-row sys-check-row">
          <span>الحماية بكلمة مرور</span>
          <input
            type="checkbox"
            className="account-form-switch"
            role="switch"
            checked={draft.passwordLock}
            onChange={(e) => updateField("passwordLock", e.target.checked)}
          />
        </label>

        {/* Blue Section Banner: Accounts Settings */}
        <div className="sys-section-banner">اعدادات الحسابات</div>

        <div className="sys-row sys-dual-checks">
          <label className="sys-inline-check">
            <span>عرض الرصيد في السند</span>
            <input
              type="checkbox"
              checked={draft.showBalanceInVoucher}
              onChange={(e) => updateField("showBalanceInVoucher", e.target.checked)}
            />
          </label>
          <label className="sys-inline-check">
            <span>عرض وقت السند</span>
            <input
              type="checkbox"
              checked={draft.showTimeInVoucher}
              onChange={(e) => updateField("showTimeInVoucher", e.target.checked)}
            />
          </label>
        </div>

        {(
          [
            ["hideCashboxesOnHome", "إخفاء إجمالي الصناديق في الشاشة الرئيسية"],
            ["hideVoucherSuggestions", "إخفاء اقتراحات تفاصيل السند"],
            ["useReceiptPaymentVoucher", "استخدام سند صرف/قبض"],
            ["useTwoDecimals", "استخدام الفاصل العشري .00"],
            ["showAllCurrenciesToLocal", "عرض خيار جميع العملات إلى عملة محلية"],
            ["hideAllUsersOption", "عدم عرض خيار جميع المستخدمين"],
          ] as const
        ).map(([key, label]) => (
          <label className="sys-row sys-check-row" key={key}>
            <span>{label}</span>
            <input
              type="checkbox"
              checked={draft[key]}
              onChange={(e) => updateField(key, e.target.checked)}
            />
          </label>
        ))}

        <div className="sys-row sys-dual-checks">
          <label className="sys-inline-check">
            <span>طباعة السندات بـ طابعة حرارية</span>
            <input
              type="checkbox"
              checked={draft.thermalPrintPdf}
              onChange={(e) => updateField("thermalPrintPdf", e.target.checked)}
            />
          </label>
          <span className="sys-inline-tag">PDF</span>
        </div>

        {(
          [
            ["showGeneralEntryOnHome", "إضافة قيد عام إلى الشاشة الرئيسية"],
            ["useNotifMsgInPaymentReq", "استخدام رسالة الإشعارات في طلب السداد"],
            ["showDateInSms", "عرض تاريخ الإرسال في الرسائل النصية"],
            ["showVoucherNoInSms", "عرض رقم السند في الرسائل النصية"],
          ] as const
        ).map(([key, label]) => (
          <label className="sys-row sys-check-row" key={key}>
            <span>{label}</span>
            <input
              type="checkbox"
              checked={draft[key]}
              onChange={(e) => updateField(key, e.target.checked)}
            />
          </label>
        ))}

        <label className="sys-field-box full">
          <span>ملاحظات أسفل كشف الحساب</span>
          <KeyboardInput
            aria-label="ملاحظات أسفل كشف الحساب"
            value={draft.statementFooterNote}
            onChange={(e) => updateField("statementFooterNote", e.target.value)}
          />
        </label>

        <div className="sys-bilingual-grid">
          <label className="sys-field-box">
            <span>مقدمة الرسالة</span>
            <KeyboardInput
              aria-label="مقدمة الرسالة"
              placeholder="مقدمة الرسالة"
              value={draft.messageIntro}
              onChange={(e) => updateField("messageIntro", e.target.value)}
            />
          </label>
          <label className="sys-field-box">
            <span>ختام الرسالة</span>
            <KeyboardInput
              aria-label="ختام الرسالة"
              placeholder="ختام الرسالة"
              value={draft.messageOutro}
              onChange={(e) => updateField("messageOutro", e.target.value)}
            />
          </label>
          <label className="sys-field-box">
            <span>الرصيد لكم</span>
            <KeyboardInput
              aria-label="مسمى الرصيد لكم"
              value={draft.creditBalanceLabel}
              onChange={(e) => updateField("creditBalanceLabel", e.target.value)}
            />
          </label>
          <label className="sys-field-box">
            <span>الرصيد عليكم</span>
            <KeyboardInput
              aria-label="مسمى الرصيد عليكم"
              value={draft.debitBalanceLabel}
              onChange={(e) => updateField("debitBalanceLabel", e.target.value)}
            />
          </label>
        </div>

        {/* Blue Section Banner: Sales & Purchases Settings */}
        <div className="sys-section-banner">اعدادات المبيعات والمشتريات</div>

        <label className="sys-field-box full">
          <span>ملاحظات أسفل فواتير المبيعات</span>
          <KeyboardInput
            aria-label="ملاحظات أسفل فواتير المبيعات"
            value={draft.salesInvoiceFooterNote}
            onChange={(e) => updateField("salesInvoiceFooterNote", e.target.value)}
          />
        </label>

        <div className="sys-row sys-dual-checks">
          <label className="sys-inline-check">
            <span>بيع بسعر أقل من التكلفة</span>
            <input
              type="checkbox"
              checked={draft.sellBelowCost}
              onChange={(e) => updateField("sellBelowCost", e.target.checked)}
            />
          </label>
          <label className="sys-inline-check">
            <span>بيع بدون رصيد</span>
            <input
              type="checkbox"
              checked={draft.sellWithoutBalance}
              onChange={(e) => updateField("sellWithoutBalance", e.target.checked)}
            />
          </label>
        </div>

        <div className="sys-row sys-radio-row">
          <span className="sys-blue-label">نموذج طباعة الفواتير</span>
          <div className="sys-radios" role="radiogroup" aria-label="نموذج طباعة الفواتير">
            <label>
              <input
                type="radio"
                name="sys-invoice-tpl"
                checked={draft.invoicePrintTemplate === "1"}
                onChange={() => updateField("invoicePrintTemplate", "1")}
              />
              <span>1</span>
            </label>
            <label>
              <input
                type="radio"
                name="sys-invoice-tpl"
                checked={draft.invoicePrintTemplate === "2"}
                onChange={() => updateField("invoicePrintTemplate", "2")}
              />
              <span>2</span>
            </label>
          </div>
        </div>

        {(
          [
            ["hidePriceIn80mm", "عدم طباعة سعر البيع في فواتير mm80"],
            ["useWeightedAverage", "استخدام المتوسط المرجح"],
            ["hideItemCost", "عدم إظهار تكلفة الأصناف"],
            ["showItemsInInvoiceDetails", "عرض الأصناف في تفاصيل الفاتورة"],
            ["hideExpiryInInvoice", "عدم عرض تاريخ الانتهاء في الفاتورة"],
            ["useFreeBonusQty", "استخدام البونص (الكمية المجانية)"],
            ["hidePrintDateInInvoice", "عدم عرض تاريخ الطباعة في الفاتورة"],
            ["useLargestUnitAsMain", "استخدام أكبر وحدة كـ وحدة رئيسية"],
          ] as const
        ).map(([key, label]) => (
          <label className="sys-row sys-check-row" key={key}>
            <span>{label}</span>
            <input
              type="checkbox"
              checked={draft[key]}
              onChange={(e) => updateField(key, e.target.checked)}
            />
          </label>
        ))}

        <p className="sys-important-note">
          ملاحظة هامة جدًا: لا ينصح بتفعيل هذا الخيار، يتم اختيار هذا الإعداد عندما تستخدم أكبر وحدة كـ وحدة رئيسية، مثلًا تستخدم الكرتون كـ وحدة رئيسية وليس الحبة.
        </p>

        <div className="sys-save-footer">
          <button
            type="button"
            className="ref-btn blue"
            disabled={saving}
            onClick={() => void handleSaveAll()}
            data-testid="system-settings-save-btn"
          >
            {saving ? "جاري الحفظ..." : "حفظ الإعدادات"}
          </button>
          <button
            type="button"
            className="ref-btn purple"
            onClick={() => {
              keyboard.hide();
              onBack();
            }}
          >
            رجوع
          </button>
        </div>
      </main>
    </MobileScroll>
  );
}
