import { test, expect } from '@playwright/test';

// ── Helpers ──────────────────────────────────────────────────
async function waitForMap(page: import('@playwright/test').Page) {
  await page.waitForSelector('.maplibregl-canvas', { timeout: 15_000 });
}

// ── 1. Page load ─────────────────────────────────────────────
test.describe('Page load', () => {
  test('renders without crashing', async ({ page }) => {
    await page.goto('/');
    await waitForMap(page);
    await expect(page).toHaveTitle(/Weather Dashboard/);
  });

  test('shows default Bangkok location', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Bangkok', { timeout: 10_000 });
    await expect(page.locator('text=Bangkok').first()).toBeVisible();
  });

  test('shows onboarding toast on first visit', async ({ page }) => {
    // Clear persisted state so onboarding shows
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('weather-dashboard-prefs'));
    await page.reload();
    await expect(page.locator('text=Welcome to Weather Dashboard')).toBeVisible({ timeout: 5_000 });
  });

  test('dismisses onboarding on "Got it"', async ({ page }) => {
    await page.goto('/');
    const gotIt = page.locator('button:has-text("Got it")');
    if (await gotIt.isVisible()) {
      await gotIt.click();
      await expect(gotIt).not.toBeVisible();
    }
  });
});

// ── 2. URL deep linking ──────────────────────────────────────
test.describe('Shareable URL', () => {
  test('loads location from ?lat &lng params', async ({ page }) => {
    await page.goto('/?lat=35.6762&lng=139.6503&unit=C&name=Tokyo');
    await page.waitForSelector('text=Tokyo', { timeout: 10_000 });
    await expect(page.locator('text=Tokyo').first()).toBeVisible();
  });

  test('updates URL when clicking map', async ({ page }) => {
    await page.goto('/');
    await waitForMap(page);
    await page.locator('.maplibregl-canvas').click({ position: { x: 400, y: 300 } });
    await page.waitForFunction(() => window.location.search.includes('lat='));
    expect(page.url()).toContain('lat=');
    expect(page.url()).toContain('lng=');
  });

  test('unit param toggles °F correctly', async ({ page }) => {
    await page.goto('/?lat=13.7563&lng=100.5018&unit=F');
    await expect(page.locator('text=°F').first()).toBeVisible({ timeout: 8_000 });
  });
});

// ── 3. City search ───────────────────────────────────────────
test.describe('City search', () => {
  test('shows search input in analysis panel', async ({ page }) => {
    await page.goto('/');
    const input = page.locator('input[placeholder*="Search city"]').first();
    await expect(input).toBeVisible({ timeout: 5_000 });
  });

  test('shows results when typing', async ({ page }) => {
    await page.goto('/');
    const input = page.locator('input[placeholder*="Search city"]').first();
    await input.fill('London');
    // Wait for geocoding debounce (400ms) + API response
    await expect(page.locator('text=London').nth(1)).toBeVisible({ timeout: 8_000 });
  });

  test('selects a city and updates location', async ({ page }) => {
    await page.goto('/');
    const input = page.locator('input[placeholder*="Search city"]').first();
    await input.fill('Tokyo');
    await page.locator('button:has-text("Tokyo")').first().click({ timeout: 8_000 });
    await expect(page.locator('text=Tokyo').first()).toBeVisible({ timeout: 8_000 });
  });
});

// ── 4. Layer controls ────────────────────────────────────────
test.describe('Layer controls', () => {
  test('toggles a layer on and off', async ({ page }) => {
    await page.goto('/');
    const windCheckbox = page.locator('label:has-text("Wind Gusts") input[type="checkbox"]');
    await expect(windCheckbox).toBeVisible({ timeout: 5_000 });
    await windCheckbox.click();
    await expect(windCheckbox).toBeChecked();
    await windCheckbox.click();
    await expect(windCheckbox).not.toBeChecked();
  });

  test('theme toggle switches to light mode', async ({ page }) => {
    await page.goto('/');
    const themeBtn = page.locator('button:has-text("Light")').first();
    await expect(themeBtn).toBeVisible({ timeout: 5_000 });
    await themeBtn.click();
    await expect(page.locator('html')).toHaveClass(/light/);
  });
});

// ── 5. Unit toggle ───────────────────────────────────────────
test.describe('Temperature unit', () => {
  test('toggles between °C and °F', async ({ page }) => {
    await page.goto('/');
    const toggleBtn = page.locator('button:has-text("°C")').first();
    await expect(toggleBtn).toBeVisible({ timeout: 8_000 });
    await toggleBtn.click();
    await expect(page.locator('button:has-text("°F")').first()).toBeVisible();
  });
});

// ── 6. Keyboard shortcuts ────────────────────────────────────
test.describe('Keyboard shortcuts', () => {
  test('/ focuses search input', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('/');
    const input = page.locator('input[placeholder*="Search city"]').first();
    await expect(input).toBeFocused({ timeout: 3_000 });
  });

  test('u toggles temperature unit', async ({ page }) => {
    await page.goto('/');
    await waitForMap(page);
    // Click somewhere neutral to ensure no input is focused
    await page.locator('body').click();
    await page.keyboard.press('u');
    await expect(page.locator('button:has-text("°F")').first()).toBeVisible({ timeout: 5_000 });
  });
});

// ── 7. Mobile layout ─────────────────────────────────────────
test.describe('Mobile layout', () => {
  test.use({ viewport: { width: 390, height: 844 } }); // iPhone 14

  test('shows bottom navigation tabs', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('nav')).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('button:has-text("Layers")')).toBeVisible();
    await expect(page.locator('button:has-text("Analysis")')).toBeVisible();
    await expect(page.locator('button:has-text("Timeline")')).toBeVisible();
  });

  test('switches mobile panels via nav', async ({ page }) => {
    await page.goto('/');
    await page.locator('button:has-text("Analysis")').click();
    await expect(page.locator('text=Location Analysis')).toBeVisible({ timeout: 5_000 });
    await page.locator('button:has-text("Timeline")').click();
    await expect(page.locator('text=Timeline')).toBeVisible({ timeout: 3_000 });
  });
});

// ── 8. Error states ──────────────────────────────────────────
test.describe('Error handling', () => {
  test('shows error UI when API is blocked', async ({ page }) => {
    // Block Open-Meteo API calls
    await page.route('**/api.open-meteo.com/**', (route) => route.abort());
    await page.goto('/');
    await expect(
      page.locator('text=Failed to load weather').first()
    ).toBeVisible({ timeout: 15_000 });
  });
});
