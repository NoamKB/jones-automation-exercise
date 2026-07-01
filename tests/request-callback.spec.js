// @ts-check
const { test, expect } = require('@playwright/test');

const testLead = {
  name: 'Noam Kires',
  email: 'noam.kires@test.com',
  phone: '050-123-4567',
  company: 'Test Company',
  website: 'https://testcompany.io',
};

test('submits a call-back request and lands on the thank-you page', async ({ page }) => {
  await page.goto('/');

  // required-field labels carry a trailing "*"; \s*\*?$ matches the exact
  // field and won't latch onto a longer label that starts the same way
  await page.getByLabel(/^Name\s*\*?$/).fill(testLead.name);
  await page.getByLabel(/^Email\s*\*?$/).fill(testLead.email);
  await page.getByLabel(/^Phone\s*\*?$/).fill(testLead.phone);
  await page.getByLabel(/^Company\s*\*?$/).fill(testLead.company);
  await page.getByLabel(/^Website\s*\*?$/).fill(testLead.website);

  const employees = page.getByLabel('Number of Employees');

  await expect(employees).toBeVisible();
  await employees.selectOption({ label: '51-500' });
  await expect(employees).toHaveValue('51-500');

  await page.screenshot({ path: 'screenshots/before-submit.png', fullPage: true });

  // the form submits via GET, so values come back on the URL as a query string
  await Promise.all([
    page.waitForURL('**/thank-you.html**'),
    page.getByRole('button', { name: 'Request a call back' }).click(),
  ]);

  await expect(page).toHaveURL(/thank-you\.html/);
  await expect(page.getByRole('heading', { name: /thank you/i })).toBeVisible();

  console.log('Reached the thank-you page: call-back request submitted.');
});

test('does not submit when a required field is empty', async ({ page }) => {
  await page.goto('/');

  // fill everything except Name, which is a required field
  await page.getByLabel(/^Email\s*\*?$/).fill(testLead.email);
  await page.getByLabel(/^Phone\s*\*?$/).fill(testLead.phone);

  await page.getByRole('button', { name: 'Request a call back' }).click();

  // the browser's native required-field check should block the submit, so we
  // stay on the landing page instead of navigating to the thank-you page
  await expect(page).not.toHaveURL(/thank-you\.html/);

  const name = page.getByLabel(/^Name\s*\*?$/);
  const isValid = await name.evaluate((el) => /** @type {HTMLInputElement} */ (el).checkValidity());
  expect(isValid).toBe(false);
});
