import type { Locator, Page } from '@playwright/test';

import { expect, test } from './fixtures';
import { ConfigurationPage } from './page-models/configuration-page';
import { Navigation } from './page-models/navigation';

test.describe('Sidebar summary carousel', () => {
  let page: Page;
  let navigation: Navigation;
  let configurationPage: ConfigurationPage;
  let carousel: Locator;

  function slideTab(name: string) {
    return carousel.getByRole('tab', { name });
  }

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    navigation = new Navigation(page);
    configurationPage = new ConfigurationPage(page);

    await page.goto('/');
    await configurationPage.createTestFile();

    carousel = page.getByRole('region', { name: 'Summary' });
  });

  test.afterEach(async () => {
    await page?.close();
  });

  test('opens on Budget Overview and wraps around', async () => {
    await expect(slideTab('Budget Overview')).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(
      carousel.getByRole('button', { name: 'Open Budget Overview report' }),
    ).toBeVisible();
    await expect(page).toMatchThemeScreenshots();

    await carousel.getByRole('button', { name: 'Previous slide' }).click();
    await expect(slideTab('Accounts')).toHaveAttribute('aria-selected', 'true');
    await expect(
      carousel.getByRole('link', { name: /^All accounts/ }),
    ).toBeVisible();

    await carousel.getByRole('button', { name: 'Next slide' }).click();
    await expect(slideTab('Budget Overview')).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  test('shows each chart slide', async () => {
    for (const name of ['Net Worth', 'Cash Flow']) {
      await slideTab(name).click();
      await expect(
        carousel.getByRole('button', { name: `Open ${name} report` }),
      ).toBeVisible();
      await expect(carousel).toMatchThemeScreenshots();
    }
  });

  test('opens Net Worth before the Reports page has loaded', async () => {
    await slideTab('Net Worth').click();
    await carousel
      .getByRole('button', { name: 'Open Net Worth report' })
      .click();

    await expect(page).toHaveURL(/\/reports\/net-worth$/);
    await expect(page.getByTestId('reports-page')).toBeVisible();
  });

  test('opens Cash Flow before the Reports page has loaded', async () => {
    await slideTab('Cash Flow').click();
    await carousel
      .getByRole('button', { name: 'Open Cash Flow report' })
      .click();

    await expect(page).toHaveURL(/\/reports\/cash-flow$/);
    await expect(
      page.getByTestId('reports-page').getByText('Income:', { exact: true }),
    ).toBeVisible();
  });

  test('opens Monthly Spending in budget mode from Budget Overview', async () => {
    await carousel
      .getByRole('button', { name: 'Open Budget Overview report' })
      .click();

    await expect(page).toHaveURL(/\/reports\/spending\?mode=budget$/);
    // In budget mode "Budgeted" labels the mode button, the comparison field
    // and the legend; single-month mode shows it on the button only
    await expect(
      page.getByTestId('reports-page').getByText('Budgeted', { exact: true }),
    ).toHaveCount(3);
  });

  test('refreshes Budget Overview after a transaction is added', async () => {
    const card = carousel.getByRole('button', {
      name: 'Open Budget Overview report',
    });
    await expect(card).toContainText(/\d/);
    const before = await card.textContent();

    const accountPage = await navigation.goToAccountPage('Ally Savings');
    await accountPage.createSingleTransaction({
      payee: 'Home Depot',
      category: 'Food',
      debit: '500.00',
    });

    await slideTab('Budget Overview').click();
    await expect(card).not.toHaveText(before ?? '');
  });
});
