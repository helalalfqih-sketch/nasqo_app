import { useState } from "react";
import { BarChartIcon } from "@radix-ui/react-icons";
import { formatAmount, type MonthlySalesPurchasesPoint } from "../accounting";

function topRoundedBarPath(x: number, y: number, w: number, h: number, r = 3.5): string {
  const radius = Math.min(r, w / 2, h);
  const bottom = y + h;
  if (h <= radius) {
    return `M ${x} ${bottom} L ${x} ${y} L ${x + w} ${y} L ${x + w} ${bottom} Z`;
  }
  return [
    `M ${x} ${bottom}`,
    `L ${x} ${y + radius}`,
    `Q ${x} ${y} ${x + radius} ${y}`,
    `L ${x + w - radius} ${y}`,
    `Q ${x + w} ${y} ${x + w} ${y + radius}`,
    `L ${x + w} ${bottom}`,
    "Z",
  ].join(" ");
}

export function ErpSalesPurchasesChart({
  points,
  maxVal,
  ticks,
  currency,
}: {
  points: readonly MonthlySalesPurchasesPoint[];
  maxVal: number;
  ticks: readonly number[];
  currency: string;
}) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const chartW = 360;
  const chartH = 156;
  const padLeft = 52;
  const padRight = 10;
  const padTop = 10;
  const padBottom = 26;
  const plotW = chartW - padLeft - padRight;
  const plotH = chartH - padTop - padBottom;
  const groupW = plotW / Math.max(points.length, 1);
  const barW = Math.min(16, groupW * 0.28);
  const barGap = 4;

  const selectedPoint = selectedIndex !== null ? points[selectedIndex] : null;

  return (
    <section className="erp-section-card" aria-label="حركة المبيعات والمشتريات">
      <header className="erp-section-head">
        <div className="erp-section-title">
          <span className="erp-section-icon" aria-hidden="true">
            <BarChartIcon />
          </span>
          <h2>حركة المبيعات والمشتريات</h2>
        </div>

        <div className="erp-chart-legend" aria-label="دليل الرسم البياني">
          <span className="erp-legend-item">
            <span>المشتريات</span>
            <i className="erp-legend-swatch purchases" aria-hidden="true" />
          </span>
          <span className="erp-legend-item">
            <span>المبيعات</span>
            <i className="erp-legend-swatch sales" aria-hidden="true" />
          </span>
        </div>
      </header>

      {selectedPoint ? (
        <div className="erp-chart-callout" role="status">
          <strong>{selectedPoint.label}:</strong>
          <span>
            المبيعات <b>{formatAmount(selectedPoint.sales)}</b> {currency}
          </span>
          <span>·</span>
          <span>
            المشتريات <b>{formatAmount(selectedPoint.purchases)}</b> {currency}
          </span>
        </div>
      ) : null}

      <div className="erp-chart-wrap" dir="ltr">
        <svg
          viewBox={`0 0 ${chartW} ${chartH}`}
          className="erp-chart-svg"
          role="img"
          aria-label="رسم بياني لحركة المبيعات والمشتريات الشهرية"
        >
          {ticks.map((tickVal) => {
            const ratio = maxVal > 0 ? tickVal / maxVal : 0;
            const y = padTop + plotH - ratio * plotH;
            return (
              <g key={tickVal}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={chartW - padRight}
                  y2={y}
                  stroke={tickVal === 0 ? "#cbd5e1" : "#eef2f7"}
                  strokeWidth={tickVal === 0 ? 1.1 : 1}
                />
                <text
                  x={padLeft - 6}
                  y={y + 3.5}
                  textAnchor="end"
                  className="erp-chart-axis-text"
                >
                  {formatAmount(tickVal)}
                </text>
              </g>
            );
          })}

          {points.map((pt, idx) => {
            const cx = padLeft + groupW * idx + groupW / 2;
            const salesH = maxVal > 0 ? Math.max(pt.sales > 0 ? 4 : 0, (pt.sales / maxVal) * plotH) : 0;
            const purchasesH =
              maxVal > 0 ? Math.max(pt.purchases > 0 ? 4 : 0, (pt.purchases / maxVal) * plotH) : 0;
            const salesX = cx - barW - barGap / 2;
            const purchasesX = cx + barGap / 2;
            const salesY = padTop + plotH - salesH;
            const purchasesY = padTop + plotH - purchasesH;
            const isSelected = selectedIndex === idx;

            return (
              <g
                key={pt.monthKey}
                className="erp-chart-group"
                onClick={() => setSelectedIndex((prev) => (prev === idx ? null : idx))}
                style={{ cursor: "pointer" }}
              >
                {isSelected ? (
                  <rect
                    x={padLeft + groupW * idx + 4}
                    y={padTop}
                    width={groupW - 8}
                    height={plotH}
                    rx={6}
                    fill="rgba(34, 139, 230, 0.07)"
                  />
                ) : null}

                {salesH > 0 ? (
                  <path d={topRoundedBarPath(salesX, salesY, barW, salesH)} fill="#268ef5" />
                ) : (
                  <rect
                    x={salesX}
                    y={padTop + plotH - 2}
                    width={barW}
                    height={2}
                    rx={1}
                    fill="#d7e7fb"
                  />
                )}

                {purchasesH > 0 ? (
                  <path d={topRoundedBarPath(purchasesX, purchasesY, barW, purchasesH)} fill="#34b357" />
                ) : (
                  <rect
                    x={purchasesX}
                    y={padTop + plotH - 2}
                    width={barW}
                    height={2}
                    rx={1}
                    fill="#d4f0dc"
                  />
                )}

                <text
                  x={cx}
                  y={chartH - 7}
                  textAnchor="middle"
                  className={`erp-chart-month-text${isSelected ? " is-active" : ""}`}
                >
                  {pt.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}
