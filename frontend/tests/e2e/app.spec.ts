import { test, expect } from './fixtures';

test('sidebar opens from the menu or rail and closes on dashboard interaction', async ({
  page,
}) => {
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'Crisis overview', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Close sidebar', exact: true }).click();
  await expect(page.locator('.app-shell')).toHaveClass(/sidebar-collapsed/);
  await page.getByRole('button', { name: 'Open sidebar', exact: true }).click();
  await expect(page.locator('.app-shell')).not.toHaveClass(/sidebar-collapsed/);
  await page.getByRole('heading', { name: 'Crisis overview', exact: true }).click();
  await expect(page.locator('.app-shell')).toHaveClass(/sidebar-collapsed/);
  await page.locator('.sidebar').click({ position: { x: 68, y: 200 } });
  await expect(page.locator('.app-shell')).not.toHaveClass(/sidebar-collapsed/);
  await page.getByRole('navigation').getByRole('link', { name: 'Crisis Map', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Crisis map', exact: true })).toBeVisible();
  await expect(page.locator('.app-shell')).not.toHaveClass(/sidebar-collapsed/);
  await page.getByRole('navigation').getByRole('link', { name: 'Overview', exact: true }).click();
  await expect(page.locator('.app-shell')).toHaveClass(/sidebar-collapsed/);
});
test('all routes render without application errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  for (const [route, title] of [
    ['dashboard', 'Crisis overview'],
    ['map', 'Crisis map'],
    ['incidents', 'Incident management'],
    ['replay', 'Historical replay'],
    ['sources', 'Data sources'],
    ['settings', 'Settings'],
    ['help', 'Help & about'],
  ]) {
    await page.goto('/' + route);
    await expect(page.getByRole('heading', { name: title, exact: true, level: 1 })).toBeVisible();
  }
  expect(errors).toEqual([]);
  for (const route of ['/monitoring', '/analytics', '/reports']) {
    await expect(page.locator(`nav a[href="${route}"]`)).toHaveCount(0);
    const response = await page.goto(route);
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  }
});

test('removed saved default views fall back to overview', async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      'crisis-lens-preferences',
      JSON.stringify({ state: { defaultView: '/monitoring', theme: 'dark' }, version: 0 }),
    ),
  );
  await page.goto('/');
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole('heading', { name: 'Crisis overview', exact: true })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});
test('filters incidents, opens details, and changes dashboard map tabs', async ({ page }) => {
  await page.goto('/incidents');
  await page.getByLabel('Search incidents', { exact: true }).fill('Guwahati');
  await expect(
    page.getByRole('link', { name: 'River levels rise along the Brahmaputra' }),
  ).toBeVisible();
  await expect(
    page.getByText('Urban flooding affects low-lying neighbourhoods', { exact: true }),
  ).toHaveCount(0);
  await page.getByRole('link', { name: 'River levels rise along the Brahmaputra' }).click();
  await expect(page.getByRole('heading', { name: 'Incident intelligence' })).toBeVisible();
  await page.getByRole('tab', { name: 'Evidence', exact: true }).click();
  await expect(page.getByText('Supporting evidence', { exact: true })).toBeVisible();
  await page.goto('/dashboard');
  await expect(page.locator('.metric-card')).toHaveCount(6);
  await expect(page.locator('.leaflet-container')).toBeVisible();
  await expect(page.locator('.recharts-pie-sector').first()).toBeVisible();
  await page.screenshot({ path: 'test-results/dashboard-desktop.png', fullPage: true });
  await page.getByRole('button', { name: 'Active only', exact: true }).click();
  await page.getByRole('button', { name: 'List view', exact: true }).click();
  await expect(page.locator('.map-list')).toBeVisible();
});
test('replay releases events, pauses, resumes, changes speed, and removes future state on rewind', async ({
  page,
}) => {
  await page.goto('/replay');
  await page.getByLabel('Replay speed').selectOption('3600');
  await page.getByRole('button', { name: 'Start replay', exact: true }).click();
  await expect
    .poll(async () => Number(await page.getByTestId('released-count').textContent()))
    .toBeGreaterThanOrEqual(4);
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  const time = await page.getByTestId('virtual-clock').textContent();
  await page.waitForTimeout(500);
  expect(await page.getByTestId('virtual-clock').textContent()).toBe(time);
  await page.getByRole('button', { name: 'Resume', exact: true }).click();
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await page.getByRole('button', { name: 'Seek to event 1', exact: true }).click();
  await expect(page.getByTestId('released-count')).toHaveText('1');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: 'test-results/replay-desktop.png', fullPage: true });
  await expect(page.getByText('0 released', { exact: true })).toBeVisible();
  await expect(page.locator('.replay-feed .incident-card')).toHaveCount(1);
});
test('theme persists and mobile navigation works without overflow', async ({ page }) => {
  await page.goto('/dashboard');
  await page.getByLabel('Toggle theme').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.setViewportSize({ width: 375, height: 812 });
  await page.getByLabel('Open navigation').click();
  await page.getByRole('dialog').getByRole('link', { name: 'Historical Replay' }).click();
  await expect(page.getByRole('heading', { name: 'Historical replay', exact: true })).toBeVisible();
  await expect(page.getByLabel('Replay speed')).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: 'test-results/replay-mobile.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
