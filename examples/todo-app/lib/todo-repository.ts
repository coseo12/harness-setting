import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { Todo, CreateTodoRequest, UpdateTodoRequest, TodoFilter } from './types';

const DATA_FILE = path.join(process.cwd(), 'data', 'todos.json');

function ensureDataFile(): void {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, '[]', 'utf-8');
  }
}

function readTodos(): Todo[] {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeTodos(todos: Todo[]): void {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(todos, null, 2), 'utf-8');
}

export const todoRepository = {
  getAll(filter?: TodoFilter): Todo[] {
    let todos = readTodos();
    if (filter === 'completed') {
      todos = todos.filter((t) => t.completed);
    } else if (filter === 'active') {
      todos = todos.filter((t) => !t.completed);
    }
    return todos;
  },

  getById(id: string): Todo | undefined {
    return readTodos().find((t) => t.id === id);
  },

  create(input: CreateTodoRequest): Todo {
    const now = new Date().toISOString();
    const todo: Todo = {
      id: randomUUID(),
      title: input.title.trim(),
      description: (input.description ?? '').trim(),
      completed: false,
      createdAt: now,
      updatedAt: now,
    };
    const todos = readTodos();
    todos.push(todo);
    writeTodos(todos);
    return todo;
  },

  update(id: string, input: UpdateTodoRequest): Todo | null {
    const todos = readTodos();
    const index = todos.findIndex((t) => t.id === id);
    if (index === -1) return null;

    if (input.title !== undefined) {
      todos[index].title = input.title.trim();
    }
    if (input.description !== undefined) {
      todos[index].description = String(input.description).trim();
    }
    if (input.completed !== undefined) {
      todos[index].completed = Boolean(input.completed);
    }
    todos[index].updatedAt = new Date().toISOString();

    writeTodos(todos);
    return todos[index];
  },

  delete(id: string): boolean {
    const todos = readTodos();
    const index = todos.findIndex((t) => t.id === id);
    if (index === -1) return false;
    todos.splice(index, 1);
    writeTodos(todos);
    return true;
  },

  /** 테스트용: 데이터 초기화 */
  reset(): void {
    writeTodos([]);
  },
};
