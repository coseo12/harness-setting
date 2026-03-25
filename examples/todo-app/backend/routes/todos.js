const express = require('express');
const { randomUUID } = require('crypto');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const DATA_FILE = path.join(__dirname, '..', 'data', 'todos.json');

// 데이터 읽기/쓰기 헬퍼
function readTodos() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeTodos(todos) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(todos, null, 2), 'utf-8');
}

// GET /api/todos — 전체 목록 (filter 지원)
router.get('/', (req, res) => {
  let todos = readTodos();
  const { filter } = req.query;

  if (filter === 'completed') {
    todos = todos.filter((t) => t.completed);
  } else if (filter === 'active') {
    todos = todos.filter((t) => !t.completed);
  }

  res.json({ todos });
});

// POST /api/todos — 생성
router.post('/', (req, res) => {
  const { title, description = '' } = req.body;

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: '제목은 필수입니다.' },
    });
  }

  if (title.length > 200) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: '제목은 200자 이하여야 합니다.',
      },
    });
  }

  const now = new Date().toISOString();
  const todo = {
    id: randomUUID(),
    title: title.trim(),
    description: description.trim(),
    completed: false,
    createdAt: now,
    updatedAt: now,
  };

  const todos = readTodos();
  todos.push(todo);
  writeTodos(todos);

  res.status(201).json({ todo });
});

// PATCH /api/todos/:id — 수정
router.patch('/:id', (req, res) => {
  const { id } = req.params;
  const todos = readTodos();
  const index = todos.findIndex((t) => t.id === id);

  if (index === -1) {
    return res.status(404).json({
      error: { code: 'NOT_FOUND', message: '할 일을 찾을 수 없습니다.' },
    });
  }

  const { title, description, completed } = req.body;

  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: '제목은 비어있을 수 없습니다.' },
      });
    }
    todos[index].title = title.trim();
  }

  if (description !== undefined) {
    todos[index].description = String(description).trim();
  }

  if (completed !== undefined) {
    todos[index].completed = Boolean(completed);
  }

  todos[index].updatedAt = new Date().toISOString();
  writeTodos(todos);

  res.json({ todo: todos[index] });
});

// DELETE /api/todos/:id — 삭제
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const todos = readTodos();
  const index = todos.findIndex((t) => t.id === id);

  if (index === -1) {
    return res.status(404).json({
      error: { code: 'NOT_FOUND', message: '할 일을 찾을 수 없습니다.' },
    });
  }

  todos.splice(index, 1);
  writeTodos(todos);

  res.json({ success: true });
});

module.exports = router;
