import { NextRequest, NextResponse } from 'next/server';
import { recipes, Recipe } from '@/data/recipes';

// GET: 전체 레시피 목록 반환 (검색/카테고리 필터링 지원)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.toLowerCase();
  const category = searchParams.get('category');

  let filtered = recipes;

  // 제목 또는 재료로 검색
  if (query) {
    filtered = filtered.filter(
      (recipe) =>
        recipe.title.toLowerCase().includes(query) ||
        recipe.ingredients.some((ingredient) =>
          ingredient.toLowerCase().includes(query)
        )
    );
  }

  // 카테고리 필터링
  if (category) {
    filtered = filtered.filter((recipe) => recipe.category === category);
  }

  return NextResponse.json({ data: filtered });
}

// POST: 새 레시피 추가
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, ingredients, steps, imageUrl, category } = body;

    // 필수 필드 검증
    if (!title || !description || !ingredients || !steps || !category) {
      return NextResponse.json(
        { error: '필수 항목이 누락되었습니다.' },
        { status: 400 }
      );
    }

    const newRecipe: Recipe = {
      id: crypto.randomUUID(),
      title,
      description,
      ingredients,
      steps,
      imageUrl: imageUrl || `https://placehold.co/600x400/orange/white?text=${encodeURIComponent(title)}`,
      category,
      rating: 0,
      ratingCount: 0,
      createdAt: new Date().toISOString(),
    };

    recipes.push(newRecipe);

    return NextResponse.json({ data: newRecipe }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: '잘못된 요청 형식입니다.' },
      { status: 400 }
    );
  }
}
