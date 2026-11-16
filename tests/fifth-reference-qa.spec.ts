import { mkdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

test.use({ viewport: { width: 1400, height: 1200 }, deviceScaleFactor: 1, channel: "chrome" });

function observePreview(page: Page) {
  const errors: string[] = [];
  const externalRequests: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  page.on("request", request => {
    const url = new URL(request.url());
    if (/^https?:$/.test(url.protocol) && !["localhost", "127.0.0.1"].includes(url.hostname)) {
      externalRequests.push(`${request.method()} ${url.origin}${url.pathname}`);
    }
  });
  return { errors, externalRequests };
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

test("reference dashboard keeps its complete action grid and account cards usable", async ({ page }) => {
  test.setTimeout(40_000);
  const observed = observePreview(page);
  await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle" });
  const dashboard = page.getByTestId("dashboard-screen");
  await expect(dashboard).toBeVisible();
  await expect(dashboard.locator(".quick-action")).toHaveText([
    "سند جديد", "حوالة جديدة", "كشف حساب", "قيد بسيط", "الحركة اليومية", "صناديق النقدية",
    "فاتورة جديدة", "صرف عملات", "البحث السريع",
  ]);
  await expect(dashboard.locator(".metric-copy small")).toHaveText([
    "المبيعات", "المشتريات", "العملاء", "الموظفين", "الحوالات", "المحل", "تمييز ومقاسات", "مقاس جديد",
  ]);
  await expect(dashboard.locator(".metric-copy em")).toHaveCount(0);

  const sales = dashboard.locator(".metric-card").filter({ hasText: "المبيعات" });
  const purchases = dashboard.locator(".metric-card").filter({ hasText: "المشتريات" });
  const salesBox = await sales.boundingBox();
  const purchaseBox = await purchases.boundingBox();
  expect(salesBox).not.toBeNull();
  expect(purchaseBox).not.toBeNull();
  if (salesBox && purchaseBox) {
    expect(salesBox.x).toBeGreaterThan(purchaseBox.x);
    expect(salesBox.y).toBeCloseTo(purchaseBox.y, 0);
  }
  const colors = await Promise.all([sales, purchases].map(card => card.locator("strong").evaluate(element => getComputedStyle(element).color)));
  expect(colors[0]).not.toBe(colors[1]);
  const lastCard = dashboard.locator(".metric-card").last();
  const footer = page.getByTestId("flow-fixed-footer");
  const lastCardBox = await lastCard.boundingBox();
  const footerBox = await footer.boundingBox();
  expect(lastCardBox).not.toBeNull();
  expect(footerBox).not.toBeNull();
  if (lastCardBox && footerBox) expect(lastCardBox.y + lastCardBox.height).toBeLessThan(footerBox.y);
  const floatingAddBox = await page.locator(".dashboard-fab").boundingBox();
  expect(floatingAddBox).not.toBeNull();
  if (floatingAddBox && footerBox && lastCardBox) {
    expect(floatingAddBox.y + floatingAddBox.height).toBeLessThan(footerBox.y);
    expect(floatingAddBox.y).toBeGreaterThan(lastCardBox.y + lastCardBox.height);
  }
  await capture(page, "dashboard-v5");

  await dashboard.getByRole("button", { name: "فاتورة جديدة", exact: true }).click();
  const invoice = page.getByTestId("invoice-modal");
  await expect(invoice).toBeVisible();
  await invoice.getByRole("button", { name: "إلغاء", exact: true }).click();
  await dashboard.locator(".metric-card").filter({ hasText: "المحل" }).click();
  await expect(page.getByTestId("shop-screen")).toBeVisible();
  await page.getByLabel("رجوع", { exact: true }).click();
  await expect(dashboard).toBeVisible();
  expect(observed.errors).toEqual([]);
  expect(observed.externalRequests).toEqual([]);
});

test("reference drawer closes, scrolls and opens WhatsApp and warehouses locally", async ({ page }) => {
  test.setTimeout(50_000);
  const observed = observePreview(page);
  await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle" });
  await page.getByLabel("فتح القائمة", { exact: true }).click();
  const drawer = page.getByLabel("قائمة نسقو", { exact: true });
  await expect(drawer).toBeVisible();
  await expect(drawer.locator(".drawer-sections button").nth(0)).toHaveText("اللغة ومظهر التطبيق");
  const firstItems = await drawer.locator(".drawer-sections button").allTextContents();
  expect(firstItems.slice(0, 9).map(text => text.trim())).toEqual([
    "اللغة ومظهر التطبيق", "الإشعارات", "الرسائل الفورية SMS", "الرسائل الفورية واتساب",
    "التقارير", "عروض الأسعار", "الطلبيات", "سلة المحذوفات", "الإعدادات",
  ]);
  await expect(drawer.locator(".drawer-brand-hero")).toContainText("نسقو برو");
  await capture(page, "drawer-v5");
  const drawerBox = await drawer.boundingBox();
  const headerBox = await page.getByTestId("flow-fixed-header").boundingBox();
  const screenBox = await page.getByTestId("device-screen").boundingBox();
  expect(drawerBox).not.toBeNull();
  expect(headerBox).not.toBeNull();
  expect(screenBox).not.toBeNull();
  if (!drawerBox || !headerBox || !screenBox) throw new Error("Missing drawer geometry");
  expect(drawerBox.y).toBeGreaterThanOrEqual(headerBox.y + headerBox.height - 1);
  expect(drawerBox.width / screenBox.width).toBeGreaterThan(0.83);
  expect(drawerBox.width / screenBox.width).toBeLessThan(0.86);
  expect(drawerBox.x + drawerBox.width).toBeCloseTo(screenBox.x + screenBox.width, 0);

  await page.getByLabel("إغلاق القائمة", { exact: true }).click({ position: { x: 20, y: 250 } });
  await expect(drawer).toBeHidden();
  await page.getByLabel("فتح القائمة", { exact: true }).click();
  await drawer.getByRole("button", { name: "الرسائل الفورية واتساب", exact: true }).click();
  await expect(drawer).toBeHidden();
  await expect(page.getByTestId("whatsapp-settings-screen")).toBeVisible();
  await page.getByLabel("رجوع", { exact: true }).click();
  await expect(page.getByTestId("dashboard-screen")).toBeVisible();

  await page.getByLabel("فتح القائمة", { exact: true }).click();
  await expect(drawer).toBeVisible();
  const scroll = drawer.locator(".drawer-scroll");
  const scrollBox = await scroll.boundingBox();
  if (!scrollBox) throw new Error("Missing drawer scroll surface");
  const headerBefore = await page.getByTestId("flow-fixed-header").boundingBox();
  await page.mouse.move(scrollBox.x + scrollBox.width / 2, scrollBox.y + scrollBox.height / 2);
  await page.mouse.wheel(0, 350);
  const warehouses = drawer.getByRole("button", { name: "المخازن", exact: true });
  await expect(warehouses).toBeInViewport();
  await expect.poll(async () => (await page.getByTestId("flow-fixed-header").boundingBox())?.y).toBeCloseTo(headerBefore!.y, 0);
  await warehouses.click();
  await expect(drawer).toBeHidden();
  await expect(page.getByTestId("warehouses-screen")).toBeVisible();
  expect(observed.errors).toEqual([]);
  expect(observed.externalRequests).toEqual([]);
});
