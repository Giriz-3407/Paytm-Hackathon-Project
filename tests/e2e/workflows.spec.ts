import { test, expect } from '@playwright/test';

test('exports filtered CSV, generates a report, and opens related reports', async ({ page }) => {
  await page.goto('/incidents');
  await page.getByLabel('Search incidents', { exact: true }).fill('Guwahati');
  await expect(
    page.getByRole('link', { name: 'River levels rise along the Brahmaputra' }),
  ).toBeVisible();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export filtered CSV' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('crisis-lens-incidents.csv');
  const stream = await download.createReadStream();
  let csv = '';
  for await (const chunk of stream) csv += chunk.toString();
  expect(csv).toContain('CL-2401');
  expect(csv).not.toContain('CL-2402');
  await page.getByRole('link', { name: 'River levels rise along the Brahmaputra' }).click();
  await page.getByRole('button', { name: 'Generate demo report', exact: true }).click();
  await page.getByRole('tab', { name: 'History', exact: true }).click();
  await page.getByRole('link', { name: 'View related intelligence reports' }).click();
  await expect(page.getByLabel('Report incident')).toHaveValue('CL-2401');
  await expect(page.locator('.report-card')).toHaveCount(2);
  await page.getByRole('button', { name: 'Read report' }).first().click();
  await expect(
    page.getByRole('dialog').getByRole('heading', { name: 'Executive summary' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Print / Save PDF' })).toBeVisible();
});

test('source toggles update dashboard metrics and survive simulated refresh', async ({ page }) => {
  await page.goto('/sources');
  await page.getByRole('switch', { name: 'Enable News discovery', exact: true }).click();
  await expect(
    page.getByRole('switch', { name: 'Enable News discovery', exact: true }),
  ).toHaveAttribute('data-state', 'unchecked');
  await page.getByRole('button', { name: 'Refresh status' }).click();
  await expect(
    page.getByRole('switch', { name: 'Enable News discovery', exact: true }),
  ).toHaveAttribute('data-state', 'unchecked');
  await page.getByRole('navigation').getByRole('link', { name: 'Overview' }).click();
  await expect(page.getByRole('heading', { name: 'Crisis overview', exact: true })).toBeVisible();
  await expect(
    page
      .locator('.metric-card')
      .filter({ hasText: 'Demo sources enabled' })
      .locator('.metric-value strong'),
  ).toHaveText('03');
});

test('saved monitoring defaults filter the live feed', async ({ page }) => {
  await page.goto('/settings');
  await page.getByRole('button', { name: 'Workspace menu' }).click();
  await page.getByRole('menuitem', { name: 'Workspace preferences' }).click();
  await page.getByRole('tab', { name: 'Monitoring Preferences' }).click();
  await page.getByLabel('Preferred crisis category', { exact: true }).selectOption('Flood');
  await page.getByLabel('Default severity filter', { exact: true }).selectOption('Critical');
  await page.getByRole('button', { name: 'Save monitoring defaults' }).click();
  await page.getByRole('navigation').getByRole('link', { name: 'Live Monitoring' }).click();
  await expect(page.getByLabel('Category', { exact: true })).toHaveValue('Flood');
  await expect(page.getByLabel('Severity', { exact: true })).toHaveValue('Critical');
  await expect(page.locator('.monitoring-feed .incident-card')).toHaveCount(1);
});

test('every main route fits a 375px viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  for (const route of [
    'dashboard',
    'monitoring',
    'map',
    'incidents',
    'replay',
    'analytics',
    'reports',
    'sources',
    'settings',
    'help',
  ]) {
    await page.goto('/' + route);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByRole('status', { name: 'Loading data' })).toHaveCount(0);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      route,
    ).toBe(true);
    if (route === 'dashboard')
      await page.screenshot({ path: 'test-results/dashboard-mobile.png', fullPage: true });
  }
});
