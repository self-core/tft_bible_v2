import { test, expect } from '@playwright/test';

test.describe('TFT Bible v2 - Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should load home page with title', async ({ page }) => {
    await expect(page).toHaveTitle(/TFT Bible/);
  });

  test('should have navigation elements', async ({ page }) => {
    // Check for common navigation elements
    await expect(page.locator('nav')).toBeVisible();
  });

  test('should be able to navigate to champions page', async ({ page }) => {
    await page.click('a[href*="champion"], button:has-text("Champions"), text=Champions');
    await expect(page.url()).toContain('champion');
  });
});

test.describe('TFT Bible v2 - Champions Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/champions');
    await page.waitForLoadState('networkidle');
  });

  test('should display champions grid', async ({ page }) => {
    await expect(page.locator('[data-testid="champion-card"], .champion-card, .champion-grid')).toBeVisible();
  });

  test('should have search/filter functionality', async ({ page }) => {
    await expect(page.locator('input[type="search"], input[placeholder*="search" i], input[placeholder*="Search" i]')).toBeVisible();
  });
});

test.describe('TFT Bible v2 - Compositions Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/compositions');
    await page.waitForLoadState('networkidle');
  });

  test('should display compositions list', async ({ page }) => {
    await expect(page.locator('[data-testid="composition-card"], .composition-card, .compositions-list')).toBeVisible();
  });
});

test.describe('TFT Bible v2 - Set Detail Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sets/18');
    await page.waitForLoadState('networkidle');
  });

  test('should display set information', async ({ page }) => {
    await expect(page.locator('h1, [data-testid="set-title"]')).toContainText(/Enchanted Wilds|Set 18/);
  });

  test('should display champions for the set', async ({ page }) => {
    await expect(page.locator('[data-testid="champion-card"], .champion-card')).toBeVisible();
  });

  test('should display traits for the set', async ({ page }) => {
    await expect(page.locator('[data-testid="trait-card"], .trait-card, text=Trait')).toBeVisible();
  });
});