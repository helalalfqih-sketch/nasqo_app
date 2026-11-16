import { useState } from "react";
import { triggerHaptic } from "../utils/haptics";

export type PrintExportFormat = "pdf" | "excel" | "image";

interface PrintOptionsModalProps {
  open: boolean;
  subjectLabel?: string;
  onClose: () => void;
  onPrintPdf: (allCurrencies: boolean) => void;
  onExportExcel: (allCurrencies: boolean) => void;
  onExportImage: (allCurrencies: boolean) => void;
  onShare: (allCurrencies: boolean) => void;
  onSendWhatsApp: (allCurrencies: boolean) => void;
}

export function PrintOptionsModal({
  open,
  subjectLabel,
  onClose,
  onPrintPdf,
  onExportExcel,
  onExportImage,
  onShare,
  onSendWhatsApp,
}: PrintOptionsModalProps) {
  const [allCurrencies, setAllCurrencies] = useState(true);
  const [format, setFormat] = useState<PrintExportFormat>("pdf");

  if (!open) return null;

  const handlePrimaryPrint = () => {
    triggerHaptic("success");
    onClose();
    if (format === "pdf") onPrintPdf(allCurrencies);
    else if (format === "excel") onExportExcel(allCurrencies);
    else onExportImage(allCurrencies);
  };

  return (
    <div className="center-modal-layer" data-testid="print-options-modal">
      <button
        type="button"
        className="center-modal-backdrop"
        onClick={onClose}
        aria-label="إغلاق خيارات الطباعة"
      />
      <section
        className="ref-dialog-card print-options-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="print-options-title"
      >
        <h2 id="print-options-title">خيارات الطباعة</h2>
        {subjectLabel ? <p className="ref-dialog-sub">{subjectLabel}</p> : null}

        <label className="print-options-check-row">
          <span>طباعة جميع العملات</span>
          <input
            type="checkbox"
            checked={allCurrencies}
            onChange={(e) => {
              triggerHaptic("light");
              setAllCurrencies(e.target.checked);
            }}
          />
        </label>

        <div className="print-options-radio-row" role="radiogroup" aria-label="صيغة التصدير">
          <label>
            <input
              type="radio"
              name="print-format-choice"
              checked={format === "pdf"}
              onChange={() => {
                triggerHaptic("light");
                setFormat("pdf");
              }}
            />
            <span>PDF</span>
          </label>
          <label>
            <input
              type="radio"
              name="print-format-choice"
              checked={format === "excel"}
              onChange={() => {
                triggerHaptic("light");
                setFormat("excel");
              }}
            />
            <span>Excel</span>
          </label>
          <label>
            <input
              type="radio"
              name="print-format-choice"
              checked={format === "image"}
              onChange={() => {
                triggerHaptic("light");
                setFormat("image");
              }}
            />
            <span>صورة</span>
          </label>
        </div>

        <div className="ref-action-bar cols-4">
          <button type="button" className="ref-btn blue" onClick={handlePrimaryPrint}>
            طباعة
          </button>
          <button
            type="button"
            className="ref-btn blue"
            onClick={() => {
              triggerHaptic("light");
              onClose();
              onShare(allCurrencies);
            }}
          >
            مشاركة
          </button>
          <button
            type="button"
            className="ref-btn green"
            onClick={() => {
              triggerHaptic("light");
              onClose();
              onSendWhatsApp(allCurrencies);
            }}
          >
            إرسال
          </button>
          <button
            type="button"
            className="ref-btn purple"
            onClick={() => {
              triggerHaptic("light");
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
