'use client';

import { useState, useEffect } from 'react';
import SearchBar from '@/components/SearchBar';
import RecipeList from '@/components/RecipeList';
import { Recipe } from '@/data/recipes';

// 카테고리 필터 목록
const CATEGORIES = ['전체', '찌개', '볶음', '밥', '면', '구이', '기타'];

export default function HomePage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [isLoading, setIsLoading] = useState(true);

  // 검색어 또는 카테고리 변경 시 레시피 목록 갱신
  useEffect(() => {
    const fetchRecipes = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (searchQuery) params.set('q', searchQuery);
        if (selectedCategory !== '전체') params.set('category', selectedCategory);

        const res = await fetch(`/api/recipes?${params.toString()}`);
        const json = await res.json();
        setRecipes(json.data ?? []);
      } catch {
        setRecipes([]);
      } finally {
        setIsLoading(false);
      }
    };

    // 검색 디바운싱 (300ms)
    const timer = setTimeout(fetchRecipes, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* 헤더 영역 */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
          레시피 모음
        </h1>
        <p className="mt-2 text-gray-600">
          다양한 한식 레시피를 검색하고 평가해보세요
        </p>
      </div>

      {/* 검색 바 */}
      <div className="mb-6 flex justify-center">
        <div className="w-full max-w-lg">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>
      </div>

      {/* 카테고리 필터 */}
      <div className="mb-8 flex flex-wrap justify-center gap-2">
        {CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              selectedCategory === category
                ? 'bg-orange-500 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* 로딩 상태 */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
          <span className="ml-3 text-gray-500">로딩 중...</span>
        </div>
      ) : (
        <RecipeList recipes={recipes} />
      )}
    </div>
  );
}
