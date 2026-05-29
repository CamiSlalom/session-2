import { expect, Locator, Page } from '@playwright/test';

export class TodoPage {
  readonly page: Page;
  readonly taskInput: Locator;
  readonly addTaskButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.taskInput = page.getByLabel('Task name');
    this.addTaskButton = page.getByRole('button', { name: 'Add Task' });
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
    await expect(this.page.getByRole('heading', { name: 'To Do App' })).toBeVisible();
  }

  taskRow(taskName: string): Locator {
    return this.page.getByLabel(`Todo ${taskName}`);
  }

  async addTask(taskName: string): Promise<void> {
    await this.taskInput.fill(taskName);
    await this.addTaskButton.click();
    await expect(this.taskRow(taskName)).toBeVisible();
  }

  async toggleTaskDone(taskName: string): Promise<void> {
    const row = this.taskRow(taskName);
    const checkbox = row.getByRole('checkbox', { name: `Mark ${taskName} as done` });

    await checkbox.click();
    await expect(checkbox).toBeChecked();
  }

  async dragTaskAbove(taskName: string, targetTaskName: string): Promise<void> {
    const sourceHandle = this.taskRow(taskName).getByRole('button', { name: `Drag ${taskName}` });
    const targetRow = this.taskRow(targetTaskName);

    const sourceBox = await sourceHandle.boundingBox();
    const targetBox = await targetRow.boundingBox();

    if (!sourceBox || !targetBox) {
      throw new Error('Could not locate drag source or target bounds');
    }

    await this.page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
    await this.page.mouse.down();
    await this.page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 4, {
      steps: 20,
    });
    await this.page.mouse.up();

    await expect(this.page.locator('ul > li').first()).toContainText(taskName);
  }
}
