import { mkdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

test.use({ viewport: { width: 1400, height: 1200 }, deviceScaleFactor: 1, channel: "chrome" });

function observeDemo(page: Page) {
  const browserErrors: string[] = [];
  const externalRequests: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });
  page.on("pageerror", (error) => browserErrors.push(error.message));
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (/^https?:$/.test(url.protocol) && !["127.0.0.1", "localhost"].includes(url.hostname)) {
      externalRequests.push(`${request.method()} ${url.origin}${url.pathname}`);
    }
  });
  return { browserErrors, externalRequests };
}

async function capture(page: Page, name: string) {
  mkdirSync("qa", { recursive: true });
  await page.mouse.move(1300, 1100);
  await page.waitForTimeout(500);
  await page.getByTestId("device-screen").screenshot({ path: `qa/implementation-${name}.png` });
}

test("account opening balance and invoice reference states", async ({ page }) => {
  test.setTimeout(60_000);
  const observed = observeDemo(page);
  await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle" });
  await expect(page.getByTestId("dashboard-screen")).toBeVisible();

  await page.getByRole("button", { name: "فاتورة جديدة", exact: true }).click();
  const invoice = page.getByTestId("invoice-modal");
  await expect(invoice).toBeVisible();
  await expect(invoice.getByRole("radio", { name: "أصناف", exact: true })).toBeChecked();
  await expect(invoice.getByRole("radio", { name: "آجل", exact: true })).toBeChecked();
  await expect(invoice.getByRole("radio", { name: "فاتورة بيع", exact: true })).toBeChecked();
  await capture(page, "invoice-modal");
  await invoice.getByRole("radio", { name: "نقدي", exact: true }).check();
  await invoice.getByRole("radio", { name: "فاتورة شراء", exact: true }).check();
  await expect(invoice.getByRole("radio", { name: "آجل", exact: true })).not.toBeChecked();
  await expect(invoice.getByRole("radio", { name: "فاتورة بيع", exact: true })).not.toBeChecked();
  await invoice.getByRole("button", { name: "إلغاء", exact: true }).click();
  await expect(invoice).toBeHidden();

  await page.locator(".metric-card").filter({ hasText: "العملاء" }).click();
  await expect(page.getByTestId("shop-screen")).toBeVisible();
  await page.getByRole("button", { name: "إضافة حساب للمحل", exact: true }).click();
  const account = page.getByTestId("account-form-extended");
  await expect(account).toBeVisible();
  await expect(account.getByRole("radio", { name: "SMS", exact: true })).toBeChecked();
  await expect(account.getByRole("radio", { name: "لا ترسل", exact: true })).toBeChecked();
  await expect(page.getByTestId("opening-balance-fields")).toBeHidden();
  await capture(page, "shop-account");

  await account.getByRole("radio", { name: "واتساب", exact: true }).check();
  await account.getByRole("radio", { name: "بعد التأكيد", exact: true }).check();
  await page.getByTestId("opening-balance-toggle").check();
  const openingFields = page.getByTestId("opening-balance-fields");
  await expect(openingFields).toBeVisible();
  await expect(page.getByTestId("opening-balance-note")).toHaveValue("رصيد افتتاحي");
  await expect(openingFields.getByRole("radio", { name: "عليه", exact: true })).toBeChecked();
  await capture(page, "opening-balance");
  await page.getByTestId("opening-balance-amount").fill("1250");
  await expect(page.getByTestId("keyboard-dock")).toHaveAttribute("data-visible", "true");
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("opening-balance-amount")).toHaveValue("1250");
  await page.getByTestId("opening-balance-toggle").uncheck();
  await expect(openingFields).toBeHidden();
  await account.getByRole("button", { name: "إلغاء", exact: true }).click();
  await expect(account).toBeHidden();
  await page.getByLabel("رجوع", { exact: true }).click();
  await expect(page.getByTestId("dashboard-screen")).toBeVisible();

  expect(observed.browserErrors).toEqual([]);
  expect(observed.externalRequests).toEqual([]);
});

test("warehouse creation and inventory report export reference states", async ({ page }) => {
  test.setTimeout(60_000);
  const observed = observeDemo(page);
  await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle" });
  await page.getByLabel("فتح القائمة", { exact: true }).click();
  const warehousesAction = page.getByLabel("قائمة نسقو").getByRole("button", { name: "المخازن", exact: true });
  await warehousesAction.scrollIntoViewIfNeeded();
  await warehousesAction.click();
  await expect(page.getByTestId("warehouses-screen")).toBeVisible();
  await page.getByRole("button", { name: "إضافة مخزن", exact: true }).click();
  const warehouse = page.getByTestId("warehouse-modal");
  await expect(warehouse).toBeVisible();
  await capture(page, "warehouse-modal");
  await warehouse.getByLabel("اسم المخزن", { exact: true }).fill("مخزن المعاينة");
  await page.keyboard.press("Escape");
  await warehouse.getByLabel("تفاصيل المخزن", { exact: true }).fill("مخزن لاختبار النموذج المحلي");
  await page.keyboard.press("Escape");
  await warehouse.getByLabel("اعتماد هذا المخزن كافتراضي", { exact: true }).check();
  await warehouse.getByRole("button", { name: "حفظ", exact: true }).click();
  await expect(warehouse).toBeHidden();
  await expect(page.getByTestId("warehouses-screen").getByText("مخزن المعاينة", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "تقرير حركة مخازن بينون", exact: true }).click();
  const report = page.getByTestId("inventory-report-screen");
  await expect(report).toBeVisible();
  await expect(report.getByText("كمية الشراء", { exact: true })).toBeVisible();
  await capture(page, "inventory-report");
  await page.getByLabel("تصدير", { exact: true }).click();
  await expect(page.getByTestId("export-menu")).toBeVisible();
  const exportOptions = page.getByLabel("خيارات التصدير");
  await expect(exportOptions.getByRole("button")).toHaveCount(4);
  await expect(exportOptions.getByText(/مصادقة الرصيد/)).toHaveCount(0);
  await capture(page, "inventory-export");
  await exportOptions.getByRole("button", { name: "طباعة كملف PDF", exact: true }).click();
  await expect(page.getByTestId("export-menu")).toBeHidden();
  await expect(page.getByRole("status")).toContainText("لم يُنشأ أو يُرسل ملف");
  await expect(report).toBeVisible();
  await page.getByLabel("رجوع", { exact: true }).click();
  await expect(page.getByTestId("warehouses-screen")).toBeVisible();

  expect(observed.browserErrors).toEqual([]);
  expect(observed.externalRequests).toEqual([]);
});
