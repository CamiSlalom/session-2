import {
  createTodo,
  deleteTodo,
  getTodos,
  reorderTodos,
  toggleTodo,
} from '../services/todoApi';

type MockResponseOptions = {
  ok: boolean;
  status?: number;
  jsonValue?: unknown;
  jsonError?: Error;
};

const buildResponse = ({ ok, status = 200, jsonValue, jsonError }: MockResponseOptions): Response => {
  return {
    ok,
    status,
    json: jest.fn().mockImplementation(() => {
      if (jsonError) {
        return Promise.reject(jsonError);
      }

      return Promise.resolve(jsonValue);
    }),
  } as unknown as Response;
};

describe('todoApi', () => {
  beforeEach(() => {
    Object.defineProperty(global, 'fetch', {
      writable: true,
      value: jest.fn(),
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('getTodos returns items on success', async () => {
    const items = [{ id: 1, name: 'A', is_done: 0, display_order: 1, created_at: 'now' }];
    (global.fetch as jest.Mock).mockResolvedValue(buildResponse({ ok: true, jsonValue: items }));

    const result = await getTodos();

    expect(global.fetch).toHaveBeenCalledWith('/api/items');
    expect(result).toEqual(items);
  });

  test('getTodos throws API-provided error message', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      buildResponse({ ok: false, status: 500, jsonValue: { error: 'Server exploded' } })
    );

    await expect(getTodos()).rejects.toThrow('Server exploded');
  });

  test('getTodos falls back to default error when response JSON cannot be parsed', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      buildResponse({ ok: false, status: 500, jsonError: new Error('Invalid JSON') })
    );

    await expect(getTodos()).rejects.toThrow('Failed to fetch items');
  });

  test('createTodo sends POST payload and returns created item', async () => {
    const created = { id: 9, name: 'Write tests', is_done: 0, display_order: 9, created_at: 'now' };
    (global.fetch as jest.Mock).mockResolvedValue(buildResponse({ ok: true, status: 201, jsonValue: created }));

    const result = await createTodo('Write tests');

    expect(global.fetch).toHaveBeenCalledWith('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Write tests' }),
    });
    expect(result).toEqual(created);
  });

  test('createTodo falls back to default message when API error payload is missing', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(buildResponse({ ok: false, status: 400, jsonValue: {} }));

    await expect(createTodo('Nope')).rejects.toThrow('Failed to create item');
  });

  test('toggleTodo sends PATCH and returns updated item', async () => {
    const updated = { id: 3, name: 'x', is_done: 1, display_order: 3, created_at: 'now' };
    (global.fetch as jest.Mock).mockResolvedValue(buildResponse({ ok: true, jsonValue: updated }));

    const result = await toggleTodo(3, true);

    expect(global.fetch).toHaveBeenCalledWith('/api/items/3', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isDone: true }),
    });
    expect(result).toEqual(updated);
  });

  test('reorderTodos throws API-provided message on failure', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      buildResponse({ ok: false, status: 400, jsonValue: { error: 'Bad ordering' } })
    );

    await expect(reorderTodos({ orderedIds: [2, 1] })).rejects.toThrow('Bad ordering');
  });

  test('deleteTodo sends DELETE request', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(buildResponse({ ok: true, status: 200, jsonValue: {} }));

    await expect(deleteTodo(11)).resolves.toBeUndefined();
    expect(global.fetch).toHaveBeenCalledWith('/api/items/11', {
      method: 'DELETE',
    });
  });

  test('deleteTodo throws fallback error when JSON parsing fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      buildResponse({ ok: false, status: 500, jsonError: new Error('Not JSON') })
    );

    await expect(deleteTodo(4)).rejects.toThrow('Failed to delete item');
  });
});
