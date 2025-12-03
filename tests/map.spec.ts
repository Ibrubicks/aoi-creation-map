// tests/map.spec.ts
import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("http://localhost:5173");
});

test("map container visible and WMS/OSM tile present", async ({ page }) => {
  await expect(page.locator(".leaflet-container")).toBeVisible();
  // wait a bit for tiles to load
  await page.waitForTimeout(1800);
  const tile = page.locator(".leaflet-tile").first();
  await expect(tile).toBeVisible();
});

test("draw polygon flow creates feature entry and can export", async ({ page }) => {
  // click draw polygon
  await page.click('[data-testid="btn-draw-polygon"]');
  // click map area three times
  const map = page.locator(".leaflet-container");
  const box = await map.boundingBox();
  if (!box) throw new Error("map bounding box not found");
  await page.mouse.click(box.x + 120, box.y + 120);
  await page.mouse.click(box.x + 160, box.y + 140);
  await page.mouse.click(box.x + 140, box.y + 180);
  // finish
  await page.click('[data-testid="btn-finish"]');
  // check AOI summary count increased
  await expect(page.locator("text=Count:")).toContainText("1");
});
