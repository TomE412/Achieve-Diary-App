const { test, expect } = require('@playwright/test');

function collectErrors(page) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  return errors;
}

test('app loads with no console errors and shows today', async ({ page }) => {
  const errors = collectErrors(page);
  const res = await page.goto('/');
  expect(res.status()).toBeLessThan(400);
  await expect(page).toHaveTitle('Sabre Achieve Diary');
  await expect(page.locator('#habits-grid')).toBeVisible();
  await expect(page.locator('.schedule-row').first()).toBeVisible();
  await page.waitForTimeout(500);
  expect(errors).toEqual([]);
});

test('habit checkbox updates the score', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#habit-score')).toHaveText('0/14 = 0%');
  await page.locator('[data-habit="exercise"]').check();
  await expect(page.locator('#habit-score')).toHaveText('1/14 = 7%');
});

test('today task persists across reload', async ({ page }) => {
  await page.goto('/');
  await page.locator('#add-task').click();
  await page.locator('.task-text').first().fill('Call supplier');
  await page.waitForTimeout(600); // debounce
  await page.reload();
  await expect(page.locator('.task-text').first()).toHaveValue('Call supplier');
});

test('schedule row text persists across reload', async ({ page }) => {
  await page.goto('/');
  const firstRow = page.locator('.schedule-text').first();
  await firstRow.fill('Gym');
  await page.waitForTimeout(600);
  await page.reload();
  await expect(page.locator('.schedule-text').first()).toHaveValue('Gym');
});

test('prev/next day navigation changes the date and preserves data', async ({ page }) => {
  await page.goto('/');
  const titleBefore = await page.locator('#sub-nav-title').textContent();
  await page.locator('#today-goal').fill('Finish proposal');
  await page.waitForTimeout(600);
  await page.locator('#next-btn').click();
  await expect(page.locator('#sub-nav-title')).not.toHaveText(titleBefore);
  await expect(page.locator('#today-goal')).toHaveValue('');
  await page.locator('#prev-btn').click();
  await expect(page.locator('#today-goal')).toHaveValue('Finish proposal');
});

test('week view: add a goal and see score update', async ({ page }) => {
  await page.goto('/');
  await page.locator('#nav-week').click();
  await expect(page.locator('.week-grid')).toBeVisible();
  await page.locator('#add-goal').click();
  await page.locator('.task-text').first().fill('Launch product page');
  await page.locator('.task-row .task-done').first().check();
  await expect(page.locator('#score-set')).toHaveText('1');
  await expect(page.locator('#score-achieved')).toHaveText('1');
  await expect(page.locator('#score-pct')).toHaveText('100%');
});

test('week grid cell persists across reload', async ({ page }) => {
  await page.goto('/');
  await page.locator('#nav-week').click();
  const mondayMorning = page.locator('.grid-cell[data-day="mon"][data-band="morning"]');
  await mondayMorning.fill('Client meeting');
  await page.waitForTimeout(600);
  await page.reload();
  await expect(page.locator('.grid-cell[data-day="mon"][data-band="morning"]')).toHaveValue('Client meeting');
});

test('settings save and show up on day + week views', async ({ page }) => {
  await page.goto('/');
  await page.locator('#nav-settings').click();
  await page.locator('#set-vision').fill('Be a present father who built something lasting.');
  await page.locator('#set-year-goal').fill('Grow to 3 depots.');
  await page.waitForTimeout(600);

  await page.locator('#nav-today').click();
  await expect(page.locator('.summary-value').first()).toHaveText('Be a present father who built something lasting.');

  await page.locator('#nav-week').click();
  await expect(page.locator('.summary-value').nth(1)).toHaveText('Grow to 3 depots.');
});

test('week goal shows read-only on day view with a link back to week', async ({ page }) => {
  await page.goto('/');
  await page.locator('#nav-week').click();
  await page.locator('#week-goal').fill('Launch the new product page');
  await page.waitForTimeout(600);

  await page.locator('#nav-today').click();
  await expect(page.locator('.readonly-field')).toHaveText('Launch the new product page');
});
