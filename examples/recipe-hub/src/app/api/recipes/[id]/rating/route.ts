import { NextRequest, NextResponse } from 'next/server';
import { recipes } from '@/data/recipes';

// POST: 별점 추가 (기존 평균에 새 평점 반영)
export async function POST(
  request: NextRequest,
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

  try {
    const body = await request.json();
    const { rating } = body;

    // 별점 유효성 검증 (1~5)
    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: '별점은 1에서 5 사이의 숫자여야 합니다.' },
        { status: 400 }
      );
    }

    // 가중 평균으로 새 평점 반영
    const totalRating = recipe.rating * recipe.ratingCount + rating;
    recipe.ratingCount += 1;
    recipe.rating = Math.round((totalRating / recipe.ratingCount) * 10) / 10;

    return NextResponse.json({ data: recipe });
  } catch {
    return NextResponse.json(
      { error: '잘못된 요청 형식입니다.' },
      { status: 400 }
    );
  }
}
