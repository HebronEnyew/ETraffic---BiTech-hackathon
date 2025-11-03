/**
 * E2E Test Stub for Dashboard
 * Example Playwright test for critical user flows
 */

import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:3000/login');
    
    // Login with test credentials
    await page.fill('input[type="email"]', 'user@etraffic.test');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect
    await page.waitForURL('http://localhost:3000/');
  });

  test('should display traffic map', async ({ page }) => {
    await expect(page.locator('text=Traffic Map')).toBeVisible();
  });

  test('should show active incidents', async ({ page }) => {
    await expect(page.locator('text=Active Incidents')).toBeVisible();
  });

  test('should navigate to different tabs', async ({ page }) => {
    // Click Analytics tab
    await page.click('text=Analytics');
    await expect(page.locator('text=Analytics')).toBeVisible();

    // Click Calendar tab
    await page.click('text=Calendar');
    await expect(page.locator('text=Calendar')).toBeVisible();
  });

  test('should show incident summary sidebar', async ({ page }) => {
    await expect(page.locator('text=Incident Summary')).toBeVisible();
  });
});

test.describe('Report Incident', () => {
  test('should redirect to login if not authenticated', async ({ page }) => {
    await page.goto('http://localhost:3000/report');
    await expect(page).toHaveURL(/.*login/);
  });

  test('should allow verified user to report', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'user@etraffic.test');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Navigate to report page
    await page.goto('http://localhost:3000/report');
    await expect(page.locator('text=Report Incident')).toBeVisible();
  });
});

