export interface Todo {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTodoRequest {
  title: string;
  description?: string;
}

export interface UpdateTodoRequest {
  title?: string;
  description?: string;
  completed?: boolean;
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
