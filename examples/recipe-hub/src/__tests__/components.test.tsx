import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StarRating from '@/components/StarRating';
import RecipeList from '@/components/RecipeList';
import RecipeCard from '@/components/RecipeCard';
import { Recipe } from '@/data/recipes';

// next/link 모킹 — 테스트 환경에서 Link 컴포넌트를 단순 앵커로 대체
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) =>
    <a href={href}>{children}</a>,
}));

// next/image 모킹 — 테스트 환경에서 Image 컴포넌트를 단순 img로 대체
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string }) =>
    <img src={src} alt={alt} {...props} />,
}));

// 테스트용 레시피 데이터
const mockRecipe: Recipe = {
  id: '99',
  title: '테스트 레시피',
  description: '테스트용 레시피 설명입니다',
  ingredients: ['재료1', '재료2'],
  steps: ['단계1', '단계2'],
  imageUrl: 'https://placehold.co/600x400',
  category: '테스트',
  rating: 4.2,
  ratingCount: 50,
  createdAt: '2026-03-01T00:00:00Z',
};

describe('RecipeCard 렌더링', () => {
  it('레시피 제목이 표시되어야 한다', () => {
    render(<RecipeCard recipe={mockRecipe} />);
    expect(screen.getByText('테스트 레시피')).toBeDefined();
  });

  it('카테고리 뱃지가 표시되어야 한다', () => {
    render(<RecipeCard recipe={mockRecipe} />);
    expect(screen.getByText('테스트')).toBeDefined();
  });

  it('레시피 설명이 표시되어야 한다', () => {
    render(<RecipeCard recipe={mockRecipe} />);
    expect(screen.getByText('테스트용 레시피 설명입니다')).toBeDefined();
  });

  it('상세 페이지 링크가 올바른 경로를 가져야 한다', () => {
    render(<RecipeCard recipe={mockRecipe} />);
    const link = screen.getByRole('link');
    expect(link.getAttribute('href')).toBe('/recipes/99');
  });
});

describe('StarRating 표시', () => {
  it('평가 수가 올바르게 표시되어야 한다', () => {
    render(<StarRating rating={4.2} ratingCount={50} readonly />);
    expect(screen.getByText('(50개 평가)')).toBeDefined();
  });

  it('별 버튼이 5개 렌더링되어야 한다', () => {
    render(<StarRating rating={3} ratingCount={10} readonly />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(5);
  });

  it('readonly일 때 버튼이 비활성화되어야 한다', () => {
    render(<StarRating rating={4} ratingCount={20} readonly />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });
});

describe('RecipeList 빈 목록', () => {
  it('레시피가 없을 때 안내 메시지가 표시되어야 한다', () => {
    render(<RecipeList recipes={[]} />);
    expect(screen.getByText('레시피가 없습니다')).toBeDefined();
  });

  it('레시피가 있을 때 카드가 렌더링되어야 한다', () => {
    render(<RecipeList recipes={[mockRecipe]} />);
    expect(screen.getByText('테스트 레시피')).toBeDefined();
  });
});
