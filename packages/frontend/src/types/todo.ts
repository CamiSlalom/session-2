export type TodoItem = {
  id: number;
  name: string;
  is_done: number;
  display_order: number;
  created_at: string;
};

export type ReorderTodosRequest = {
  orderedIds: number[];
};
