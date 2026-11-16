import { useState } from "react";
import { DownloadIcon, Share1Icon } from "@radix-ui/react-icons";
import type { DashboardSummary } from "../accounting";
import type { CurrencyCode } from "../types";
import { exportDashboardSummaryPdf } from "../utils/exportPdf";
import { triggerHaptic } from "../utils/haptics";

interface PdfReportButtonProps {
  companyName: string;
  defaultCurrency: CurrencyCode;
  periodLabel: string;
  summary: DashboardSummary;
  onNotify: (message: string) => void;
}

export function PdfReportButton({
  companyName,
  defaultCurrency,
  periodLabel,
  summary,
  onNotify,
}: PdfReportButtonProps) {
  const [exporting, setExporting] = useState(false);

  const runExport = async (mode: "download" | "share") => {
    setExporting(true);
    triggerHaptic("light");
    try {
      const result = await exportDashboardSummaryPdf(
        {
          companyName: companyName || "نسقو برو",
          defaultCurrency,
          periodLabel,
          summary,
        },
        mode,
      );
      triggerHaptic("success");
      onNotify(
        result === "shared"
          ? "تمت مشاركة تقرير PDF المالي ونواقص المخزون بنجاح"
          : "تم تنزيل التقرير المالي وتنبيهات المخزون بصيغة PDF",
      );
    } catch {
      triggerHaptic("warning");
      onNotify("تعذر إنشاء ملف PDF — يمكنك استخدام الطباعة كبديل");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="exec-pdf-actions" role="group" aria-label="تصدير التقرير المالي بصيغة PDF">
      <button
        type="button"
        className="exec-action-primary"
        disabled={exporting}
        onClick={() => runExport("download")}
        data-testid="export-dashboard-pdf-btn"
      >
        <DownloadIcon />
        <span>{exporting ? "جاري التصدير..." : "تصدير PDF"}</span>
      </button>

      <button
        type="button"
        className="exec-action-secondary"
        disabled={exporting}
        aria-label="مشاركة التقرير بصيغة PDF"
        onClick={() => runExport("share")}
        data-testid="share-dashboard-pdf-btn"
      >
        <Share1Icon />
        <span>مشاركة</span>
      </button>
    </div>
  );
}
