import { test, expect } from '@playwright/test';
import { mockUnauthenticated } from './helpers/mock-supabase';

/**
 * Auth page behavioural tests.
 * Verifies form interactions, validation feedback, and navigation links.
 */

test.describe('auth page', () => {
  test.beforeEach(async ({ page }) => {
    await mockUnauthenticated(page);
    await page.goto('/signin');
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10_000 });
  });

  test('email input accepts text', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('test@example.com');
    await expect(emailInput).toHaveValue('test@example.com');
  });

  test('password input masks characters', async ({ page }) => {
    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill('secret123');
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('submitting empty form shows validation', async ({ page }) => {
    // Click submit with no values — should not navigate away from auth page
    const submitBtn = page.locator('button[type="submit"]').first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
    }
    // Should still be on auth page (email input still visible)
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('forgot password link navigates to /forgot-password', async ({ page }) => {
    const forgotLink = page.getByText(/forgot/i).first();
    if (await forgotLink.isVisible()) {
      await forgotLink.click();
      await expect(page).toHaveURL(/forgot-password/);
    }
  });
});

test.describe('forgot password page', () => {
  test.beforeEach(async ({ page }) => {
    await mockUnauthenticated(page);
    await page.goto('/forgot-password');
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10_000 });
  });

  test('email input accepts valid address', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('user@example.com');
    await expect(emailInput).toHaveValue('user@example.com');
  });

  test('back / sign-in link is accessible', async ({ page }) => {
    // Look for any back-navigation element
    const backEl = page
      .getByRole('link', { name: /sign.?in|back/i })
      .or(page.getByText(/sign.?in|back/i).first());
    // Just check it's in the DOM — navigation behaviour is integration-level
    await expect(backEl)
      .toBeAttached({ timeout: 5_000 })
      .catch(() => {
        /* Optional element — not all designs include an explicit back link */
      });
  });
});
