import { describe, it, expect } from 'vitest';
import { recipes, Recipe } from '@/data/recipes';

// 검색 필터링 로직 — API route에서 사용하는 것과 동일한 로직을 유닛 테스트
function filterBySearch(list: Recipe[], query: string): Recipe[] {
  const q = query.toLowerCase();
  return list.filter(
    (r) =>
      r.title.toLowerCase().includes(q) ||
      r.ingredients.some((ing) => ing.toLowerCase().includes(q))
  );
}

// 카테고리 필터링 로직
function filterByCategory(list: Recipe[], category: string): Recipe[] {
  return list.filter((r) => r.category === category);
}

// 별점 가중 평균 계산 — 기존 평점에 새 평점을 반영
function calculateWeightedRating(
  currentRating: number,
  ratingCount: number,
  newRating: number
): number {
  return (currentRating * ratingCount + newRating) / (ratingCount + 1);
}

describe('레시피 데이터 검증', () => {
  it('recipes 배열이 비어있지 않아야 한다', () => {
    expect(recipes.length).toBeGreaterThan(0);
  });

  it('각 레시피가 필수 필드를 가져야 한다', () => {
    recipes.forEach((recipe) => {
      expect(recipe.id).toBeDefined();
      expect(recipe.title).toBeTruthy();
      expect(recipe.description).toBeTruthy();
      expect(recipe.ingredients.length).toBeGreaterThan(0);
      expect(recipe.steps.length).toBeGreaterThan(0);
      expect(recipe.category).toBeTruthy();
      expect(recipe.rating).toBeGreaterThanOrEqual(0);
      expect(recipe.rating).toBeLessThanOrEqual(5);
    });
  });
});

describe('검색 필터링 로직', () => {
  it('"김치" 검색 시 김치찌개가 결과에 포함되어야 한다', () => {
    const result = filterBySearch(recipes, '김치');
    const titles = result.map((r) => r.title);
    expect(titles).toContain('김치찌개');
  });

  it('재료 기반 검색이 동작해야 한다 ("두부" 검색)', () => {
    const result = filterBySearch(recipes, '두부');
    // 김치찌개, 된장찌개 모두 두부를 포함
    expect(result.length).toBeGreaterThanOrEqual(2);
  });

  it('존재하지 않는 검색어는 빈 배열을 반환해야 한다', () => {
    const result = filterBySearch(recipes, 'xxxxxxx');
    expect(result).toHaveLength(0);
  });

  it('빈 문자열 검색 시 전체 레시피를 반환해야 한다', () => {
    const result = filterBySearch(recipes, '');
    expect(result.length).toBe(recipes.length);
  });
});

describe('카테고리 필터링 로직', () => {
  it('"찌개" 카테고리 필터링 시 찌개 레시피만 반환해야 한다', () => {
    const result = filterByCategory(recipes, '찌개');
    expect(result.length).toBeGreaterThanOrEqual(2);
    result.forEach((r) => {
      expect(r.category).toBe('찌개');
    });
  });

  it('존재하지 않는 카테고리는 빈 배열을 반환해야 한다', () => {
    const result = filterByCategory(recipes, '존재하지않는카테고리');
    expect(result).toHaveLength(0);
  });
});

describe('별점 가중 평균 계산', () => {
  it('새 평점이 기존 평점에 올바르게 반영되어야 한다', () => {
    // 기존 평점 4.0, 평가 수 10, 새 평점 5 → (4.0 * 10 + 5) / 11 ≈ 4.09
    const result = calculateWeightedRating(4.0, 10, 5);
    expect(result).toBeCloseTo(4.09, 1);
  });

  it('첫 번째 평점 계산이 정확해야 한다', () => {
    // 기존 평점 0, 평가 수 0, 새 평점 3 → 3 / 1 = 3.0
    const result = calculateWeightedRating(0, 0, 3);
    expect(result).toBe(3.0);
  });

  it('동일한 평점 추가 시 평균이 유지되어야 한다', () => {
    // 기존 평점 4.5, 평가 수 100, 새 평점 4.5 → 평균 유지
    const result = calculateWeightedRating(4.5, 100, 4.5);
    expect(result).toBeCloseTo(4.5, 2);
  });
});
