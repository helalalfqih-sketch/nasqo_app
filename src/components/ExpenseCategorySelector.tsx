import { useState } from "react";
import { MagicWandIcon } from "@radix-ui/react-icons";
import { inferExpenseCategory, normalizeExpenseCategory } from "../accounting";
import { EXPENSE_CATEGORIES, type AccountCategory, type ExpenseCategory } from "../types";
import { triggerHaptic } from "../utils/haptics";

interface ExpenseCategorySelectorProps {
  value: string;
  onChange: (category: string) => void;
  description: string;
  vendorName: string;
  accountCategory?: AccountCategory;
  amount?: string;
  currency?: string;
  entryType?: string;
}

export function ExpenseCategorySelector({
  value,
  onChange,
  description,
  vendorName,
  accountCategory,
  amount,
  currency,
  entryType,
}: ExpenseCategorySelectorProps) {
  const [loading, setLoading] = useState(false);
  const [aiNote, setAiNote] = useState("");
  const [aiError, setAiError] = useState("");

  const handleSuggest = async () => {
    setAiError("");
    setAiNote("");
    if (!description.trim() && !vendorName.trim()) {
      setAiError("أدخل البيان أو اسم الحساب أولًا لاقتراح التصنيف.");
      return;
    }

    triggerHaptic("light");
    setLoading(true);
    try {
      const response = await fetch("/api/ai/categorize-expense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: description.trim(),
          vendorName: vendorName.trim(),
          amount,
          currency,
          entryType,
        }),
      });
      const payload = (await response.json()) as {
        category?: string;
        confidence?: number;
        reason?: string;
        error?: string;
      };

      if (!response.ok) {
        const localFallback = inferExpenseCategory(description, vendorName, accountCategory);
        onChange(localFallback);
        setAiError(
          payload.error ||
            "تعذر الاتصال بخدمة التصنيف الذكي حاليًا — تم تطبيق تصنيف مبدئي تلقائيًا.",
        );
        triggerHaptic("warning");
        return;
      }

      const validCategory =
        normalizeExpenseCategory(payload.category) ??
        inferExpenseCategory(description, vendorName, accountCategory);
      onChange(validCategory);
      triggerHaptic("success");
      setAiNote(
        `اقتراح الذكاء الاصطناعي (${payload.confidence ?? 90}%): ${payload.reason || validCategory}`,
      );
    } catch {
      const localFallback = inferExpenseCategory(description, vendorName, accountCategory);
      onChange(localFallback);
      setAiError("تعذر الوصول لخادم التصنيف الذكي — تم اقتراح تصنيف محلي.");
      triggerHaptic("warning");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-category-box" data-testid="expense-category-selector">
      <div className="ai-category-row">
        <label className="ai-category-label">
          <span>التصنيف المحاسبي</span>
          <select
            aria-label="التصنيف المحاسبي للمصروف أو العملية"
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setAiNote("");
              setAiError("");
            }}
          >
            <option value="">تلقائي حسب البيان</option>
            {EXPENSE_CATEGORIES.map((cat: ExpenseCategory) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="ai-suggest-btn"
          disabled={loading}
          onClick={handleSuggest}
          data-testid="ai-categorize-btn"
        >
          <MagicWandIcon />
          <span>{loading ? "جاري التحليل..." : "تصنيف ذكي"}</span>
        </button>
      </div>
      {aiNote ? (
        <p className="ai-category-note" role="status">
          {aiNote}
        </p>
      ) : null}
      {aiError ? (
        <p className="ai-category-error" role="status">
          {aiError}
        </p>
      ) : null}
    </div>
  );
}
