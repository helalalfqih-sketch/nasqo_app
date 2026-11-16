import { mkdirSync } from "node:fs";
import { expect, test, type Locator, type Page } from "@playwright/test";

test.use({ viewport: { width: 1400, height: 1200 }, deviceScaleFactor: 1, channel: "chrome" });

function observePreview(page: Page) {
  const errors: string[] = [];
  const externalRequests: string[] = [];
  const writeRequests: string[] = [];
  let fileChoosers = 0;
  let downloads = 0;
  let popups = 0;
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  page.on("filechooser", () => { fileChoosers += 1; });
  page.on("download", () => { downloads += 1; });
  page.on("popup", () => { popups += 1; });
  page.on("request", request => {
    const url = new URL(request.url());
    if (/^https?:$/.test(url.protocol) && !["127.0.0.1", "localhost"].includes(url.hostname)) {
      externalRequests.push(`${request.method()} ${url.origin}${url.pathname}`);
    }
    if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method())) writeRequests.push(`${request.method()} ${url.pathname}`);
  });
  return {
    assertSafe() {
      expect(errors).toEqual([]);
      expect(externalRequests).toEqual([]);
      expect(writeRequests).toEqual([]);
      expect(fileChoosers).toBe(0);
      expect(downloads).toBe(0);
      expect(popups).toBe(0);
    },
  };
}

async function expectRestingRoute(page: Page) {
  await expect(page.getByTestId("keyboard-dock")).toHaveAttribute("data-visible", "false");
  const bounds = await page.getByTestId("device-screen").boundingBox();
  if (!bounds) throw new Error("Missing device bounds");
  await expect(page.getByTestId("flow-current")).toHaveCount(1);
  await expect.poll(async () => (await page.getByTestId("flow-fixed-header").boundingBox())?.y).toBeCloseTo(bounds.y, 0);
  await expect.poll(async () => (await page.getByTestId("flow-current").boundingBox())?.x).toBeCloseTo(bounds.x, 0);
}

async function capture(page: Page, name: string) {
  mkdirSync("qa", { recursive: true });
  await page.mouse.move(1300, 1100);
  await page.waitForTimeout(1000);
  const screen = page.getByTestId("device-screen");
  const bounds = await screen.boundingBox();
  expect(bounds?.width).toBe(393);
  expect(bounds?.height).toBe(852);
  await screen.screenshot({ path: `qa/implementation-${name}-v7.png` });
}

async function alignDrawerItem(item: Locator, offset = 0) {
  await item.evaluate((element, topOffset) => {
    const scroller = element.closest<HTMLElement>(".mobile-scroll");
    if (!scroller) throw new Error("Missing drawer scroll surface");
    scroller.scrollTop += element.getBoundingClientRect().top - scroller.getBoundingClientRect().top - topOffset;
  }, offset);
}

test("seventh drawer backup and about states keep preview actions local", async ({ page }) => {
  test.setTimeout(60_000);
  const observed = observePreview(page);
  await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle" });
  await page.getByLabel("فتح القائمة", { exact: true }).click();
  const drawer = page.getByLabel("قائمة نسقو", { exact: true });
  await expect(drawer).toBeVisible();
  const backup = drawer.getByRole("button", { name: "حفظ نسخة احتياطية على الهاتف", exact: true });
  await alignDrawerItem(backup);
  const drawerScroll = drawer.locator(".drawer-scroll .mobile-scroll");
  const backupTop = (await backup.boundingBox())?.y;
  expect(backupTop).toBeCloseTo((await drawerScroll.boundingBox())!.y, 0);
  await expect(drawer.getByRole("button", { name: "حفظ نسخة احتياطية على التليجرام", exact: true })).toBeInViewport();
  await expect(drawer.getByRole("button", { name: "استعادة الصور من جوجل درايف", exact: true })).toBeInViewport();
  await capture(page, "drawer-backup");

  await alignDrawerItem(drawer.getByRole("button", { name: "مشاركة مجلد الصور", exact: true }));
  const about = drawer.locator(".drawer-sections > section").filter({ has: page.getByRole("heading", { name: "عن التطبيق", exact: true }) });
  await expect(about.getByRole("button")).toHaveText([
    "شرح عن التطبيق على اليوتيوب", "شروط الخدمة", "سياسة الخصوصية", "تواصل معنا", "تحديث التطبيق", "مشاركة التطبيق", "عن التطبيق", "قيم التطبيق",
  ]);
  await expect(about.getByRole("button", { name: "قيم التطبيق", exact: true })).toBeInViewport();
  await capture(page, "drawer-about");

  for (const label of ["حفظ نسخة احتياطية على التليجرام", "مشاركة مجلد الصور", "استعادة الصور من جوجل درايف", "تواصل معنا", "تحديث التطبيق"]) {
    const action = drawer.getByRole("button", { name: label, exact: true });
    await alignDrawerItem(action, 150);
    await action.click();
    await expect(drawer).toBeHidden();
    await expect(page.getByRole("status")).toContainText(/معاينة|تجريب/);
    await page.getByLabel("فتح القائمة", { exact: true }).click();
    await expect(drawer).toBeVisible();
  }
  observed.assertSafe();
});

test("purchases export and scrolled cash operations preserve supplier context", async ({ page }) => {
  test.setTimeout(85_000);
  const observed = observePreview(page);
  await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle" });
  await page.locator(".metric-card").filter({ hasText: "المشتريات" }).click();
  await expect(page.getByTestId("purchases-screen")).toBeVisible();
  await expectRestingRoute(page);
  await page.getByLabel("تصدير المشتريات", { exact: true }).click();
  const exportOptions = page.getByLabel("خيارات التصدير", { exact: true });
  await expect(exportOptions.getByRole("button")).toHaveText([
    "طباعة كملف PDF", "مشاركة كملف PDF", "تصدير إلى ملف إكسل", "مشاركة كملف إكسل", "استيراد الحسابات من ملف إكسل",
  ]);
  await capture(page, "purchases-export");
  await exportOptions.getByRole("button", { name: "استيراد الحسابات من ملف إكسل", exact: true }).click();
  await expect(page.getByRole("status")).toContainText(/معاينة|تجريب/);
  await expect(page.getByRole("status")).toBeHidden();
  await expectRestingRoute(page);
  const cashVendorName = "نقـد هلال";
  await page.locator(".vendor-card").filter({ hasText: cashVendorName }).locator(".vendor-open").click();
  const statement = page.getByTestId("cash-statement-screen");
  await expect(statement).toBeVisible();
  await expectRestingRoute(page);
  await expect(statement.locator(".cash-statement-row")).toHaveCount(17);
  const extended = statement.locator('.cash-statement-row[data-transaction-id="588"], .cash-statement-row[data-transaction-id="508"], .cash-statement-row[data-transaction-id="471"], .cash-statement-row[data-transaction-id="431"], .cash-statement-row[data-transaction-id="390"], .cash-statement-row[data-transaction-id="375"]');
  await expect(extended.locator(".cash-statement-amount")).toHaveText(["8,000", "19,000", "3,000", "40,000", "12,500", "4,500"]);
  await expect(extended.locator(".cash-statement-balance")).toHaveText(["0", "0", "0", "0", "0", "0"]);
  const filtersBefore = await page.getByTestId("cash-statement-filters").boundingBox();
  const headingBefore = await statement.locator(".cash-statement-table-heading").boundingBox();
  const footerBefore = await page.getByTestId("flow-fixed-footer").boundingBox();
  const clippedRow = statement.locator('[data-transaction-id="607"]');
  await clippedRow.evaluate(element => {
    const scroller = element.closest<HTMLElement>(".mobile-scroll");
    if (!scroller) throw new Error("Missing cash scroll surface");
    scroller.scrollTop += element.getBoundingClientRect().bottom - scroller.getBoundingClientRect().top - 47;
  });
  const cashScroll = statement.locator(".cash-statement-scroll .mobile-scroll");
  const scrollBox = await cashScroll.boundingBox();
  if (!scrollBox) throw new Error("Missing cash scroll bounds");
  expect((await clippedRow.boundingBox())!.y).toBeLessThan(scrollBox.y);
  await expect(statement.locator('[data-transaction-id="588"]')).toBeInViewport();
  expect((await page.getByTestId("cash-statement-filters").boundingBox())?.y).toBeCloseTo(filtersBefore!.y, 0);
  expect((await statement.locator(".cash-statement-table-heading").boundingBox())?.y).toBeCloseTo(headingBefore!.y, 0);
  expect((await page.getByTestId("flow-fixed-footer").boundingBox())?.y).toBeCloseTo(footerBefore!.y, 0);
  const menu = page.getByTestId("cash-operations-menu");
  const openMenu = async () => {
    await expectRestingRoute(page);
    await page.getByLabel("خيارات الرصيد", { exact: true }).click();
    await expect(menu).toBeVisible();
  };
  await openMenu();
  await expect(menu.getByRole("menuitem")).toHaveText([
    "فاتورة جديدة", "مردود جديد", "حوالة جديدة", "صرف عملات", "عرض سعر", "طلبية جديدة",
  ]);
  const menuBounds = await menu.boundingBox();
  const screenBounds = await page.getByTestId("device-screen").boundingBox();
  if (!menuBounds || !screenBounds || !footerBefore) throw new Error("Missing cash menu bounds");
  expect(menuBounds.x).toBeLessThanOrEqual(screenBounds.x + 10);
  expect(menuBounds.y + menuBounds.height).toBeLessThanOrEqual(footerBefore.y);
  await capture(page, "cash-menu");

  for (const label of ["فاتورة جديدة", "مردود جديد", "عرض سعر", "طلبية جديدة"]) {
    if (label !== "فاتورة جديدة") await openMenu();
    await menu.getByRole("menuitem", { name: label, exact: true }).click();
    const invoice = page.getByTestId("invoice-modal");
    await expect(invoice).toBeVisible();
    await expect(invoice.getByRole("heading")).toHaveText(label);
    await expect(invoice.getByLabel("حساب الفاتورة", { exact: true })).toHaveValue(cashVendorName);
    await expect(invoice.getByRole("radio", { name: "نقدي", exact: true })).toBeChecked();
    await expect(invoice.getByRole("radio", { name: "فاتورة شراء", exact: true })).toBeChecked();
    await invoice.getByRole("button", { name: "إلغاء", exact: true }).click();
  }
  await openMenu();
  await menu.getByRole("menuitem", { name: "حوالة جديدة", exact: true }).click();
  await expect(page.getByTestId("transaction-modal")).toContainText(cashVendorName);
  await page.getByTestId("transaction-modal").getByRole("button", { name: "إلغاء", exact: true }).click();
  await openMenu();
  await menu.getByRole("menuitem", { name: "صرف عملات", exact: true }).click();
  await expect(page.getByTestId("currency-screen").locator(".currency-account-select")).toContainText(cashVendorName);
  await expectRestingRoute(page);
  await page.getByLabel("رجوع", { exact: true }).click();
  await expect(statement).toBeVisible();
  await expectRestingRoute(page);
  await page.getByLabel("تحويل الرصيد", { exact: true }).click();
  await expect(page.getByTestId("simple-entry-screen")).toBeVisible();
  await expectRestingRoute(page);
  await expect(page.getByTestId("simple-entry-to-account")).toHaveValue(cashVendorName);
  await page.getByTestId("simple-entry-cancel").click();
  await expect(statement).toBeVisible();
  observed.assertSafe();
});

test("simple entry searches, swaps and validates a local preview without persistence", async ({ page }) => {
  test.setTimeout(75_000);
  const observed = observePreview(page);
  await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "قيد بسيط", exact: true }).click();
  const entry = page.getByTestId("simple-entry-screen");
  await expect(entry).toBeVisible();
  await expectRestingRoute(page);
  await expect(page.getByTestId("flow-fixed-header")).toContainText("قيد بسيط");
  const from = page.getByTestId("simple-entry-from-account");
  const to = page.getByTestId("simple-entry-to-account");
  const fromSearch = page.getByTestId("simple-entry-from-search");
  const toSearch = page.getByTestId("simple-entry-to-search");
  const amount = page.getByTestId("simple-entry-amount");
  const save = page.getByTestId("simple-entry-save");
  const blurTextField = async () => {
    await page.getByTestId("flow-fixed-header").getByText("قيد بسيط", { exact: true }).click();
    await expectRestingRoute(page);
  };
  await expect(from).toHaveValue("البراري للتوريد");
  await expect(to).toHaveValue("نقـد هلال");
  await expect(to.locator("option:checked")).toHaveText("مشتريات نقد هلال");
  await capture(page, "simple-entry");

  await save.click();
  await expect(entry.getByRole("alert")).toContainText(/مبلغ|المبلغ/);
  await fromSearch.fill("الواحة");
  await expect(page.getByTestId("keyboard-dock")).toHaveAttribute("data-visible", "true");
  await from.focus();
  await expectRestingRoute(page);
  await expect(from.locator("option").filter({ hasText: "الواحة التجارية" })).toHaveCount(1);
  await expect(from.locator("option").filter({ hasText: "البراري للتوريد" })).toHaveCount(0);
  await from.selectOption("الواحة التجارية");
  await expect(fromSearch).toHaveValue("");
  await fromSearch.fill("الواحة");
  await toSearch.fill("هلال");
  await expect(page.getByTestId("keyboard-dock")).toHaveAttribute("data-visible", "true");
  await blurTextField();
  await to.selectOption("نقـد هلال");
  await expect(toSearch).toHaveValue("");
  await toSearch.fill("هلال");
  await blurTextField();
  await page.getByTestId("simple-entry-swap").click();
  await expect(from).toHaveValue("نقـد هلال");
  await expect(to).toHaveValue("الواحة التجارية");
  await expect(fromSearch).toHaveValue("هلال");
  await expect(toSearch).toHaveValue("الواحة");
  await fromSearch.fill("حساب غير موجود 991");
  await blurTextField();
  await expect(entry).toContainText(/لا توجد.*حساب|لا يوجد.*حساب/);
  await page.getByTestId("simple-entry-from-clear").click();
  await expect(fromSearch).toHaveValue("");
  await expect(from).toHaveValue("");
  await save.click();
  await expect(entry.getByRole("alert")).toContainText(/حساب/);
  await from.selectOption("الواحة التجارية");
  await amount.fill("25");
  await blurTextField();
  await save.click();
  await expect(entry.getByRole("alert")).toContainText(/مختلف|نفس/);
  await page.getByTestId("simple-entry-from-clear").click();
  await from.selectOption("البراري للتوريد");
  await amount.fill("-1");
  await blurTextField();
  await save.click();
  await expect(entry.getByRole("alert")).toContainText(/مبلغ|المبلغ/);
  await amount.fill("125.50");
  await page.getByTestId("simple-entry-note").fill("قيد تجريبي محلي للمراجعة");
  await page.getByTestId("simple-entry-document").fill("DEMO-007");
  await expect(page.getByTestId("keyboard-dock")).toHaveAttribute("data-visible", "true");
  await blurTextField();
  await save.click();
  await expect(entry.getByRole("status")).toContainText(/معاينة|تجريب/);
  await expect(entry.getByRole("status")).toContainText(/لم.*حفظ|غير محفوظ|دون.*حفظ/);
  await expect(entry).toBeVisible();
  await page.getByTestId("simple-entry-cancel").click();
  await expect(page.getByTestId("dashboard-screen")).toBeVisible();
  await expectRestingRoute(page);
  await page.getByRole("button", { name: "قيد بسيط", exact: true }).click();
  await expect(entry).toBeVisible();
  await expectRestingRoute(page);
  await expect(amount).toHaveValue("");
  await expect(page.getByTestId("simple-entry-document")).toHaveValue("");
  await expect(from).toHaveValue("البراري للتوريد");
  await expect(to).toHaveValue("نقـد هلال");
  observed.assertSafe();
});
