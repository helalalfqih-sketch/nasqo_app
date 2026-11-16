import { mkdirSync } from "node:fs";
import { expect, test, type Locator, type Page } from "@playwright/test";

test.use({ viewport: { width: 1400, height: 1200 }, deviceScaleFactor: 1, channel: "chrome" });

function observePreview(page: Page) {
  const errors: string[] = [];
  const externalRequests: string[] = [];
  let fileChoosers = 0;
  let downloads = 0;
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  page.on("filechooser", () => { fileChoosers += 1; });
  page.on("download", () => { downloads += 1; });
  page.on("request", request => {
    const url = new URL(request.url());
    if (/^https?:$/.test(url.protocol) && !["127.0.0.1", "localhost"].includes(url.hostname)) {
      externalRequests.push(`${request.method()} ${url.origin}${url.pathname}`);
    }
  });
  return { errors, externalRequests, fileChoosers: () => fileChoosers, downloads: () => downloads };
}

async function capture(page: Page, name: string) {
  mkdirSync("qa", { recursive: true });
  await page.mouse.move(1300, 1100);
  await page.waitForTimeout(1000);
  const screen = page.getByTestId("device-screen");
  const bounds = await screen.boundingBox();
  expect(bounds?.width).toBe(393);
  expect(bounds?.height).toBe(852);
  await screen.screenshot({ path: `qa/implementation-${name}.png` });
}

async function alignDrawerItem(item: Locator, offset = 0) {
  await item.evaluate((element, topOffset) => {
    const scroller = element.closest<HTMLElement>(".mobile-scroll");
    if (!scroller) throw new Error("Drawer item must use the mobile scrolling surface");
    scroller.scrollTop += element.getBoundingClientRect().top - scroller.getBoundingClientRect().top - topOffset;
  }, offset);
}

async function expectRestingPurchases(page: Page) {
  try {
    await expect(page.getByTestId("keyboard-dock")).toHaveAttribute("data-visible", "false");
    const screenBox = await page.getByTestId("device-screen").boundingBox();
    if (!screenBox) throw new Error("Missing device bounds");
    await expect.poll(async () => (await page.getByTestId("flow-fixed-header").boundingBox())?.y).toBeCloseTo(screenBox.y, 0);
    await expect.poll(async () => (await page.getByTestId("flow-current").locator(".purchases-layout").boundingBox())?.x).toBeCloseTo(screenBox.x, 0);
  } catch (error) {
    console.log("Purchases resting-state diagnostic", JSON.stringify(await page.evaluate(() => {
      const active = document.activeElement;
      const describe = (element: Element | null) => element ? {
        tag: element.tagName,
        classes: element.className,
        label: element.getAttribute("aria-label"),
        type: element.getAttribute("type"),
        rect: element.getBoundingClientRect().toJSON(),
        transform: getComputedStyle(element).transform,
      } : null;
      return {
        activeElement: describe(active),
        keyboardVisible: document.querySelector('[data-testid="keyboard-dock"]')?.getAttribute("data-visible"),
        documentScroll: { x: window.scrollX, y: window.scrollY, html: document.documentElement.scrollTop, body: document.body.scrollTop },
        screen: describe(document.querySelector('[data-testid="device-screen"]')),
        header: describe(document.querySelector('[data-testid="flow-fixed-header"]')),
        current: describe(document.querySelector('[data-testid="flow-current"]')),
        purchases: describe(document.querySelector('[data-testid="flow-current"] .purchases-layout')),
        enclosingScroll: ["[data-testid='device-screen']", ".mobile-app-viewport", ".flow-stack"].map(selector => {
          const element = document.querySelector(selector);
          return { selector, scrollTop: element?.scrollTop, scrollLeft: element?.scrollLeft };
        }),
        scrollContainers: Array.from(document.querySelectorAll(".mobile-scroll")).map(element => ({ classes: element.parentElement?.className, scrollTop: element.scrollTop })),
      };
    })));
    await page.getByTestId("device-screen").screenshot({ path: "qa/diagnostic-purchases-v6.png" });
    throw error;
  }
}

test("scrolled drawer reference groups remain local and activation stays reachable", async ({ page }) => {
  test.setTimeout(65_000);
  const observed = observePreview(page);
  await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle" });
  await page.getByLabel("فتح القائمة", { exact: true }).click();
  const drawer = page.getByLabel("قائمة نسقو", { exact: true });
  await expect(drawer).toBeVisible();
  const headerBefore = await page.getByTestId("flow-fixed-header").boundingBox();
  const scroll = drawer.locator(".drawer-scroll .mobile-scroll");
  const scrollBox = await scroll.boundingBox();
  if (!scrollBox) throw new Error("Missing drawer scroll surface");
  await page.mouse.move(scrollBox.x + scrollBox.width / 2, scrollBox.y + scrollBox.height / 2);
  await page.mouse.wheel(0, 500);
  await expect.poll(() => scroll.evaluate(element => element.scrollTop)).toBeGreaterThan(400);

  await expect(drawer.locator(".drawer-sections h3")).toHaveText([
    "المخازن", "الحسابات", "النسخ الاحتياطي", "جوجل درايف", "ملفات الصور المرفقة", "أخرى", "عن التطبيق",
  ]);
  await alignDrawerItem(drawer.getByRole("button", { name: "الإعدادات", exact: true }));
  await capture(page, "drawer-accounts-v6");
  const accountsGroup = drawer.locator(".drawer-sections > section").filter({ has: page.getByRole("heading", { name: "الحسابات", exact: true }) });
  await expect(accountsGroup.getByRole("button")).toHaveText([
    "دليل الحسابات", "العملات", "استيراد الحسابات من ملف إكسل",
  ]);

  await alignDrawerItem(drawer.getByRole("button", { name: "استعادة نسخة احتياطية", exact: true }), -23);
  await capture(page, "drawer-cloud-v6");
  await expect(drawer.getByRole("button", { name: "نسخ مجلد الصور إلى جوجل درايف", exact: true })).toBeInViewport();
  await alignDrawerItem(drawer.getByRole("button", { name: "مشاركة مجلد الصور", exact: true }));
  await capture(page, "drawer-about-v6");
  await expect(drawer.getByRole("button", { name: "قيم التطبيق", exact: true })).toBeInViewport();
  expect((await page.getByTestId("flow-fixed-header").boundingBox())?.y).toBeCloseTo(headerBefore!.y, 0);

  for (const label of ["حفظ نسخة احتياطية على الهاتف", "استعادة نسخة احتياطية من جوجل درايف", "استيراد الحسابات من ملف إكسل"]) {
    const action = drawer.getByRole("button", { name: label, exact: true });
    await alignDrawerItem(action, 150);
    await action.click();
    await expect(drawer).toBeHidden();
    await expect(page.getByRole("status")).toContainText(/معاينة|تجريب/);
    await page.getByLabel("فتح القائمة", { exact: true }).click();
    await expect(drawer).toBeVisible();
  }
  const activation = drawer.getByRole("button", { name: "التفعيل", exact: true });
  await alignDrawerItem(activation, 150);
  await activation.click();
  await expect(drawer).toBeHidden();
  await expect(page.getByTestId("activation-modal")).toBeVisible();
  expect(observed.errors).toEqual([]);
  expect(observed.externalRequests).toEqual([]);
  expect(observed.fileChoosers()).toBe(0);
  expect(observed.downloads()).toBe(0);
});

test("cash supplier keeps cash rows and zero balances separate from credit statements", async ({ page }) => {
  test.setTimeout(55_000);
  const observed = observePreview(page);
  await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle" });
  await page.locator(".metric-card").filter({ hasText: "المشتريات" }).click();
  await expect(page.getByTestId("purchases-screen")).toBeVisible();
  await expectRestingPurchases(page);
  const cashVendor = page.locator(".vendor-card").filter({ hasText: "نقـد هلال" });
  await expect(cashVendor).toHaveAttribute("data-vendor-id", "9");
  await expect(cashVendor.locator(".vendor-count")).toHaveText("44");
  await page.getByLabel("ترتيب المشتريات", { exact: true }).selectOption("name");
  await expect(cashVendor).toHaveAttribute("data-vendor-id", "9");
  await expect(cashVendor.locator(".vendor-count")).toHaveText("44");
  await page.getByLabel("ترتيب المشتريات", { exact: true }).selectOption("date");
  const purchasesFab = page.getByLabel("إضافة مورد أو عملية", { exact: true });
  const purchasesFabBox = await purchasesFab.boundingBox();
  const purchasesFooterBox = await page.getByTestId("flow-fixed-footer").boundingBox();
  if (!purchasesFabBox || !purchasesFooterBox) throw new Error("Missing purchases add button or totals footer");
  expect(purchasesFabBox.y + purchasesFabBox.height).toBeLessThanOrEqual(purchasesFooterBox.y - 10);
  await purchasesFab.click();
  await expect(page.getByTestId("purchase-create-menu")).toBeVisible();
  await purchasesFab.click();
  await expect(page.getByTestId("purchase-create-menu")).toBeHidden();
  await expectRestingPurchases(page);
  await capture(page, "purchases-v6");
  await cashVendor.locator(".vendor-open").click();
  const statement = page.getByTestId("cash-statement-screen");
  await expect(statement).toBeVisible();
  await expect(page.getByTestId("flow-fixed-header")).toContainText("مشتريات نقد هلال");
  await expect(statement).toContainText("20,000");
  await expect(statement).toContainText("17,000");
  await expect(statement).toContainText("29/12/2025");
  await expect(statement.locator(".cash-statement-row")).toHaveCount(17);
  const originalRows = statement.locator(".cash-statement-row:nth-child(-n+6)");
  await expect(originalRows.locator(".cash-statement-amount")).toHaveText(["20,000", "3,000", "17,000", "4,900", "1,500", "1,000"]);
  await expect(originalRows.locator(".cash-statement-balance")).toHaveText(["0", "0", "0", "0", "0", "0"]);
  const amountColor = await statement.locator(".cash-statement-amount").first().evaluate(element => getComputedStyle(element).color);
  const typeColor = await statement.locator(".cash-statement-type").first().evaluate(element => getComputedStyle(element).color);
  expect(amountColor).toBe(typeColor);
  const colorChannels = amountColor.match(/\d+/g)?.map(Number);
  if (!colorChannels) throw new Error("Missing cash amount color");
  expect(colorChannels[2]).toBeGreaterThan(colorChannels[0]);
  expect(colorChannels[2]).toBeGreaterThan(colorChannels[1]);
  const footer = page.getByTestId("flow-fixed-footer");
  await expect(footer).toContainText("1,168,310");
  await expect(page.getByTestId("cash-statement-footer").locator("bdi")).toHaveText(["1,168,310", "1,168,310", "0"]);
  const initialFooterBox = await footer.boundingBox();
  const finalActionsBox = await originalRows.locator(".cash-statement-actions").last().boundingBox();
  if (!initialFooterBox || !finalActionsBox) throw new Error("Missing cash footer or final row actions");
  expect(finalActionsBox.y + finalActionsBox.height).toBeLessThanOrEqual(initialFooterBox.y);
  await capture(page, "cash-statement-v6");

  const cashFilters = page.getByTestId("cash-statement-filters");
  await cashFilters.getByRole("button", { name: "شهري", exact: true }).click();
  await expect(cashFilters.getByRole("button", { name: "شهري", exact: true })).toHaveAttribute("aria-pressed", "true");
  await cashFilters.getByRole("checkbox", { name: "رصيد سابق", exact: true }).check();
  await expect(statement.locator(".cash-statement-previous")).toContainText("0");
  await cashFilters.getByRole("checkbox", { name: "رصيد سابق", exact: true }).uncheck();
  await expect(statement.locator(".cash-statement-previous")).toHaveCount(0);
  await cashFilters.getByLabel("عملة كشف المشتريات النقدية", { exact: true }).click();
  await page.getByTestId("cash-currency-menu").getByRole("option", { name: "جميع العملات بدون مصارفة", exact: true }).click();
  await expect(cashFilters.getByLabel("عملة كشف المشتريات النقدية", { exact: true })).toContainText("جميع العملات بدون مصارفة");
  const filtersBefore = await cashFilters.boundingBox();
  const cashScroll = statement.locator(".cash-statement-scroll .mobile-scroll");
  const scrollBounds = await cashScroll.boundingBox();
  if (!scrollBounds) throw new Error("Missing cash statement scroll surface");
  await page.mouse.move(scrollBounds.x + scrollBounds.width / 2, scrollBounds.y + scrollBounds.height / 2);
  await page.mouse.wheel(0, 160);
  await expect.poll(() => cashScroll.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
  expect((await cashFilters.boundingBox())?.y).toBeCloseTo(filtersBefore!.y, 0);
  const footerBox = await footer.boundingBox();
  const fabBox = await statement.locator(".cash-statement-fab").boundingBox();
  if (!footerBox || !fabBox) throw new Error("Missing cash footer or add button");
  expect(fabBox.y + fabBox.height).toBeLessThanOrEqual(footerBox.y);
  expect(scrollBounds.y + scrollBounds.height).toBeLessThanOrEqual(footerBox.y + 1);

  await page.getByLabel("إضافة سند", { exact: true }).click();
  const transaction = page.getByTestId("transaction-modal");
  await expect(transaction).toBeVisible();
  await expect(transaction).toContainText("نقـد هلال");
  await transaction.getByRole("button", { name: "إلغاء", exact: true }).click();
  await expect(statement).toBeVisible();
  await page.getByLabel("تصدير", { exact: true }).click();
  await expect(page.getByTestId("export-menu")).toBeVisible();
  await page.getByLabel("خيارات التصدير").getByRole("button", { name: "طباعة كملف PDF", exact: true }).click();
  await expect(page.getByRole("status")).toBeVisible();
  await page.getByLabel("رجوع", { exact: true }).click();
  await expect(page.getByTestId("purchases-screen")).toBeVisible();
  await page.locator(".vendor-card").first().locator(".vendor-open").click();
  await expect(page.getByTestId("supplier-screen")).toBeVisible();
  await expect(page.getByTestId("cash-statement-screen")).toHaveCount(0);
  await expect(page.getByTestId("supplier-screen")).toContainText("فاتورة آجلة");
  expect(observed.errors).toEqual([]);
  expect(observed.externalRequests).toEqual([]);
  expect(observed.fileChoosers()).toBe(0);
  expect(observed.downloads()).toBe(0);
});
