import { mkdirSync } from "node:fs";
import { expect, test } from "@playwright/test";

const qaDir = "qa";

test.use({ viewport: { width: 1400, height: 1200 }, deviceScaleFactor: 1, channel: "chrome" });

test("NASQO Pro primary mobile flow", async ({ page }) => {
  test.setTimeout(60_000);
  mkdirSync(qaDir, { recursive: true });
  const browserErrors: string[] = [];
  const hidePreviewCursor = async () => {
    await page.mouse.move(1300, 1100);
    await page.waitForTimeout(120);
  };

  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });
  page.on("pageerror", (error) => browserErrors.push(error.message));

  await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle" });

  const screen = page.getByTestId("device-screen");
  await expect(screen).toBeVisible();
  const box = await screen.boundingBox();
  expect(box?.width).toBe(393);
  expect(box?.height).toBe(852);
  await expect(page.getByTestId("dashboard-screen")).toBeVisible();
  await hidePreviewCursor();
  await screen.screenshot({ path: `${qaDir}/implementation-dashboard.png` });

  await page.getByRole("button", { name: "كشف حساب", exact: true }).click();
  await expect(page.getByTestId("account-picker-modal")).toBeVisible();
  await hidePreviewCursor();
  await screen.screenshot({ path: `${qaDir}/implementation-account-picker.png` });
  await page.getByRole("button", { name: "إلغاء", exact: true }).click();
  await expect(page.getByTestId("account-picker-modal")).toBeHidden();

  await page.getByLabel("فتح القائمة").click();
  await expect(page.getByLabel("قائمة نسقو")).toBeVisible();
  await expect(page.getByLabel("قائمة نسقو").getByRole("button", { name: "الرسائل الفورية واتساب", exact: true })).toBeVisible();
  await page.waitForTimeout(350);
  await hidePreviewCursor();
  await screen.screenshot({ path: `${qaDir}/implementation-drawer.png` });
  const activationAction = page.getByLabel("قائمة نسقو").getByRole("button", { name: "التفعيل", exact: true });
  await activationAction.scrollIntoViewIfNeeded();
  await activationAction.click();
  await expect(page.getByTestId("activation-modal")).toBeVisible();
  await hidePreviewCursor();
  await screen.screenshot({ path: `${qaDir}/implementation-activation.png` });
  await page.getByRole("button", { name: "تحقق الآن", exact: true }).click();
  await expect(page.getByTestId("activation-modal")).toBeHidden();
  await page.waitForTimeout(2300);

  await page.locator(".metric-card").filter({ hasText: "المشتريات" }).click();
  await expect(page.getByTestId("purchases-screen")).toBeVisible();
  await page.waitForTimeout(700);
  await hidePreviewCursor();
  await screen.screenshot({ path: `${qaDir}/implementation-purchases.png` });
  const purchaseFab = page.getByLabel("إضافة مورد أو عملية");
  await purchaseFab.click();
  await expect(page.getByTestId("purchase-create-menu")).toBeVisible();
  await hidePreviewCursor();
  await screen.screenshot({ path: `${qaDir}/implementation-purchases-menu.png` });
  await purchaseFab.click();
  await expect(page.getByTestId("purchase-create-menu")).toBeHidden();
  const dailyPeriod = page.getByRole("button", { name: "يومي", exact: true });
  await dailyPeriod.click();
  await expect(dailyPeriod).toHaveAttribute("aria-pressed", "true");
  const firstVendor = page.locator(".vendor-card").first();
  await firstVendor.getByRole("button", { name: /رسالة إلى/ }).click();
  await expect(page.getByRole("status")).toContainText("لم يتم إرسال أي رسالة");
  await expect(page.getByTestId("purchases-screen")).toBeVisible();
  await page.waitForTimeout(2300);

  await firstVendor.locator(".vendor-open").click();
  await expect(page.getByTestId("supplier-screen")).toBeVisible();
  await page.waitForTimeout(700);
  await hidePreviewCursor();
  await screen.screenshot({ path: `${qaDir}/implementation-supplier.png` });

  await page.getByLabel("إضافة سند").click();
  const transactionModal = page.getByTestId("transaction-modal");
  await expect(transactionModal).toBeVisible();
  await hidePreviewCursor();
  await screen.screenshot({ path: `${qaDir}/implementation-transaction-modal.png` });
  await transactionModal.getByRole("button", { name: "إلغاء", exact: true }).click();
  await expect(transactionModal).toBeHidden();

  await page.getByLabel("تصدير").click();
  await expect(page.getByTestId("export-menu")).toBeVisible();
  await page.waitForTimeout(350);
  await hidePreviewCursor();
  await screen.screenshot({ path: `${qaDir}/implementation-export-menu.png` });
  await page.getByLabel("إغلاق قائمة التصدير").click({ position: { x: 360, y: 700 } });
  await expect(page.getByTestId("export-menu")).toBeHidden();

  await page.getByLabel("رجوع").click();
  await expect(page.getByTestId("purchases-screen")).toBeVisible();
  await page.waitForTimeout(700);
  await page.getByLabel("رجوع").click();
  await expect(page.getByTestId("dashboard-screen")).toBeVisible();
  await page.waitForTimeout(700);

  await page.getByLabel("إضافة عملية").click();
  await expect(page.getByTestId("bottom-sheet")).toBeVisible();
  await page.getByTestId("bottom-sheet").getByRole("button", { name: /حساب جديد/ }).click();
  const compactAccountModal = page.getByTestId("account-form-compact");
  await expect(compactAccountModal).toBeVisible();
  await hidePreviewCursor();
  await screen.screenshot({ path: `${qaDir}/implementation-account-form-compact.png` });
  await compactAccountModal.getByRole("button", { name: "إلغاء", exact: true }).click();
  await expect(compactAccountModal).toBeHidden();

  await page.getByRole("button", { name: "صرف عملات", exact: true }).click();
  await expect(page.getByTestId("currency-screen")).toBeVisible();
  await page.waitForTimeout(500);
  await hidePreviewCursor();
  await screen.screenshot({ path: `${qaDir}/implementation-currency.png` });
  await page.getByTestId("currency-account-add").click();
  const extendedAccountModal = page.getByTestId("account-form-extended");
  await expect(extendedAccountModal).toBeVisible();
  await hidePreviewCursor();
  await screen.screenshot({ path: `${qaDir}/implementation-account-form-extended.png` });
  await extendedAccountModal.getByRole("button", { name: "إلغاء", exact: true }).click();
  await expect(extendedAccountModal).toBeHidden();
  await page.getByLabel("رجوع").click();
  await expect(page.getByTestId("dashboard-screen")).toBeVisible();
  await page.waitForTimeout(500);

  await page.getByRole("button", { name: "واتساب", exact: true }).click();
  await expect(page.getByTestId("whatsapp-settings-screen")).toBeVisible();
  await page.waitForTimeout(500);
  await hidePreviewCursor();
  await screen.screenshot({ path: `${qaDir}/implementation-whatsapp-settings.png` });
  await page.getByTestId("whatsapp-phone").fill("0500000000");
  await expect(page.getByTestId("keyboard-dock")).toHaveAttribute("data-visible", "true");
  await page.keyboard.press("Escape");
  await page.getByTestId("whatsapp-password").fill("demo-password");
  await page.keyboard.press("Escape");
  await page.getByTestId("whatsapp-save").click();
  await expect(page.getByRole("status")).toContainText("لم تُرسل بيانات اتصال");
  await page.getByLabel("رجوع").click();
  await expect(page.getByTestId("dashboard-screen")).toBeVisible();

  expect(browserErrors).toEqual([]);
});
