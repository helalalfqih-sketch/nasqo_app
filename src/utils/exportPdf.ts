import { jsPDF } from "jspdf";
import { formatAmount, type DashboardSummary } from "../accounting";
import type { CurrencyCode } from "../types";

export interface DashboardPdfPayload {
  companyName: string;
  defaultCurrency: CurrencyCode;
  periodLabel: string;
  summary: DashboardSummary;
}

function drawSummaryCanvas(payload: DashboardPdfPayload): HTMLCanvasElement {
  const width = 1240;
  const rowsCount = Math.max(payload.summary.recentInvoices.length, 1) + Math.max(payload.summary.lowStockItems.length, 1);
  const height = Math.max(1754, 720 + rowsCount * 66);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // Header band
  ctx.fillStyle = "#0b5ca8";
  ctx.fillRect(0, 0, width, 150);

  ctx.direction = "rtl";
  ctx.textAlign = "right";
  ctx.fillStyle = "#ffffff";
  ctx.font = 'bold 38px "Segoe UI", Tahoma, Arial, sans-serif';
  ctx.fillText(payload.companyName || "نسقو برو", width - 64, 68);

  ctx.font = '22px "Segoe UI", Tahoma, Arial, sans-serif';
  ctx.fillStyle = "#dbeafe";
  ctx.fillText(`التقرير المالي وتنبيهات المخزون · ${payload.periodLabel}`, width - 64, 112);

  ctx.textAlign = "left";
  ctx.font = '20px "Segoe UI", Tahoma, Arial, sans-serif';
  ctx.fillText(new Date().toLocaleDateString("en-GB"), 64, 112);

  // Summary KPI Strip
  const cardY = 190;
  const cardGap = 24;
  const cardW = (width - 128 - cardGap * 2) / 3;
  const kpis = [
    {
      label: "إجمالي المبيعات",
      value: `${formatAmount(payload.summary.totalSales)} ${payload.defaultCurrency}`,
      sub: `${payload.summary.salesInvoiceCount} فاتورة مبيعات`,
    },
    {
      label: "إجمالي الفواتير",
      value: `${payload.summary.totalInvoicesCount} فاتورة`,
      sub: `${formatAmount(payload.summary.totalInvoicesVolume)} ${payload.defaultCurrency}`,
    },
    {
      label: "أصناف تحت الحد الأدنى",
      value: `${payload.summary.lowStockItems.length} أصناف`,
      sub: `من أصل ${payload.summary.totalInventoryItems} صنف`,
    },
  ];

  kpis.forEach((kpi, index) => {
    const x = width - 64 - cardW * (index + 1) - cardGap * index;
    ctx.fillStyle = "#f8fafc";
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 2;
    ctx.fillRect(x, cardY, cardW, 140);
    ctx.strokeRect(x, cardY, cardW, 140);

    ctx.textAlign = "right";
    ctx.fillStyle = "#475569";
    ctx.font = '600 20px "Segoe UI", Tahoma, Arial, sans-serif';
    ctx.fillText(kpi.label, x + cardW - 22, cardY + 42);

    ctx.fillStyle = "#0f172a";
    ctx.font = 'bold 30px "Segoe UI", Tahoma, Arial, sans-serif';
    ctx.fillText(kpi.value, x + cardW - 22, cardY + 88);

    ctx.fillStyle = "#64748b";
    ctx.font = '18px "Segoe UI", Tahoma, Arial, sans-serif';
    ctx.fillText(kpi.sub, x + cardW - 22, cardY + 120);
  });

  // Low-Stock Section
  let cursorY = 385;
  ctx.textAlign = "right";
  ctx.fillStyle = "#07365d";
  ctx.font = 'bold 28px "Segoe UI", Tahoma, Arial, sans-serif';
  ctx.fillText("قائمة الأصناف المنخفضة (أقل من الحد الأدنى)", width - 64, cursorY);
  cursorY += 24;

  // Table header
  ctx.fillStyle = "#eef4fb";
  ctx.fillRect(64, cursorY, width - 128, 48);
  ctx.fillStyle = "#0f172a";
  ctx.font = 'bold 20px "Segoe UI", Tahoma, Arial, sans-serif';
  ctx.fillText("الصنف", width - 84, cursorY + 32);
  ctx.fillText("المخزن", width - 450, cursorY + 32);
  ctx.fillText("الكمية الحالية", width - 730, cursorY + 32);
  ctx.fillText("الحد الأدنى", width - 930, cursorY + 32);
  ctx.fillText("النقص", 170, cursorY + 32);
  cursorY += 56;

  if (payload.summary.lowStockItems.length === 0) {
    ctx.fillStyle = "#475569";
    ctx.font = '20px "Segoe UI", Tahoma, Arial, sans-serif';
    ctx.fillText("جميع الأصناف ضمن الحد الآمن للمخزون.", width - 84, cursorY + 26);
    cursorY += 54;
  } else {
    for (const item of payload.summary.lowStockItems) {
      ctx.fillStyle = "#0f172a";
      ctx.font = '20px "Segoe UI", Tahoma, Arial, sans-serif';
      ctx.fillText(item.name.slice(0, 34), width - 84, cursorY + 28);
      ctx.fillStyle = "#475569";
      ctx.fillText(item.warehouseName.slice(0, 22), width - 450, cursorY + 28);
      ctx.fillStyle = item.severity === "critical" ? "#dc2626" : "#b45309";
      ctx.font = 'bold 20px "Segoe UI", Tahoma, Arial, sans-serif';
      ctx.fillText(`${formatAmount(item.quantity)} ${item.unit}`, width - 730, cursorY + 28);
      ctx.fillStyle = "#334155";
      ctx.font = '20px "Segoe UI", Tahoma, Arial, sans-serif';
      ctx.fillText(`${formatAmount(item.effectiveThreshold)}`, width - 930, cursorY + 28);
      ctx.fillStyle = "#dc2626";
      ctx.fillText(`-${formatAmount(item.shortage)}`, 170, cursorY + 28);

      cursorY += 46;
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(64, cursorY);
      ctx.lineTo(width - 64, cursorY);
      ctx.stroke();
      cursorY += 8;
    }
  }

  // Recent Invoices Section
  cursorY += 36;
  ctx.textAlign = "right";
  ctx.fillStyle = "#07365d";
  ctx.font = 'bold 28px "Segoe UI", Tahoma, Arial, sans-serif';
  ctx.fillText("أحدث الفواتير المسجلة", width - 64, cursorY);
  cursorY += 24;

  ctx.fillStyle = "#eef4fb";
  ctx.fillRect(64, cursorY, width - 128, 48);
  ctx.fillStyle = "#0f172a";
  ctx.font = 'bold 20px "Segoe UI", Tahoma, Arial, sans-serif';
  ctx.fillText("رقم الفاتورة", width - 84, cursorY + 32);
  ctx.fillText("الحساب", width - 250, cursorY + 32);
  ctx.fillText("النوع", width - 640, cursorY + 32);
  ctx.fillText("التاريخ", width - 860, cursorY + 32);
  ctx.fillText("المبلغ", 170, cursorY + 32);
  cursorY += 56;

  if (payload.summary.recentInvoices.length === 0) {
    ctx.fillStyle = "#475569";
    ctx.font = '20px "Segoe UI", Tahoma, Arial, sans-serif';
    ctx.fillText("لا توجد فواتير مسجلة ضمن الفترة.", width - 84, cursorY + 26);
  } else {
    for (const inv of payload.summary.recentInvoices) {
      ctx.fillStyle = "#0f172a";
      ctx.font = '20px "Segoe UI", Tahoma, Arial, sans-serif';
      ctx.fillText(`#${inv.entryNumber}`, width - 84, cursorY + 28);
      ctx.fillText(inv.accountName.slice(0, 28), width - 250, cursorY + 28);
      ctx.fillStyle = "#475569";
      ctx.fillText(inv.typeLabel, width - 640, cursorY + 28);
      ctx.fillText(inv.entryDate, width - 860, cursorY + 28);
      ctx.fillStyle = "#07365d";
      ctx.font = 'bold 20px "Segoe UI", Tahoma, Arial, sans-serif';
      ctx.fillText(`${formatAmount(inv.amount)} ${inv.currency}`, 170, cursorY + 28);

      cursorY += 46;
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(64, cursorY);
      ctx.lineTo(width - 64, cursorY);
      ctx.stroke();
      cursorY += 8;
    }
  }

  return canvas;
}

export async function exportDashboardSummaryPdf(
  payload: DashboardPdfPayload,
  mode: "download" | "share" = "download",
): Promise<"downloaded" | "shared"> {
  const canvas = drawSummaryCanvas(payload);
  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const renderedHeight = (canvas.height * pageWidth) / canvas.width;
  const pageHeight = pdf.internal.pageSize.getHeight();
  const fitHeight = Math.min(renderedHeight, pageHeight);
  pdf.addImage(imgData, "PNG", 0, 0, pageWidth, fitHeight, undefined, "FAST");

  const filename = `nasqo-summary-${new Date().toISOString().slice(0, 10)}.pdf`;

  if (mode === "share" && typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      const blob = pdf.output("blob");
      const file = new File([blob], filename, { type: "application/pdf" });
      if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `التقرير المالي - ${payload.companyName}`,
          text: `إجمالي المبيعات: ${formatAmount(payload.summary.totalSales)} ${payload.defaultCurrency} | نواقص المخزون: ${payload.summary.lowStockItems.length}`,
          files: [file],
        });
        return "shared";
      }
    } catch {
      // Fallback to direct download below
    }
  }

  pdf.save(filename);
  return "downloaded";
}
