import { test, expect } from '@playwright/test';
import { mockAuthenticated } from './helpers/mock-supabase';

/**
 * Authenticated flow tests.
 * Verifies that a signed-in user can reach protected routes and
 * that the core navigation between dashboard and manage page works.
 * All Supabase calls are mocked; data tables return empty arrays.
 */

const testUser = { id: 'u1', email: 'alice@example.com', display_name: 'Alice' };

test.describe('authenticated dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticated(page, testUser);
  });

  test('authenticated user sees the dashboard (not signin redirect)', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Dashboard')).toBeVisible({ timeout: 15_000 });
    // Should NOT be on the sign-in page
    await expect(page.locator('input[type="email"]')).not.toBeVisible();
  });

  test('dashboard shows stat cards', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Dashboard')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Total Questions')).toBeVisible();
    await expect(page.getByText('Answered')).toBeVisible();
    await expect(page.getByText('Tracking')).toBeVisible();
  });

  test('"Manage Weeks" button navigates to /manage', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Dashboard')).toBeVisible({ timeout: 15_000 });

    await page.getByText('Manage Weeks').click();
    await expect(page).toHaveURL(/\/manage/);
    await expect(page.getByText('Manage Exercise Weeks')).toBeVisible({ timeout: 10_000 });
  });

  test('navigation logo returns to dashboard from manage page', async ({ page }) => {
    await page.goto('/manage');
    await expect(page.getByText('Manage Exercise Weeks')).toBeVisible({ timeout: 15_000 });

    await page.getByText('Exercise Journal').click();
    await expect(page.getByText('Dashboard')).toBeVisible({ timeout: 10_000 });
  });

  test('profile link navigates to /profile', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Dashboard')).toBeVisible({ timeout: 15_000 });

    // Click the avatar/profile button in the nav
    await page.locator('button').filter({ hasText: /alice/i }).click();
    await expect(page).toHaveURL(/\/profile/);
  });
});

test.describe('authenticated manage page', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticated(page, testUser);
  });

  test('manage page renders with "Add New Week" button', async ({ page }) => {
    await page.goto('/manage');
    await expect(page.getByText('Manage Exercise Weeks')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Add New Week')).toBeVisible();
    await expect(page.getByText('Manage Quarters')).toBeVisible();
  });

  test('"Add New Week" button opens the week modal', async ({ page }) => {
    await page.goto('/manage');
    await expect(page.getByText('Manage Exercise Weeks')).toBeVisible({ timeout: 15_000 });

    await page.getByText('Add New Week').click();
    // Modal opens — week number field must be present
    await expect(page.getByText('Week Number')).toBeVisible({ timeout: 5_000 });
  });

  test('breadcrumb Dashboard button returns to root', async ({ page }) => {
    await page.goto('/manage');
    await expect(page.getByText('Manage Exercise Weeks')).toBeVisible({ timeout: 15_000 });

    // Breadcrumb is a <button>, not an <a>
    await page
      .getByRole('button', { name: /dashboard/i })
      .first()
      .click();
    await expect(page.getByText('Dashboard')).toBeVisible({ timeout: 10_000 });
  });
});
