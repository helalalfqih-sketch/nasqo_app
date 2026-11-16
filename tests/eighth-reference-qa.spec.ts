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
  await expect(page.getByTestId("flow-current")).toHaveCount(1);
  const bounds = await page.getByTestId("device-screen").boundingBox();
  if (!bounds) throw new Error("Missing device bounds");
  await expect.poll(async () => (await page.getByTestId("flow-fixed-header").boundingBox())?.y).toBeCloseTo(bounds.y, 0);
  await expect.poll(async () => (await page.getByTestId("flow-current").boundingBox())?.x).toBeCloseTo(bounds.x, 0);
}

async function openCashStatement(page: Page) {
  await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle" });
  await page.locator(".metric-card").filter({ hasText: "المشتريات" }).click();
  await expect(page.getByTestId("purchases-screen")).toBeVisible();
  await expectRestingRoute(page);
  await page.locator(".vendor-card").filter({ hasText: "نقـد هلال" }).locator(".vendor-open").click();
  await expect(page.getByTestId("cash-statement-screen")).toBeVisible();
  await expectRestingRoute(page);
  return page.getByTestId("cash-statement-screen");
}

async function capturePhone(page: Page, name: string) {
  mkdirSync("qa", { recursive: true });
  await page.mouse.move(1300, 1100);
  await page.waitForTimeout(1000);
  const screen = page.getByTestId("device-screen");
  const bounds = await screen.boundingBox();
  expect(bounds?.width).toBe(393);
  expect(bounds?.height).toBe(852);
  await screen.screenshot({ path: `qa/implementation-${name}-v8.png` });
}

async function alignRowTail(row: Locator, visibleTail: number) {
  await row.evaluate((element, tail) => {
    const scroller = element.closest<HTMLElement>(".mobile-scroll");
    if (!scroller) throw new Error("Missing cash scroll surface");
    scroller.scrollTop += element.getBoundingClientRect().bottom - scroller.getBoundingClientRect().top - tail;
  }, visibleTail);
}

test("cash currency choices retain local selection and disclose empty currencies", async ({ page }) => {
  test.setTimeout(65_000);
  const observed = observePreview(page);
  const statement = await openCashStatement(page);
  const rows = statement.locator(".cash-statement-row");
  await expect(rows).toHaveCount(17);
  await expect(statement.locator('[data-transaction-id="431"] .cash-statement-amount')).toHaveText("40,000");
  await expect(statement.locator('[data-transaction-id="390"] .cash-statement-amount')).toHaveText("12,500");
  await expect(statement.locator('[data-transaction-id="375"] .cash-statement-amount')).toHaveText("4,500");
  await alignRowTail(statement.locator('[data-transaction-id="471"]'), 36);
  const filters = await page.getByTestId("cash-statement-filters").boundingBox();
  const footer = await page.getByTestId("flow-fixed-footer").boundingBox();
  const trigger = page.getByTestId("cash-currency-trigger");
  const menu = page.getByTestId("cash-currency-menu");
  await trigger.click();
  await expect(menu).toBeVisible();
  await expect(menu.getByRole("option")).toHaveText([
    "ريال", "عملة 2", "دولار", "جميع العملات بدون مصارفة", "مصارفة الكل بعملة ريال",
  ]);
  const menuBox = await menu.boundingBox();
  const deviceBox = await page.getByTestId("device-screen").boundingBox();
  if (!menuBox || !deviceBox || !filters || !footer) throw new Error("Missing currency bounds");
  expect(menuBox.width / deviceBox.width).toBeGreaterThan(0.8);
  expect(menuBox.y).toBeGreaterThanOrEqual(filters.y - 2);
  expect(menuBox.y + menuBox.height).toBeLessThan(footer.y);
  await capturePhone(page, "cash-currency");

  for (const choice of ["دولار", "عملة 2", "جميع العملات بدون مصارفة", "مصارفة الكل بعملة ريال", "ريال"]) {
    if (!(await menu.isVisible())) await trigger.click();
    await menu.getByRole("option", { name: choice, exact: true }).click();
    await expect(menu).toBeHidden();
    await expect(trigger).toContainText(choice);
    if (["دولار", "عملة 2"].includes(choice)) {
      await expect(rows).toHaveCount(0);
      await expect(statement).toContainText(/لا توجد|لا يوجد/);
    } else {
      await expect(rows).toHaveCount(17);
      await expect(rows.first().locator(".cash-statement-amount")).toHaveText("20,000");
    }
  }
  expect((await page.getByTestId("cash-statement-filters").boundingBox())?.y).toBeCloseTo(filters.y, 0);
  expect((await page.getByTestId("flow-fixed-footer").boundingBox())?.y).toBeCloseTo(footer.y, 0);
  await expectRestingRoute(page);
  observed.assertSafe();
});

test("cash search exposes nine modes and filters only available local metadata", async ({ page }) => {
  test.setTimeout(75_000);
  const observed = observePreview(page);
  const statement = await openCashStatement(page);
  const rows = statement.locator(".cash-statement-row");
  const scroll = statement.locator(".cash-statement-scroll .mobile-scroll");
  await scroll.evaluate(element => { element.scrollTop = element.scrollHeight; });
  await expect(statement.locator('[data-transaction-id="16"] .cash-statement-actions')).toBeInViewport();
  await page.getByLabel("بحث", { exact: true }).click();
  const menu = page.getByTestId("cash-search-menu");
  const criteria = ["الكل", "الرقم", "البيان", "رقم المستند", "اسم المرسل", "اسم المستلم", "اسم الشركة", "المبلغ عليه", "المبلغ له"];
  await expect(menu.getByRole("menuitem")).toHaveText(criteria.map(item => `البحث بواسطة ${item}`));
  await capturePhone(page, "cash-search");
  const query = page.getByTestId("cash-search-input");
  const chooseMode = async (mode: string) => {
    if (!(await menu.isVisible())) await page.getByLabel("بحث", { exact: true }).click();
    await expect(page.getByTestId("keyboard-dock")).toHaveAttribute("data-visible", "false");
    await menu.getByRole("menuitem", { name: `البحث بواسطة ${mode}`, exact: true }).click();
    await expect(menu).toBeHidden();
    await expect(query).toBeVisible();
  };
  const blurQuery = async () => {
    await page.getByTestId("flow-fixed-header").getByText("مشتريات نقد هلال", { exact: true }).click();
    await expectRestingRoute(page);
  };
  await chooseMode("الرقم");
  await query.fill("1140");
  await blurQuery();
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toHaveAttribute("data-transaction-id", "1140");
  await page.getByTestId("cash-search-clear").click();
  await expect(query).toHaveValue("");
  await expect(rows).toHaveCount(17);
  await chooseMode("البيان");
  await query.fill("بطارية");
  await blurQuery();
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toHaveAttribute("data-transaction-id", "1140");
  await query.fill("غير موجود 991");
  await blurQuery();
  await expect(rows).toHaveCount(0);
  await expect(statement).toContainText(/لا توجد|لا يوجد/);
  await chooseMode("رقم المستند");
  await query.fill("1140");
  await blurQuery();
  await expect(rows).toHaveCount(0);
  await chooseMode("الكل");
  await query.fill("٢٠٠٠٠");
  await blurQuery();
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toHaveAttribute("data-transaction-id", "1218");
  await chooseMode("اسم الشركة");
  await query.fill("نسقو");
  await blurQuery();
  await expect(rows).toHaveCount(17);
  await chooseMode("المبلغ عليه");
  await query.fill("20,000");
  await blurQuery();
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toHaveAttribute("data-transaction-id", "1218");
  await page.getByTestId("cash-search-close").click();
  await expect(query).toBeHidden();
  await expect(rows).toHaveCount(17);
  await expectRestingRoute(page);
  observed.assertSafe();
});

test("cash invoice preview preserves item totals and contained document zoom", async ({ page, context }) => {
  test.setTimeout(65_000);
  const observed = observePreview(page);
  const statement = await openCashStatement(page);
  await statement.getByLabel("ملف PDF للعملية #1140", { exact: true }).click();
  const preview = page.getByTestId("cash-invoice-screen");
  const document = page.getByTestId("cash-invoice-document");
  await expect(preview).toBeVisible();
  try {
    await expectRestingRoute(page);
  } catch (error) {
    console.log("Invoice resting diagnostic", JSON.stringify(await page.evaluate(() => {
      const info = (selector: string) => {
        const element = window.document.querySelector<HTMLElement>(selector);
        return element ? { rect: element.getBoundingClientRect().toJSON(), scrollLeft: element.scrollLeft, scrollTop: element.scrollTop, clientWidth: element.clientWidth, scrollWidth: element.scrollWidth, transform: getComputedStyle(element).transform } : null;
      };
      return { screen: info('[data-testid="device-screen"]'), viewport: info(".mobile-app-viewport"), stack: info(".flow-stack"), scenes: info(".flow-scenes"), route: info('[data-testid="flow-current"]'), pan: info('[data-testid="cash-invoice-pan"]'), document: info('[data-testid="cash-invoice-document"]'), activeElement: { tag: window.document.activeElement?.tagName, label: window.document.activeElement?.getAttribute("aria-label") } };
    })));
    await page.getByTestId("device-screen").screenshot({ path: "qa/diagnostic-cash-invoice-v8.png" });
    throw error;
  }
  await expect(document).toContainText("فاتورة شراء نقدي");
  await expect(document).toContainText("1140");
  await expect(document).toContainText("مشتريات نقد هلال");
  await expect(document).toContainText("نسقو");
  await expect(document.locator("tbody tr")).toHaveCount(2);
  await expect(document.locator("tbody tr").first()).toContainText("توصيلة تايب سي 2 متر");
  await expect(document.locator("tbody tr").last()).toContainText("بطارية جهاز كشف الذهب");
  for (const row of await document.locator("tbody tr").all()) {
    await expect(row.locator("td")).toHaveText([/./, "حبة", "1", "1,500", "1,500"]);
  }
  await expect(document).toContainText("3,000");
  await expect(document).toContainText(/ثلاثة\s+(ألف|آلاف|الف)\s+ريال/);
  await expect(document.getByTestId("cash-invoice-quantity-total")).toHaveText("2");
  await expect(document.getByTestId("cash-invoice-grand-total")).toHaveText("3,000");
  const fitBox = await document.boundingBox();
  const phoneBox = await page.getByTestId("device-screen").boundingBox();
  if (!fitBox || !phoneBox) throw new Error("Missing invoice document bounds");
  expect(fitBox.width).toBeLessThanOrEqual(phoneBox.width);
  const fitPan = await page.getByTestId("cash-invoice-pan").evaluate(element => ({ clientWidth: element.clientWidth, scrollWidth: element.scrollWidth, left: element.getBoundingClientRect().left, scrollLeft: element.scrollLeft }));
  expect(fitPan.scrollWidth).toBeLessThanOrEqual(fitPan.clientWidth + 1);
  expect(fitBox.x).toBeCloseTo(fitPan.left, 0);
  await capturePhone(page, "cash-invoice-phone");
  await page.getByTestId("cash-invoice-zoom-in").click();
  await expect.poll(async () => (await document.boundingBox())?.width).toBeGreaterThan(fitBox.width);
  await page.getByTestId("cash-invoice-zoom-out").click();
  await page.getByTestId("cash-invoice-actual-size").click();
  await expect.poll(async () => (await document.boundingBox())?.width).toBeCloseTo(1280, 0);
  await expect.poll(async () => (await document.boundingBox())?.height).toBeCloseTo(908, 0);
  const pan = page.getByTestId("cash-invoice-pan");
  await expect.poll(() => pan.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
  const initialPan = await pan.evaluate(element => element.scrollLeft);
  await page.getByLabel("تحريك الفاتورة إلى اليسار", { exact: true }).click();
  await expect.poll(() => pan.evaluate(element => element.scrollLeft)).toBeLessThan(initialPan);

  // Render the actual document markup and current app styles in an isolated page
  // for full-resolution evidence. The real phone preview is captured separately.
  const markup = await document.evaluate(element => element.outerHTML);
  const styles = await page.locator("style").allTextContents();
  const proof = await context.newPage();
  const proofObserved = observePreview(proof);
  await proof.setViewportSize({ width: 1280, height: 908 });
  await proof.setContent(`<html lang="ar"><head><base href="http://127.0.0.1:4173/"><style>${styles.join("\n")}</style><style>html,body{margin:0!important;width:1280px!important;height:908px!important;overflow:hidden!important}.nasqo-app{position:static!important;width:1280px!important;height:908px!important;overflow:visible!important}[data-testid="cash-invoice-document"]{transform:none!important;zoom:1!important;position:relative!important;margin:0!important}</style></head><body><div class="nasqo-app" dir="rtl">${markup}</div></body></html>`);
  await proof.evaluate(() => window.document.fonts.ready);
  await expect(proof.getByTestId("cash-invoice-document")).toBeVisible();
  await proof.screenshot({ path: "qa/implementation-cash-invoice-v8.png" });
  proofObserved.assertSafe();
  await proof.close();

  await page.getByTestId("cash-invoice-reset").click();
  await expect.poll(async () => (await document.boundingBox())?.width).toBeCloseTo(fitBox.width, 0);
  await page.getByLabel("رجوع", { exact: true }).click();
  await expect(statement).toBeVisible();
  await expectRestingRoute(page);
  await expect(statement.locator(".cash-statement-row")).toHaveCount(17);
  observed.assertSafe();
});
