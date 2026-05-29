import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import React, { FormEvent, useEffect, useMemo, useState } from 'react';

import {
  createTodo,
  deleteTodo,
  getTodos,
  reorderTodos,
  toggleTodo,
} from './services/todoApi';
import { TodoItem } from './types/todo';
import './App.css';

type TodoRowProps = {
  item: TodoItem;
  onToggleDone: (item: TodoItem) => Promise<void>;
  onDelete: (itemId: number) => Promise<void>;
};

const sortByDisplayOrder = (items: TodoItem[]): TodoItem[] =>
  [...items].sort((a, b) => a.display_order - b.display_order);

function TodoRow({ item, onToggleDone, onDelete }: TodoRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`todo-item ${item.is_done === 1 ? 'todo-item-done' : ''}`}
      aria-label={`Todo ${item.name}`}
    >
      <button
        type="button"
        className="drag-handle"
        aria-label={`Drag ${item.name}`}
        {...attributes}
        {...listeners}
      >
        :::
      </button>

      <label className="todo-label">
        <input
          type="checkbox"
          checked={item.is_done === 1}
          onChange={() => {
            void onToggleDone(item);
          }}
          aria-label={`Mark ${item.name} as done`}
        />
        <span className="todo-name">{item.name}</span>
      </label>

      <button
        onClick={() => {
          void onDelete(item.id);
        }}
        className="delete-btn"
        type="button"
      >
        Delete
      </button>
    </li>
  );
}

function App() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [newTodoName, setNewTodoName] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const loadTodos = async () => {
      try {
        setLoading(true);
        const result = await getTodos();
        setTodos(sortByDisplayOrder(result));
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(`Failed to fetch data: ${message}`);
      } finally {
        setLoading(false);
      }
    };

    void loadTodos();
  }, []);

  const todoIds = useMemo(() => todos.map((item) => item.id), [todos]);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = newTodoName.trim();

    if (!trimmedName) {
      setError('Please enter a task name before adding.');
      return;
    }

    try {
      setIsSaving(true);
      const created = await createTodo(trimmedName);
      setTodos((previous) => sortByDisplayOrder([...previous, created]));
      setNewTodoName('');
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(`Error adding item: ${message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleDone = async (item: TodoItem) => {
    const previousTodos = todos;
    const nextDoneValue = item.is_done === 1 ? 0 : 1;

    setTodos((current) =>
      current.map((todo) => (todo.id === item.id ? { ...todo, is_done: nextDoneValue } : todo))
    );

    try {
      const updated = await toggleTodo(item.id, nextDoneValue === 1);
      setTodos((current) =>
        current.map((todo) => (todo.id === updated.id ? updated : todo))
      );
      setError(null);
    } catch (err) {
      setTodos(previousTodos);
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(`Error updating item: ${message}`);
    }
  };

  const handleDelete = async (itemId: number) => {
    const previousTodos = todos;
    setTodos((current) => current.filter((item) => item.id !== itemId));

    try {
      await deleteTodo(itemId);
      setError(null);
    } catch (err) {
      setTodos(previousTodos);
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(`Error deleting item: ${message}`);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = todos.findIndex((item) => item.id === active.id);
    const newIndex = todos.findIndex((item) => item.id === over.id);

    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    const reordered = arrayMove(todos, oldIndex, newIndex).map((item, index) => ({
      ...item,
      display_order: index + 1,
    }));

    const previousTodos = todos;
    setTodos(reordered);

    try {
      const orderedIds = reordered.map((item) => item.id);
      const persisted = await reorderTodos({ orderedIds });
      setTodos(sortByDisplayOrder(persisted));
      setError(null);
    } catch (err) {
      setTodos(previousTodos);
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(`Error reordering items: ${message}`);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>To Do App</h1>
        <p>Plan, finish, and reorder your tasks with ease.</p>
      </header>

      <main>
        <section className="add-item-section" aria-labelledby="add-task-title">
          <h2 id="add-task-title">Add Task</h2>
          <form onSubmit={handleCreate}>
            <label htmlFor="new-task" className="input-label">
              Task name
            </label>
            <div className="input-row">
              <input
                id="new-task"
                type="text"
                value={newTodoName}
                onChange={(event) => setNewTodoName(event.target.value)}
                placeholder="Enter a task"
              />
              <button type="submit" disabled={isSaving}>
                {isSaving ? 'Adding...' : 'Add Task'}
              </button>
            </div>
          </form>
        </section>

        <section className="items-section" aria-labelledby="task-list-title">
          <h2 id="task-list-title">Tasks</h2>
          {loading && <p>Loading data...</p>}
          {error && <p className="error" role="alert">{error}</p>}
          {!loading && !error && todos.length === 0 && <p>No items found. Add some!</p>}
          {!loading && todos.length > 0 && (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={todoIds} strategy={verticalListSortingStrategy}>
                <ul>
                  {todos.map((item) => (
                    <TodoRow
                      key={item.id}
                      item={item}
                      onToggleDone={handleToggleDone}
                      onDelete={handleDelete}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
