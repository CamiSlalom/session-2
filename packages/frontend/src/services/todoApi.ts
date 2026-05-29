import { ReorderTodosRequest, TodoItem } from '../types/todo';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
};

const parseError = async (response: Response, fallbackMessage: string): Promise<string> => {
  try {
    const payload = (await response.json()) as { error?: string };
    if (payload?.error) {
      return payload.error;
    }
  } catch (error) {
    // Ignore JSON parsing issues and return fallback message.
  }

  return fallbackMessage;
};

export const getTodos = async (): Promise<TodoItem[]> => {
  const response = await fetch('/api/items');
  if (!response.ok) {
    const message = await parseError(response, 'Failed to fetch items');
    throw new Error(message);
  }

  return (await response.json()) as TodoItem[];
};

export const createTodo = async (name: string): Promise<TodoItem> => {
  const response = await fetch('/api/items', {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    const message = await parseError(response, 'Failed to create item');
    throw new Error(message);
  }

  return (await response.json()) as TodoItem;
};

export const toggleTodo = async (id: number, isDone: boolean): Promise<TodoItem> => {
  const response = await fetch(`/api/items/${id}`, {
    method: 'PATCH',
    headers: JSON_HEADERS,
    body: JSON.stringify({ isDone }),
  });

  if (!response.ok) {
    const message = await parseError(response, 'Failed to update item');
    throw new Error(message);
  }

  return (await response.json()) as TodoItem;
};

export const reorderTodos = async (payload: ReorderTodosRequest): Promise<TodoItem[]> => {
  const response = await fetch('/api/items/reorder', {
    method: 'PATCH',
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await parseError(response, 'Failed to reorder items');
    throw new Error(message);
  }

  return (await response.json()) as TodoItem[];
};

export const deleteTodo = async (id: number): Promise<void> => {
  const response = await fetch(`/api/items/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const message = await parseError(response, 'Failed to delete item');
    throw new Error(message);
  }
};
