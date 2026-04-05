import { test, expect } from '@playwright/test';
import { mockUnauthenticated } from './helpers/mock-supabase';

/**
 * Smoke tests — fastest possible signal that the app boots and the
 * unauthenticated flow is intact. All Supabase calls are mocked.
 */

test.describe('unauthenticated smoke', () => {
  test.beforeEach(async ({ page }) => {
    await mockUnauthenticated(page);
  });

  test('sign-in page loads and shows auth form', async ({ page }) => {
    await page.goto('/signin');
    // Email + password inputs must be present
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('sign-up page loads and shows auth form', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('forgot-password page loads and shows email field', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10_000 });
  });

  test('root redirects unauthenticated users to auth', async ({ page }) => {
    await page.goto('/');
    // After loading, unauthenticated users should see an email input (auth form)
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 15_000 });
  });

  test('page title is present', async ({ page }) => {
    await page.goto('/signin');
    await expect(page).toHaveTitle(/.+/);
  });
});
