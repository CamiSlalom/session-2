import { expect, test } from '@playwright/test';

import { TodoPage } from './page-objects/TodoPage';

test.describe('TODO workflow', () => {
  let todoPage: TodoPage;

  test.beforeEach(async ({ page }) => {
    todoPage = new TodoPage(page);
    await todoPage.goto();
  });

  test.afterEach(async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'To Do App' })).toBeVisible();
  });

  test('creates, completes, and reorders a task', async ({ page }) => {
    const taskName = `E2E Task ${Date.now()}`;

    await todoPage.addTask(taskName);
    await todoPage.toggleTaskDone(taskName);

    await expect(todoPage.taskRow(taskName)).toHaveClass(/todo-item-done/);

    await todoPage.dragTaskAbove(taskName, 'Item 1');

    const firstRow = page.locator('ul > li').first();
    await expect(firstRow).toContainText(taskName);
  });
});
