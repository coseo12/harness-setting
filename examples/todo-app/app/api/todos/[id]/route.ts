import { NextRequest, NextResponse } from 'next/server';
import { todoRepository } from '@/lib/todo-repository';
import { validateUpdateTitle } from '@/lib/validation';

export const runtime = 'nodejs';

type RouteContext = { params: Promise<{ id: string }> };

// PATCH /api/todos/:id
export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.json();

  const titleError = validateUpdateTitle(body.title);
  if (titleError) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: titleError } },
      { status: 400 },
    );
  }

  const todo = todoRepository.update(id, body);
  if (!todo) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: '할 일을 찾을 수 없습니다.' } },
      { status: 404 },
    );
  }

  return NextResponse.json({ todo });
}

// DELETE /api/todos/:id
export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  const deleted = todoRepository.delete(id);
  if (!deleted) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: '할 일을 찾을 수 없습니다.' } },
      { status: 404 },
    );
  }

  return NextResponse.json({ success: true });
}
