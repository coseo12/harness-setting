export type TodoCategory = 'personal' | 'work' | 'health' | 'study';

export interface Todo {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  category: TodoCategory;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTodoRequest {
  title: string;
  description?: string;
  category?: TodoCategory;
}

export interface UpdateTodoRequest {
  title?: string;
  description?: string;
  completed?: boolean;
  category?: TodoCategory;
}

export type TodoFilter = '' | 'completed' | 'active';

export interface TodoListResponse {
  todos: Todo[];
}

export interface TodoResponse {
  todo: Todo;
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
  };
}
