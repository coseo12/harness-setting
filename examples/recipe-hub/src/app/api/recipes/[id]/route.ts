import { NextRequest, NextResponse } from 'next/server';
import { recipes } from '@/data/recipes';

// GET: 단일 레시피 조회
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const recipe = recipes.find((r) => r.id === id);

  if (!recipe) {
    return NextResponse.json(
      { error: '레시피를 찾을 수 없습니다.' },
      { status: 404 }
    );
  }

  return NextResponse.json({ data: recipe });
}
