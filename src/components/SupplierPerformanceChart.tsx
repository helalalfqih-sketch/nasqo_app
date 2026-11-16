import { useMemo, useState } from "react";
import * as d3 from "d3";
import { formatAmount, type SupplierPerformanceMetric } from "../accounting";
import type { CurrencyCode } from "../types";
import { triggerHaptic } from "../utils/haptics";

interface SupplierPerformanceChartProps {
  suppliers: readonly SupplierPerformanceMetric[];
  currency: CurrencyCode;
  loading?: boolean;
  onSelectSupplier?: (accountId: string) => void;
}

type MetricView = "delivery" | "cost";

const CHART_WIDTH = 560;
const CHART_HEIGHT = 210;
const MARGIN = { top: 20, right: 20, bottom: 52, left: 52 };

export function SupplierPerformanceChart({
  suppliers,
  currency,
  loading = false,
  onSelectSupplier,
}: SupplierPerformanceChartProps) {
  const [metricView, setMetricView] = useState<MetricView>("delivery");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const innerWidth = CHART_WIDTH - MARGIN.left - MARGIN.right;
  const innerHeight = CHART_HEIGHT - MARGIN.top - MARGIN.bottom;

  const { bars, yTicks, avgDeliveryAll, avgCostAll } = useMemo(() => {
    const xScale = d3
      .scaleBand<string>()
      .domain(suppliers.map((s) => s.accountId))
      .range([0, innerWidth])
      .padding(0.32);

    const values = suppliers.map((s) =>
      metricView === "delivery" ? s.avgDeliveryDays : s.avgOrderCost,
    );
    const maxVal = d3.max(values) ?? 0;
    const domainMax = maxVal > 0 ? maxVal * 1.2 : metricView === "delivery" ? 7 : 1000;

    const yScale = d3.scaleLinear().domain([0, domainMax]).nice(4).range([innerHeight, 0]);

    const mappedBars = suppliers.map((s) => {
      const value = metricView === "delivery" ? s.avgDeliveryDays : s.avgOrderCost;
      const y = yScale(value);
      return {
        supplier: s,
        x: xScale(s.accountId) ?? 0,
        width: xScale.bandwidth(),
        y,
        height: Math.max(4, innerHeight - y),
        value,
      };
    });

    const ticks = yScale.ticks(4).map((val) => ({
      value: val,
      y: yScale(val),
    }));

    const deliveryAvg =
      suppliers.length > 0
        ? Math.round((suppliers.reduce((acc, s) => acc + s.avgDeliveryDays, 0) / suppliers.length) * 10) / 10
        : 0;
    const costAvg =
      suppliers.length > 0
        ? Math.round(suppliers.reduce((acc, s) => acc + s.avgOrderCost, 0) / suppliers.length)
        : 0;

    return {
      bars: mappedBars,
      yTicks: ticks,
      avgDeliveryAll: deliveryAvg,
      avgCostAll: costAvg,
    };
  }, [innerHeight, innerWidth, metricView, suppliers]);

  const focused =
    activeIndex !== null && bars[activeIndex] ? bars[activeIndex].supplier : bars[0]?.supplier ?? null;

  return (
    <section
      className="exec-panel exec-supplier-panel"
      aria-labelledby="supplier-perf-heading"
      data-testid="supplier-performance-widget"
    >
      <div className="exec-panel-head">
        <div>
          <h2 id="supplier-perf-heading">أداء الموردين (التسليم والتكاليف)</h2>
          <p>
            {suppliers.length > 0 ? (
              <>
                متوسط التوريد: <strong className="exec-tabular">{avgDeliveryAll} يوم</strong> · متوسط الفاتورة:{" "}
                <strong className="exec-tabular">
                  {formatAmount(avgCostAll)} {currency}
                </strong>
              </>
            ) : (
              "لا توجد بيانات موردين كافية للمقارنة"
            )}
          </p>
        </div>

        <div className="exec-segmented" role="group" aria-label="مؤشر مقارنة الموردين">
          <button
            type="button"
            className={metricView === "delivery" ? "active" : ""}
            aria-pressed={metricView === "delivery"}
            onClick={() => {
              triggerHaptic("light");
              setMetricView("delivery");
            }}
            data-testid="supplier-metric-delivery"
          >
            أيام التسليم
          </button>
          <button
            type="button"
            className={metricView === "cost" ? "active" : ""}
            aria-pressed={metricView === "cost"}
            onClick={() => {
              triggerHaptic("light");
              setMetricView("cost");
            }}
            data-testid="supplier-metric-cost"
          >
            متوسط التكلفة
          </button>
        </div>
      </div>

      {focused ? (
        <div className="exec-supplier-focus">
          <span>
            المورد: <strong>{focused.name}</strong>
          </span>
          <span className="exec-tabular">
            الالتزام: <b>{focused.onTimeScore}%</b> · متوسط التوريد: <b>{focused.avgDeliveryDays} يوم</b> ·
            متوسط الطلب: <b>{formatAmount(focused.avgOrderCost)} {currency}</b> · الإجمالي:{" "}
            <b>{formatAmount(focused.totalSpend)} {currency}</b>
          </span>
        </div>
      ) : null}

      <div className="exec-chart-wrap" dir="ltr">
        {loading ? (
          <div className="exec-empty">جاري تحليل أداء الموردين...</div>
        ) : suppliers.length === 0 ? (
          <div className="exec-empty">أضف فواتير مشتريات لمقارنة أوقات التوريد وتكاليف الموردين.</div>
        ) : (
          <svg
            viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
            className="exec-d3-chart"
            role="img"
            aria-label="مخطط D3 لمقارنة أداء الموردين"
            data-testid="supplier-performance-d3-chart"
          >
            <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
              {yTicks.map((tick) => (
                <g key={tick.value} transform={`translate(0,${tick.y})`}>
                  <line x1={0} x2={innerWidth} className="exec-chart-grid" />
                  <text x={-8} dy="0.32em" textAnchor="end" className="exec-chart-axis-text">
                    {metricView === "delivery"
                      ? `${tick.value}d`
                      : tick.value >= 1000
                        ? `${Math.round(tick.value / 100) / 10}k`
                        : formatAmount(tick.value)}
                  </text>
                </g>
              ))}

              {bars.map((bar, idx) => {
                const isActive = activeIndex === idx;
                const shortName =
                  bar.supplier.name.length > 13
                    ? `${bar.supplier.name.slice(0, 12)}…`
                    : bar.supplier.name;
                return (
                  <g key={bar.supplier.accountId}>
                    <rect
                      x={bar.x}
                      y={bar.y}
                      width={bar.width}
                      height={bar.height}
                      rx={6}
                      className={`exec-bar ${metricView === "delivery" ? "delivery" : "cost"} ${isActive ? "active" : ""}`}
                      tabIndex={0}
                      role="button"
                      aria-label={`${bar.supplier.name}: ${bar.supplier.avgDeliveryDays} يوم تسليم، متوسط ${formatAmount(bar.supplier.avgOrderCost)} ${currency}`}
                      onMouseEnter={() => setActiveIndex(idx)}
                      onMouseLeave={() => setActiveIndex(null)}
                      onFocus={() => setActiveIndex(idx)}
                      onBlur={() => setActiveIndex(null)}
                      onClick={() => {
                        triggerHaptic("light");
                        onSelectSupplier?.(bar.supplier.accountId);
                      }}
                    />
                    <text
                      x={bar.x + bar.width / 2}
                      y={Math.max(10, bar.y - 6)}
                      textAnchor="middle"
                      className="exec-bar-val"
                    >
                      {metricView === "delivery"
                        ? `${bar.supplier.avgDeliveryDays}ي`
                        : bar.supplier.avgOrderCost >= 1000
                          ? `${Math.round(bar.supplier.avgOrderCost / 100) / 10}k`
                          : formatAmount(bar.supplier.avgOrderCost)}
                    </text>
                    <text
                      x={bar.x + bar.width / 2}
                      y={innerHeight + 18}
                      textAnchor="middle"
                      className="exec-chart-axis-text"
                    >
                      {shortName}
                    </text>
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
