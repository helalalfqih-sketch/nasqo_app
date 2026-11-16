export function downloadBlobUrl(filename: string, url: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportSummaryAsPngImage(options: {
  filename: string;
  companyName: string;
  title: string;
  subtitle?: string;
  accentColor?: string;
  rows: readonly [string, string][];
  footerNote?: string;
}): boolean {
  if (typeof document === "undefined") return false;
  const width = 760;
  const rowHeight = 46;
  const paddingTop = 148;
  const paddingBottom = options.footerNote ? 84 : 44;
  const height = Math.max(360, paddingTop + options.rows.length * rowHeight + paddingBottom);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return false;

  const accent = options.accentColor || "#0b5ca8";

  // Clean light receipt surface
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // Header band
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, width, 96);

  ctx.direction = "rtl";
  ctx.textAlign = "right";
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 24px Tahoma, Arial, sans-serif";
  ctx.fillText(options.companyName || "نسقو برو", width - 28, 42);

  ctx.font = "400 16px Tahoma, Arial, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fillText(options.title, width - 28, 74);

  if (options.subtitle) {
    ctx.fillStyle = "#122130";
    ctx.font = "700 17px Tahoma, Arial, sans-serif";
    ctx.fillText(options.subtitle, width - 28, 128);
  }

  options.rows.forEach(([label, val], idx) => {
    const y = paddingTop + idx * rowHeight;
    ctx.fillStyle = idx % 2 === 0 ? "#f4f7fb" : "#ffffff";
    ctx.fillRect(24, y, width - 48, rowHeight - 4);

    ctx.strokeStyle = "#d5e0eb";
    ctx.lineWidth = 1;
    ctx.strokeRect(24, y, width - 48, rowHeight - 4);

    ctx.textAlign = "right";
    ctx.fillStyle = "#4c6278";
    ctx.font = "700 15px Tahoma, Arial, sans-serif";
    ctx.fillText(label, width - 40, y + 26);

    ctx.textAlign = "left";
    ctx.fillStyle = "#122130";
    ctx.font = "700 16px Tahoma, Arial, sans-serif";
    ctx.fillText(val, 40, y + 26);
  });

  if (options.footerNote) {
    ctx.textAlign = "center";
    ctx.fillStyle = "#64748b";
    ctx.font = "400 13px Tahoma, Arial, sans-serif";
    ctx.fillText(options.footerNote, width / 2, height - 26);
  }

  const dataUrl = canvas.toDataURL("image/png");
  downloadBlobUrl(options.filename.endsWith(".png") ? options.filename : `${options.filename}.png`, dataUrl);
  return true;
}
