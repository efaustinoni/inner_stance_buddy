import type { Page } from '@playwright/test';

/**
 * Intercept all Supabase Auth and REST API calls and return
 * an unauthenticated / empty-data response.
 *
 * Call this BEFORE page.goto() so mocks are active before the app boots.
 *
 * @example
 * test('auth page renders', async ({ page }) => {
 *   await mockUnauthenticated(page);
 *   await page.goto('/signin');
 * });
 */
export async function mockUnauthenticated(page: Page): Promise<void> {
  // Supabase Auth endpoints — return no session / no user
  await page.route(/\/auth\/v1\//, async (route) => {
    const url = route.request().url();

    if (url.includes('/token') || url.includes('/logout')) {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'invalid_grant', error_description: 'Not authenticated' }),
      });
    } else {
      // /user, /session, etc.
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { user: null, session: null }, error: null }),
      });
    }
  });

  // Supabase REST API — return empty arrays for all table queries
  await page.route(/\/rest\/v1\//, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '[]',
    });
  });
}

/**
 * Intercept Supabase calls and return an authenticated user session.
 * Useful for tests that need to reach authenticated routes.
 */
export async function mockAuthenticated(
  page: Page,
  user: { id: string; email: string; display_name?: string }
): Promise<void> {
  const mockSession = {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    token_type: 'bearer',
    user: {
      id: user.id,
      email: user.email,
      role: 'authenticated',
      aud: 'authenticated',
    },
  };

  await page.route(/\/auth\/v1\//, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: { session: mockSession, user: mockSession.user }, error: null }),
    });
  });

  await page.route(/\/rest\/v1\/user_profiles/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ id: user.id, display_name: user.display_name ?? user.email }]),
    });
  });

  await page.route(/\/rest\/v1\//, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '[]',
    });
  });
}
