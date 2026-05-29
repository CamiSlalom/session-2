import { act } from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import React from 'react';

import App from '../App';
import {
  deleteTodo,
  getTodos,
  reorderTodos,
  toggleTodo,
} from '../services/todoApi';

let dragEndHandler: ((event: { active: { id: number }; over: { id: number } | null }) => Promise<void> | void) | null = null;

jest.mock('@dnd-kit/core', () => ({
  closestCenter: jest.fn(),
  DndContext: ({ children, onDragEnd }: { children: React.ReactNode; onDragEnd: typeof dragEndHandler }) => {
    dragEndHandler = onDragEnd;
    return <div data-testid="mock-dnd-context">{children}</div>;
  },
  KeyboardSensor: jest.fn(),
  PointerSensor: jest.fn(),
  useSensor: jest.fn(() => ({})),
  useSensors: jest.fn(() => []),
}));

jest.mock('@dnd-kit/sortable', () => ({
  arrayMove: <T,>(arr: T[], from: number, to: number) => {
    const copy = [...arr];
    const [item] = copy.splice(from, 1);
    copy.splice(to, 0, item);
    return copy;
  },
  SortableContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  sortableKeyboardCoordinates: jest.fn(),
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    transition: undefined,
    isDragging: false,
  }),
  verticalListSortingStrategy: jest.fn(),
}));

jest.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: jest.fn(() => ''),
    },
  },
}));

jest.mock('../services/todoApi', () => ({
  createTodo: jest.fn(),
  deleteTodo: jest.fn(),
  getTodos: jest.fn(),
  reorderTodos: jest.fn(),
  toggleTodo: jest.fn(),
}));

const mockedGetTodos = getTodos as jest.MockedFunction<typeof getTodos>;
const mockedDeleteTodo = deleteTodo as jest.MockedFunction<typeof deleteTodo>;
const mockedReorderTodos = reorderTodos as jest.MockedFunction<typeof reorderTodos>;
const mockedToggleTodo = toggleTodo as jest.MockedFunction<typeof toggleTodo>;

const initialTodos = [
  { id: 1, name: 'Test Item 1', is_done: 0, display_order: 1, created_at: '2023-01-01T00:00:00.000Z' },
  { id: 2, name: 'Test Item 2', is_done: 0, display_order: 2, created_at: '2023-01-02T00:00:00.000Z' },
];

const getVisibleOrder = (): string[] => {
  const rows = screen.getAllByRole('listitem');
  return rows.map((row) => within(row).getByText(/Test Item/).textContent ?? '');
};

describe('App DnD and optimistic interaction branches', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    dragEndHandler = null;
    mockedGetTodos.mockResolvedValue(initialTodos);
    mockedDeleteTodo.mockResolvedValue(undefined);
    mockedReorderTodos.mockResolvedValue(initialTodos);
    mockedToggleTodo.mockImplementation(async (id, isDone) => ({
      id,
      name: `Test Item ${id}`,
      is_done: isDone ? 1 : 0,
      display_order: id,
      created_at: new Date().toISOString(),
    }));
  });

  test('skips reorder when dropped outside a target', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Test Item 1')).toBeInTheDocument();
    });

    await act(async () => {
      await dragEndHandler?.({ active: { id: 1 }, over: null });
    });

    expect(mockedReorderTodos).not.toHaveBeenCalled();
  });

  test('skips reorder when active and over ids are the same', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Test Item 1')).toBeInTheDocument();
    });

    await act(async () => {
      await dragEndHandler?.({ active: { id: 1 }, over: { id: 1 } });
    });

    expect(mockedReorderTodos).not.toHaveBeenCalled();
  });

  test('skips reorder when drag ids cannot be found in current todos', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Test Item 1')).toBeInTheDocument();
    });

    await act(async () => {
      await dragEndHandler?.({ active: { id: 99 }, over: { id: 1 } });
    });

    expect(mockedReorderTodos).not.toHaveBeenCalled();
  });

  test('reverts optimistic reorder when reorder API fails', async () => {
    mockedReorderTodos.mockRejectedValue(new Error('Reorder failed'));
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Test Item 1')).toBeInTheDocument();
    });

    await act(async () => {
      await dragEndHandler?.({ active: { id: 1 }, over: { id: 2 } });
    });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Error reordering items: Reorder failed');
    });

    expect(getVisibleOrder()).toEqual(['Test Item 1', 'Test Item 2']);
  });

  test('reverts optimistic toggle when toggle API fails', async () => {
    mockedToggleTodo.mockRejectedValue(new Error('Toggle failed'));
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Test Item 1')).toBeInTheDocument();
    });

    const todoRow = screen.getByLabelText('Todo Test Item 1');
    const checkbox = within(todoRow).getByRole('checkbox', {
      name: 'Mark Test Item 1 as done',
    });

    expect(checkbox).not.toBeChecked();

    await act(async () => {
      checkbox.click();
    });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Error updating item: Toggle failed');
    });

    expect(checkbox).not.toBeChecked();
  });

  test('clears error on successful delete and removes item', async () => {
    mockedToggleTodo.mockRejectedValueOnce(new Error('Toggle failed'));
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Test Item 1')).toBeInTheDocument();
    });

    const todoRow = screen.getByLabelText('Todo Test Item 1');
    const checkbox = within(todoRow).getByRole('checkbox', {
      name: 'Mark Test Item 1 as done',
    });

    await act(async () => {
      checkbox.click();
    });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Error updating item: Toggle failed');
    });

    const deleteButton = within(todoRow).getByRole('button', { name: 'Delete' });
    await act(async () => {
      deleteButton.click();
    });

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.queryByText('Test Item 1')).not.toBeInTheDocument();
    });
  });

  test('uses persisted reorder response, sorts by display_order, and clears errors', async () => {
    mockedToggleTodo.mockRejectedValueOnce(new Error('Toggle failed'));
    mockedReorderTodos.mockResolvedValueOnce([
      { id: 1, name: 'Test Item 1', is_done: 0, display_order: 2, created_at: '2023-01-01T00:00:00.000Z' },
      { id: 2, name: 'Test Item 2', is_done: 0, display_order: 1, created_at: '2023-01-02T00:00:00.000Z' },
    ]);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Test Item 1')).toBeInTheDocument();
    });

    const todoRow = screen.getByLabelText('Todo Test Item 1');
    const checkbox = within(todoRow).getByRole('checkbox', {
      name: 'Mark Test Item 1 as done',
    });

    await act(async () => {
      checkbox.click();
    });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Error updating item: Toggle failed');
    });

    await act(async () => {
      await dragEndHandler?.({ active: { id: 1 }, over: { id: 2 } });
    });

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    expect(getVisibleOrder()).toEqual(['Test Item 2', 'Test Item 1']);
  });
});
