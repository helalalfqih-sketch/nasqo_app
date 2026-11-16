import { mkdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

test.use({ viewport: { width: 1400, height: 1200 }, deviceScaleFactor: 1, channel: "chrome" });

function observeDemo(page: Page) {
  const browserErrors: string[] = [];
  const externalRequests: string[] = [];
  let fileChoosers = 0;
  page.on("console", message => { if (message.type() === "error") browserErrors.push(message.text()); });
  page.on("pageerror", error => browserErrors.push(error.message));
  page.on("filechooser", () => { fileChoosers += 1; });
  page.on("request", request => {
    const url = new URL(request.url());
    if (/^https?:$/.test(url.protocol) && !["127.0.0.1", "localhost"].includes(url.hostname)) {
      externalRequests.push(`${request.method()} ${url.origin}${url.pathname}`);
    }
  });
  return { browserErrors, externalRequests, fileChoosers: () => fileChoosers };
}

async function capture(page: Page, name: string) {
  mkdirSync("qa", { recursive: true });
  await page.mouse.move(1300, 1100);
  await page.waitForTimeout(500);
  const screen = page.getByTestId("device-screen");
  const bounds = await screen.boundingBox();
  expect(bounds?.width).toBe(393);
  expect(bounds?.height).toBe(852);
  await screen.screenshot({ path: `qa/implementation-${name}.png` });
}

test("dashboard additions and searchable account picker reference states", async ({ page }) => {
  test.setTimeout(60_000);
  const observed = observeDemo(page);
  await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle" });
  await expect(page.getByTestId("dashboard-screen")).toBeVisible();

  await page.getByLabel("إضافة", { exact: true }).click();
  const menu = page.getByTestId("dashboard-add-menu");
  await expect(menu).toBeVisible();
  await expect(menu.getByRole("menuitem")).toHaveCount(9);
  await capture(page, "dashboard-add-menu");
  await menu.getByRole("menuitem", { name: "إضافة حساب جديد", exact: true }).click();
  await expect(menu).toBeHidden();
  const compactAccount = page.getByTestId("account-form-compact");
  await expect(compactAccount).toBeVisible();
  await capture(page, "account-compact-v4");
  await compactAccount.getByRole("checkbox", { name: "قيد تسوية", exact: true }).check();
  await expect(compactAccount.getByRole("checkbox", { name: "قيد تسوية", exact: true })).toBeChecked();
  await compactAccount.getByRole("button", { name: "إلغاء", exact: true }).click();

  await page.getByRole("button", { name: "كشف حساب", exact: true }).click();
  const picker = page.getByTestId("account-picker-modal");
  await expect(picker).toBeVisible();
  await capture(page, "account-picker-v4");
  await picker.getByTestId("account-picker-search-input").fill("الواحة");
  await page.keyboard.press("Escape");
  const matchingOption = picker.getByRole("option", { name: "الواحة التجارية", exact: true });
  await expect(matchingOption).toBeVisible();
  await expect(picker.getByRole("option")).toHaveCount(1);
  await matchingOption.click();
  await picker.getByRole("button", { name: "موافق", exact: true }).click();
  await expect(picker).toBeHidden();
  await expect(page.getByTestId("supplier-screen")).toBeVisible();
  await expect(page.getByTestId("flow-fixed-header")).toContainText("الواحة التجارية");
  await page.getByLabel("رجوع", { exact: true }).click();
  await expect(page.getByTestId("dashboard-screen")).toBeVisible();

  await page.getByLabel("إضافة", { exact: true }).click();
  await menu.getByRole("menuitem", { name: "تعديل بيانات حساب", exact: true }).click();
  await expect(picker.getByRole("heading")).toHaveText("تعديل بيانات حساب");
  await picker.getByRole("button", { name: "موافق", exact: true }).click();
  await expect(compactAccount.getByLabel("اسم الحساب الجديد", { exact: true })).toHaveValue("الواحة التجارية");
  await compactAccount.getByRole("button", { name: "إلغاء", exact: true }).click();

  expect(observed.browserErrors).toEqual([]);
  expect(observed.externalRequests).toEqual([]);
  expect(observed.fileChoosers()).toBe(0);
});

test("purchases exports and scrolled supplier operation reference states", async ({ page }) => {
  test.setTimeout(60_000);
  const observed = observeDemo(page);
  await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle" });
  await page.locator(".metric-card").filter({ hasText: "المشتريات" }).click();
  await expect(page.getByTestId("purchases-screen")).toBeVisible();
  await page.getByLabel("تصدير المشتريات", { exact: true }).click();
  const exportMenu = page.getByTestId("export-menu");
  const exportOptions = page.getByLabel("خيارات التصدير");
  await expect(exportMenu).toBeVisible();
  await expect(exportOptions.getByRole("button")).toHaveCount(5);
  await expect(exportOptions.getByText(/مصادقة الرصيد/)).toHaveCount(0);
  await capture(page, "purchases-export");
  await exportOptions.getByRole("button", { name: "استيراد الحسابات من ملف إكسل", exact: true }).click();
  await expect(exportMenu).toBeHidden();
  await expect(page.getByRole("status")).toContainText(/معاينة|تجريبي/);
  expect(observed.fileChoosers()).toBe(0);
  await expect(page.getByRole("status")).toBeHidden();

  const filters = page.getByTestId("purchases-filter-panel");
  const filterBefore = await filters.boundingBox();
  const listBounds = await page.locator(".purchases-list-scroll").boundingBox();
  const footerBounds = await page.getByTestId("flow-fixed-footer").boundingBox();
  expect(listBounds).not.toBeNull();
  expect(footerBounds).not.toBeNull();
  if (listBounds && footerBounds) expect(listBounds.y + listBounds.height).toBeLessThanOrEqual(footerBounds.y + 1);
  const targetName = "علي بابا صنعا";
  const targetAction = page.getByRole("button", { name: `عمليات ${targetName}`, exact: true });
  const targetBefore = await targetAction.boundingBox();
  const screenBounds = await page.getByTestId("device-screen").boundingBox();
  expect(filterBefore).not.toBeNull();
  expect(targetBefore).not.toBeNull();
  expect(screenBounds).not.toBeNull();
  if (!filterBefore || !targetBefore || !screenBounds) throw new Error("Missing purchase-list geometry");
  await page.mouse.move(screenBounds.x + screenBounds.width * 0.6, screenBounds.y + 600);
  await page.mouse.wheel(0, Math.max(1, targetBefore.y - (filterBefore.y + filterBefore.height + 150)));
  await expect(targetAction).toBeInViewport();
  await expect.poll(async () => (await filters.boundingBox())?.y).toBeCloseTo(filterBefore.y, 0);
  const targetAfter = await targetAction.boundingBox();
  expect(targetAfter?.y).toBeLessThan(targetBefore.y - 40);

  await targetAction.click();
  const operations = page.getByTestId("vendor-operations-menu");
  await expect(operations).toBeVisible();
  await expect(operations.getByRole("menuitem")).toHaveText([
    "فاتورة جديدة", "مردود جديد", "حوالة جديدة", "صرف عملات", "عرض سعر", "طلبية جديدة",
  ]);
  await capture(page, "vendor-operations");
  await operations.getByRole("menuitem", { name: "فاتورة جديدة", exact: true }).click();
  await expect(operations).toBeHidden();
  const invoice = page.getByTestId("invoice-modal");
  await expect(invoice).toBeVisible();
  await expect(invoice.getByLabel("حساب الفاتورة", { exact: true })).toHaveValue(targetName);
  await invoice.getByRole("button", { name: "إلغاء", exact: true }).click();
  await expect(page.getByTestId("purchases-screen")).toBeVisible();

  expect(observed.browserErrors).toEqual([]);
  expect(observed.externalRequests).toEqual([]);
  expect(observed.fileChoosers()).toBe(0);
});
