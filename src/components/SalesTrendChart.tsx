import { useMemo, useState } from "react";
import * as d3 from "d3";
import { formatAmount, type SalesTrendPoint } from "../accounting";
import type { CurrencyCode } from "../types";

interface SalesTrendChartProps {
  points: readonly SalesTrendPoint[];
  currency: CurrencyCode;
  loading?: boolean;
}

const CHART_WIDTH = 560;
const CHART_HEIGHT = 180;
const MARGIN = { top: 18, right: 20, bottom: 32, left: 48 };

export function SalesTrendChart({ points, currency, loading = false }: SalesTrendChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const innerWidth = CHART_WIDTH - MARGIN.left - MARGIN.right;
  const innerHeight = CHART_HEIGHT - MARGIN.top - MARGIN.bottom;

  const { linePath, areaPath, xCoords, yTicks, maxVal, total7Days } = useMemo(() => {
    const maxRaw = d3.max(points, (d) => d.salesTotal) ?? 0;
    const domainMax = maxRaw > 0 ? maxRaw * 1.15 : 1000;

    const xScale = d3
      .scalePoint<string>()
      .domain(points.map((d) => d.dateIso))
      .range([0, innerWidth])
      .padding(0.15);

    const yScale = d3.scaleLinear().domain([0, domainMax]).nice(4).range([innerHeight, 0]);

    const lineGen = d3
      .line<SalesTrendPoint>()
      .x((d) => xScale(d.dateIso) ?? 0)
      .y((d) => yScale(d.salesTotal))
      .curve(d3.curveMonotoneX);

    const areaGen = d3
      .area<SalesTrendPoint>()
      .x((d) => xScale(d.dateIso) ?? 0)
      .y0(innerHeight)
      .y1((d) => yScale(d.salesTotal))
      .curve(d3.curveMonotoneX);

    const coords = points.map((pt) => ({
      point: pt,
      x: xScale(pt.dateIso) ?? 0,
      y: yScale(pt.salesTotal),
    }));

    const ticks = yScale.ticks(3).map((val) => ({
      value: val,
      y: yScale(val),
    }));

    const sum7 = points.reduce((acc, pt) => acc + pt.salesTotal, 0);

    return {
      linePath: lineGen([...points]) ?? "",
      areaPath: areaGen([...points]) ?? "",
      xCoords: coords,
      yTicks: ticks,
      maxVal: maxRaw,
      total7Days: sum7,
    };
  }, [innerHeight, innerWidth, points]);

  const activePoint =
    hoveredIndex !== null && xCoords[hoveredIndex]
      ? xCoords[hoveredIndex].point
      : xCoords[xCoords.length - 1]?.point ?? null;

  return (
    <section className="exec-panel exec-trend-panel" aria-labelledby="sales-trend-heading">
      <div className="exec-panel-head">
        <div>
          <h2 id="sales-trend-heading">اتجاه المبيعات (آخر 7 أيام)</h2>
          <p>
            إجمالي 7 أيام: <strong className="exec-tabular">{formatAmount(total7Days)} {currency}</strong>
            {activePoint ? (
              <>
                {" "}
                · {activePoint.weekdayLabel} ({activePoint.shortLabel}):{" "}
                <strong className="exec-tabular">
                  {formatAmount(activePoint.salesTotal)} {currency}
                </strong>
              </>
            ) : null}
          </p>
        </div>
        {maxVal === 0 && !loading ? (
          <span className="exec-row-meta">لا توجد مبيعات مسجلة خلال آخر 7 أيام</span>
        ) : null}
      </div>

      <div className="exec-chart-wrap" dir="ltr">
        {loading ? (
          <div className="exec-empty">جاري تحميل بيانات الرسم البياني...</div>
        ) : (
          <svg
            viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
            className="exec-d3-chart"
            role="img"
            aria-label="مخطط خطي لمبيعات آخر 7 أيام"
            data-testid="sales-trend-d3-chart"
          >
            <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
              {yTicks.map((tick) => (
                <g key={tick.value} transform={`translate(0,${tick.y})`}>
                  <line x1={0} x2={innerWidth} className="exec-chart-grid" />
                  <text x={-8} dy="0.32em" textAnchor="end" className="exec-chart-axis-text">
                    {tick.value >= 1000 ? `${Math.round(tick.value / 100) / 10}k` : formatAmount(tick.value)}
                  </text>
                </g>
              ))}

              <path d={areaPath} className="exec-chart-area" />
              <path d={linePath} className="exec-chart-line" />

              {xCoords.map((item, idx) => {
                const isActive = hoveredIndex === idx;
                return (
                  <g
                    key={item.point.dateIso}
                    transform={`translate(${item.x},0)`}
                    className="exec-chart-point-group"
                  >
                    {isActive ? (
                      <line y1={0} y2={innerHeight} className="exec-chart-cursor" />
                    ) : null}
                    <text y={innerHeight + 20} textAnchor="middle" className="exec-chart-axis-text">
                      {item.point.shortLabel}
                    </text>
                    <circle
                      cy={item.y}
                      r={isActive ? 5.5 : 3.5}
                      className={isActive ? "exec-chart-dot active" : "exec-chart-dot"}
                    />
                    <rect
                      x={-26}
                      y={0}
                      width={52}
                      height={innerHeight + 24}
                      fill="transparent"
                      tabIndex={0}
                      aria-label={`${item.point.weekdayLabel} ${item.point.dateIso}: ${formatAmount(item.point.salesTotal)} ${currency}`}
                      onMouseEnter={() => setHoveredIndex(idx)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      onFocus={() => setHoveredIndex(idx)}
                      onBlur={() => setHoveredIndex(null)}
                    />
                  </g>
                );
              })}
            </g>
          </svg>
        )}
      </div>
    </section>
  );
}
