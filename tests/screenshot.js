const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto('http://localhost:4173/');
  await page.locator('[data-habit="exercise"]').check();
  await page.locator('[data-habit="journal"]').check();
  await page.locator('#today-goal').fill('Finish the client proposal draft');
  await page.locator('.schedule-text').first().fill('Gym');
  await page.locator('#add-task').click();
  await page.locator('.task-text').first().fill('Call supplier');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'day-view.png' });

  await page.locator('#nav-week').click();
  await page.locator('#week-goal').fill('Launch the new product page');
  await page.locator('#add-goal').click();
  await page.locator('.task-text').first().fill('Finish Q3 report');
  await page.locator('.grid-cell[data-day="mon"][data-band="morning"]').fill('Client meeting');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'week-view.png' });

  await browser.close();
})();
