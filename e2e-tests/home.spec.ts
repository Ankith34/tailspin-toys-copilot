import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the correct title', async ({ page }) => {
    await expect(page).toHaveTitle('Tailspin Toys - Crowdfunding your new favorite game!');
  });

  test('should display the main heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Welcome to Tailspin Toys', exact: true })).toBeVisible();
  });

  test('should display the site branding in header', async ({ page }) => {
    await expect(page.getByText('Tailspin Toys').first()).toBeVisible();
  });

  test('should display the welcome message', async ({ page }) => {
    await expect(page.getByText('Find your next game! And maybe even back one! Explore our collection!')).toBeVisible();
  });

  test('should filter the games list by category', async ({ page }) => {
    const filter = page.getByTestId('category-filter');
    await expect(filter).toBeVisible();

    await filter.selectOption({ value: '2' });
    await page.getByTestId('apply-filters').click();

    await expect(page).toHaveURL(/(?:\?|&)category=2(?:&|$)/);
    const cards = page.locator('[data-testid="game-card"]:visible');
    await expect(cards).toHaveCount(4);

    for (let index = 0; index < 4; index++) {
      await expect(cards.nth(index).locator('[data-testid="game-category"]')).toContainText('Puzzle');
    }
  });

  test('should filter the games list by publisher', async ({ page }) => {
    const filter = page.getByTestId('publisher-filter');
    await expect(filter).toBeVisible();

    await filter.selectOption({ value: '1' });
    await page.getByTestId('apply-filters').click();

    await expect(page).toHaveURL(/(?:\?|&)publisher=1(?:&|$)/);
    await expect(page.getByTestId('clear-filters')).toBeVisible();

    const cards = page.locator('[data-testid="game-card"]:visible');
    await expect(cards).toHaveCount(6);

    for (let index = 0; index < 6; index++) {
      await expect(cards.nth(index).locator('[data-testid="game-publisher"]')).toContainText('CodeForge Studios');
    }
  });

  test('should combine category and publisher filters', async ({ page }) => {
    await page.getByTestId('category-filter').selectOption({ value: '2' });
    await page.getByTestId('publisher-filter').selectOption({ value: '1' });
    await page.getByTestId('apply-filters').click();

    await expect(page).toHaveURL(/category=2.*publisher=1/);
    const cards = page.locator('[data-testid="game-card"]:visible');
    await expect(cards).toHaveCount(1);
    await expect(cards.nth(0).locator('[data-testid="game-category"]')).toContainText('Puzzle');
    await expect(cards.nth(0).locator('[data-testid="game-publisher"]')).toContainText('CodeForge Studios');
  });

  test('should display an empty state when filters have no matches', async ({ page }) => {
    await page.goto('/');

    await page.evaluate(() => {
      const categoryFilter = document.querySelector('[data-testid="category-filter"]');
      const publisherFilter = document.querySelector('[data-testid="publisher-filter"]');

      if (categoryFilter instanceof HTMLSelectElement) {
        Object.defineProperty(categoryFilter, 'value', { value: '999999', configurable: true });
      }

      if (publisherFilter instanceof HTMLSelectElement) {
        Object.defineProperty(publisherFilter, 'value', { value: '999999', configurable: true });
      }
    });

    await page.getByTestId('apply-filters').click();

    await expect(page.getByTestId('empty-state')).toBeVisible();
    await expect(page.getByTestId('empty-state-text')).toContainText('No games available');
  });
});
