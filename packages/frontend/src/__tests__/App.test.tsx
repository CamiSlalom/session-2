import { act } from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

import App from '../App';

type MockTodo = {
  id: number;
  name: string;
  is_done: number;
  display_order: number;
  created_at: string;
};

const mockTodos: MockTodo[] = [
  {
    id: 1,
    name: 'Test Item 1',
    is_done: 0,
    display_order: 1,
    created_at: '2023-01-01T00:00:00.000Z',
  },
  {
    id: 2,
    name: 'Test Item 2',
    is_done: 0,
    display_order: 2,
    created_at: '2023-01-02T00:00:00.000Z',
  },
];

const server = setupServer(
  rest.get('/api/items', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockTodos));
  }),
  rest.post('/api/items', async (req, res, ctx) => {
    const body = (await req.json()) as { name?: string };

    if (!body.name || body.name.trim() === '') {
      return res(ctx.status(400), ctx.json({ error: 'Item name is required' }));
    }

    return res(
      ctx.status(201),
      ctx.json({
        id: 3,
        name: body.name,
        is_done: 0,
        display_order: 3,
        created_at: new Date().toISOString(),
      })
    );
  }),
  rest.patch('/api/items/:id', async (req, res, ctx) => {
    const id = Number(req.params.id);
    const body = (await req.json()) as { isDone?: boolean };

    return res(
      ctx.status(200),
      ctx.json({
        id,
        name: `Test Item ${id}`,
        is_done: body.isDone ? 1 : 0,
        display_order: id,
        created_at: new Date().toISOString(),
      })
    );
  }),
  rest.patch('/api/items/reorder', async (req, res, ctx) => {
    const body = (await req.json()) as { orderedIds: number[] };
    const reordered = body.orderedIds.map((id, index) => ({
      id,
      name: `Test Item ${id}`,
      is_done: 0,
      display_order: index + 1,
      created_at: new Date().toISOString(),
    }));

    return res(ctx.status(200), ctx.json(reordered));
  }),
  rest.delete('/api/items/:id', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ message: 'Item deleted successfully' }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('App Component', () => {
  test('renders the header', async () => {
    await act(async () => {
      render(<App />);
    });

    expect(screen.getByRole('heading', { name: 'To Do App' })).toBeInTheDocument();
    expect(screen.getByText('Plan, finish, and reorder your tasks with ease.')).toBeInTheDocument();
  });

  test('loads and displays items', async () => {
    await act(async () => {
      render(<App />);
    });

    expect(screen.getByText('Loading data...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Test Item 1')).toBeInTheDocument();
      expect(screen.getByText('Test Item 2')).toBeInTheDocument();
    });
  });

  test('adds a new item', async () => {
    const user = userEvent.setup();

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.queryByText('Loading data...')).not.toBeInTheDocument();
    });

    const input = screen.getByLabelText('Task name');
    await act(async () => {
      await user.type(input, 'New Test Item');
    });

    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Add Task' }));
    });

    await waitFor(() => {
      expect(screen.getByText('New Test Item')).toBeInTheDocument();
    });
  });

  test('shows validation error when adding an empty task name', async () => {
    const user = userEvent.setup();

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.queryByText('Loading data...')).not.toBeInTheDocument();
    });

    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Add Task' }));
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Please enter a task name before adding.');
  });

  test('shows API error when adding a task fails', async () => {
    const user = userEvent.setup();

    server.use(
      rest.post('/api/items', async (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: 'Create failed' }));
      })
    );

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.queryByText('Loading data...')).not.toBeInTheDocument();
    });

    await act(async () => {
      await user.type(screen.getByLabelText('Task name'), 'Will Fail');
      await user.click(screen.getByRole('button', { name: 'Add Task' }));
    });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Error adding item: Create failed');
    });
  });

  test('toggles a task as done', async () => {
    const user = userEvent.setup();

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.getByText('Test Item 1')).toBeInTheDocument();
    });

    const todoRow = screen.getByLabelText('Todo Test Item 1');
    const checkbox = within(todoRow).getByRole('checkbox', {
      name: 'Mark Test Item 1 as done',
    });

    await act(async () => {
      await user.click(checkbox);
    });

    await waitFor(() => {
      expect(checkbox).toBeChecked();
    });
  });

  test('handles API error', async () => {
    server.use(
      rest.get('/api/items', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch data/)).toBeInTheDocument();
    });
  });

  test('restores deleted item when delete request fails', async () => {
    const user = userEvent.setup();

    server.use(
      rest.delete('/api/items/:id', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: 'Delete failed' }));
      })
    );

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.getByText('Test Item 1')).toBeInTheDocument();
    });

    await act(async () => {
      await user.click(screen.getAllByRole('button', { name: 'Delete' })[0]);
    });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Error deleting item: Delete failed');
      expect(screen.getByText('Test Item 1')).toBeInTheDocument();
    });
  });

  test('shows empty state when no items', async () => {
    server.use(
      rest.get('/api/items', (req, res, ctx) => {
        return res(ctx.status(200), ctx.json([]));
      })
    );

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.getByText('No items found. Add some!')).toBeInTheDocument();
    });
  });
});
