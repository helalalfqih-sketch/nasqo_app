import { useMemo, useRef, useState, type PointerEvent } from "react";
import * as d3 from "d3";
import {
  computeExpenseTrendsByCategory,
  formatAmount,
  type ExpenseCategorySlice,
  type ExpenseTrendRange,
} from "../accounting";
import type { AccountRecord, CurrencyCode, LedgerEntryRecord } from "../types";
import { triggerHaptic } from "../utils/haptics";

interface ExpenseTrendsChartProps {
  accounts: readonly AccountRecord[];
  ledger: readonly LedgerEntryRecord[];
  currency: CurrencyCode;
  loading?: boolean;
  onNotify?: (message: string) => void;
}

const RANGE_CYCLE: readonly ExpenseTrendRange[] = ["month", "quarter", "all"];
const RANGE_LABELS: Record<ExpenseTrendRange, string> = {
  month: "هذا الشهر (30 يوم)",
  quarter: "آخر 3 أشهر",
  all: "كل الفترات",
};

const DONUT_SIZE = 216;
const RADIUS = DONUT_SIZE / 2 - 12;
const INNER_RADIUS = RADIUS * 0.58;
const LONG_PRESS_MS = 480;

export function ExpenseTrendsChart({
  accounts,
  ledger,
  currency,
  loading = false,
  onNotify,
}: ExpenseTrendsChartProps) {
  const [range, setRange] = useState<ExpenseTrendRange>("month");
  const [detailedView, setDetailedView] = useState(false);
  const [activeSliceIndex, setActiveSliceIndex] = useState<number | null>(null);
  const [pressing, setPressing] = useState(false);

  const pressTimerRef = useRef<number | null>(null);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);

  const data = useMemo(
    () => computeExpenseTrendsByCategory(accounts, ledger, range),
    [accounts, ledger, range],
  );

  const arcs = useMemo(() => {
    const pie = d3
      .pie<ExpenseCategorySlice>()
      .value((d) => d.total)
      .sort(null);
    const arcGen = d3
      .arc<d3.PieArcDatum<ExpenseCategorySlice>>()
      .innerRadius(INNER_RADIUS)
      .outerRadius(RADIUS)
      .padAngle(0.025)
      .cornerRadius(5);
    const hoverArcGen = d3
      .arc<d3.PieArcDatum<ExpenseCategorySlice>>()
      .innerRadius(INNER_RADIUS - 2)
      .outerRadius(RADIUS + 5)
      .padAngle(0.025)
      .cornerRadius(5);

    return pie([...data.slices]).map((datum, index) => ({
      slice: datum.data,
      path: (activeSliceIndex === index ? hoverArcGen(datum) : arcGen(datum)) ?? "",
      index,
    }));
  }, [activeSliceIndex, data.slices]);

  const clearPressTimer = () => {
    if (pressTimerRef.current !== null) {
      window.clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    setPressing(false);
    startPointRef.current = null;
  };

  const cycleRangeShortcut = () => {
    const nextIdx = (RANGE_CYCLE.indexOf(range) + 1) % RANGE_CYCLE.length;
    const nextRange = RANGE_CYCLE[nextIdx];
    setRange(nextRange);
    setDetailedView((prev) => !prev);
    triggerHaptic("pin");
    onNotify?.(`تم التبديل السريع: ${RANGE_LABELS[nextRange]}`);
  };

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    clearPressTimer();
    startPointRef.current = { x: e.clientX, y: e.clientY };
    setPressing(true);
    pressTimerRef.current = window.setTimeout(() => {
      pressTimerRef.current = null;
      setPressing(false);
      cycleRangeShortcut();
    }, LONG_PRESS_MS);
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!startPointRef.current) return;
    const dx = Math.abs(e.clientX - startPointRef.current.x);
    const dy = Math.abs(e.clientY - startPointRef.current.y);
    if (dx > 8 || dy > 8) {
      clearPressTimer();
    }
  };

  const activeSlice =
    activeSliceIndex !== null && data.slices[activeSliceIndex]
      ? data.slices[activeSliceIndex]
      : data.slices[0] ?? null;

  return (
    <section
      className="exec-panel exec-expense-panel"
      aria-labelledby="expense-trends-heading"
      data-testid="expense-trends-widget"
    >
      <div className="exec-panel-head">
        <div>
          <h2 id="expense-trends-heading">اتجاهات المصروفات والتصنيف الذكي</h2>
          <p>
            {RANGE_LABELS[range]} ·{" "}
            <strong className="exec-tabular">
              {formatAmount(data.totalSpend)} {currency}
            </strong>{" "}
            ({data.entryCount} عملية)
          </p>
        </div>

        <div className="exec-segmented" role="group" aria-label="نطاق عرض المصروفات">
          {RANGE_CYCLE.map((r) => (
            <button
              key={r}
              type="button"
              className={range === r ? "active" : ""}
              aria-pressed={range === r}
              onClick={() => {
                triggerHaptic("light");
                setRange(r);
              }}
              data-testid={`expense-range-${r}`}
            >
              {r === "month" ? "شهري" : r === "quarter" ? "3 أشهر" : "الكل"}
            </button>
          ))}
        </div>
      </div>

      <div className="exec-expense-body">
        {loading ? (
          <div className="exec-empty">جاري تجميع فئات المصروفات...</div>
        ) : data.slices.length === 0 ? (
          <div className="exec-empty">
            <p>لا توجد مصروفات أو مشتريات ضمن {RANGE_LABELS[range]}.</p>
            {range !== "all" ? (
              <button
                type="button"
                className="exec-action-secondary"
                onClick={() => setRange("all")}
              >
                عرض كل الفترات
              </button>
            ) : null}
          </div>
        ) : (
          <div className="exec-donut-layout">
            <div
              className={`exec-donut-interactive ${pressing ? "long-pressing" : ""}`}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={clearPressTimer}
              onPointerCancel={clearPressTimer}
              onPointerLeave={clearPressTimer}
              onContextMenu={(e) => {
                e.preventDefault();
                cycleRangeShortcut();
              }}
              title="اضغط مطولًا لتبديل النطاق الزمني والعرض التفصيلي"
              data-testid="expense-donut-gesture-zone"
            >
              <svg
                width={DONUT_SIZE}
                height={DONUT_SIZE}
                viewBox={`0 0 ${DONUT_SIZE} ${DONUT_SIZE}`}
                role="img"
                aria-label="مخطط دائري لاتجاهات المصروفات حسب الفئة"
                data-testid="expense-trends-donut-chart"
              >
                <g transform={`translate(${DONUT_SIZE / 2},${DONUT_SIZE / 2})`}>
                  {arcs.map((arc) => (
                    <path
                      key={arc.slice.category}
                      d={arc.path}
                      fill={arc.slice.color}
                      className="exec-donut-slice"
                      onMouseEnter={() => setActiveSliceIndex(arc.index)}
                      onMouseLeave={() => setActiveSliceIndex(null)}
                      onClick={() => {
                        triggerHaptic("light");
                        setActiveSliceIndex((prev) => (prev === arc.index ? null : arc.index));
                      }}
                    />
                  ))}
                </g>
              </svg>
              <div className="exec-donut-center">
                <small>{activeSlice ? activeSlice.category : "الإجمالي"}</small>
                <strong className="exec-tabular">
                  {activeSlice ? `${activeSlice.percentage}%` : formatAmount(data.totalSpend)}
                </strong>
                <span>
                  {activeSlice ? `${formatAmount(activeSlice.total)} ${currency}` : currency}
                </span>
              </div>
              <p className="exec-gesture-hint">اضغط مطولًا على المخطط لتبديل الفترة أو التفصيل</p>
            </div>

            <div className="exec-donut-legend">
              <div className="exec-legend-toolbar">
                <span>التصنيفات المحاسبية ({data.slices.length})</span>
                <button
                  type="button"
                  className="exec-action-link"
                  onClick={() => {
                    triggerHaptic("light");
                    setDetailedView((prev) => !prev);
                  }}
                  data-testid="expense-toggle-detail-btn"
                >
                  {detailedView ? "عرض ملخص" : "عرض تفصيلي"}
                </button>
              </div>
              <ul className="exec-legend-list">
                {data.slices.map((slice, idx) => (
                  <li key={slice.category}>
                    <button
                      type="button"
                      className={`exec-legend-row ${activeSliceIndex === idx ? "active" : ""}`}
                      onClick={() => {
                        triggerHaptic("light");
                        setActiveSliceIndex((prev) => (prev === idx ? null : idx));
                      }}
                    >
                      <span className="exec-legend-name">
                        <i className="exec-legend-dot" style={{ background: slice.color }} />
                        <span>{slice.category}</span>
                      </span>
                      <span className="exec-legend-metrics exec-tabular">
                        <b>{formatAmount(slice.total)} {currency}</b>
                        <small>
                          {slice.percentage}%{detailedView ? ` · ${slice.count} قيد` : ""}
                        </small>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
