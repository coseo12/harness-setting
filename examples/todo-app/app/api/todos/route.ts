import { NextRequest, NextResponse } from 'next/server';
import { todoRepository } from '@/lib/todo-repository';
import { validateTitle } from '@/lib/validation';
import type { TodoFilter } from '@/lib/types';

export const runtime = 'nodejs';

// GET /api/todos(?filter=completed|active)
export async function GET(request: NextRequest) {
  const filter = (request.nextUrl.searchParams.get('filter') ?? '') as TodoFilter;
  const todos = todoRepository.getAll(filter || undefined);
  return NextResponse.json({ todos });
}

// POST /api/todos
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, description, category } = body;

  const error = validateTitle(title);
  if (error) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: error } },
      { status: 400 },
    );
  }

  const todo = todoRepository.create({ title, description, category });
  return NextResponse.json({ todo }, { status: 201 });
}
