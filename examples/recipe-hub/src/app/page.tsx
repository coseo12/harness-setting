'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import SearchBar from '@/components/SearchBar';
import RecipeList from '@/components/RecipeList';
import { Recipe } from '@/data/recipes';

/* 카테고리 필터 목록 */
const CATEGORIES = ['전체', '찌개', '볶음', '밥', '면', '구이', '기타'];

/* 카테고리 카드 데이터 */
const CATEGORY_CARDS = [
  { icon: '\uD83C\uDF72', name: '찌개', description: '뜨끈한 국물이 그리운 날, 깊은 맛의 한식 찌개' },
  { icon: '\uD83C\uDF73', name: '볶음', description: '불향 가득한 볶음 요리로 입맛을 사로잡다' },
  { icon: '\uD83C\uDF5A', name: '밥', description: '정갈한 한 그릇, 밥 위에 담긴 정성' },
  { icon: '\uD83C\uDF5C', name: '면', description: '쫄깃한 면발에 감칠맛 가득한 한 그릇' },
];

export default function HomePage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [isLoading, setIsLoading] = useState(true);

  /* 검색어 또는 카테고리 변경 시 레시피 목록 갱신 */
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

    /* 검색 디바운싱 (300ms) */
    const timer = setTimeout(fetchRecipes, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory]);

  /* 인기 레시피: 평점 상위 3개 */
  const popularRecipes = [...recipes]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3);

  return (
    <>
      {/* ───── 섹션 1: 히어로 ───── */}
      <section className="relative flex items-center justify-center overflow-hidden" style={{ minHeight: '520px' }}>
        {/* 배경 이미지 */}
        <img
          src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1600&h=800&fit=crop"
          alt="한식 배경"
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* 어두운 오버레이 */}
        <div className="absolute inset-0 bg-black/40" />

        <div className="relative z-10 mx-auto max-w-3xl px-4 py-24 text-center text-white">
          <h1 className="font-serif-title text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
            한식의 맛, 집에서 만나다
          </h1>
          <p className="mt-4 text-lg text-white/85 sm:text-xl">
            정성을 담은 레시피로 매일의 식탁을 특별하게
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a
              href="#recipes"
              className="rounded-lg bg-[#8B6914] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#6B5210]"
            >
              레시피 둘러보기
            </a>
            <Link
              href="/recipes/new"
              className="rounded-lg border-2 border-white px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              레시피 등록
            </Link>
          </div>
        </div>
      </section>

      {/* ───── 섹션 2: 통계 ───── */}
      <section className="bg-[#F5F0E8]">
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 px-4 py-16 sm:grid-cols-3">
          {[
            { number: '6+', label: '엄선된 레시피', desc: '전통 한식의 정수를 담았습니다' },
            { number: '4.5', label: '평균 평점', desc: '검증된 맛을 보장합니다' },
            { number: '1000+', label: '요리사', desc: '함께 만들어가는 레시피' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="font-serif-title text-4xl font-bold text-[#8B6914]">{stat.number}</p>
              <p className="mt-2 text-base font-semibold text-[#3D2B1F]">{stat.label}</p>
              <p className="mt-1 text-sm text-[#9B8E7E]">{stat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───── 섹션 3: 카테고리 ───── */}
      <section className="bg-[#FFFBF0]">
        <div className="mx-auto max-w-6xl px-4 py-20">
          {/* 섹션 제목 */}
          <div className="mb-12 text-center">
            <h2 className="font-serif-title text-3xl font-bold text-[#3D2B1F]">카테고리</h2>
            <div className="mx-auto mt-3 h-0.5 w-16 bg-[#8B6914]" />
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {CATEGORY_CARDS.map((cat) => (
              <a
                key={cat.name}
                href="#recipes"
                onClick={() => setSelectedCategory(cat.name)}
                className="group rounded-xl border border-[#E8DFD0] bg-[#F5F0E8] p-8 text-center transition-shadow hover:shadow-md"
              >
                <span className="text-4xl">{cat.icon}</span>
                <h3 className="mt-4 font-serif-title text-lg font-semibold text-[#3D2B1F]">{cat.name}</h3>
                <p className="mt-2 text-sm text-[#9B8E7E]">{cat.description}</p>
                <p className="mt-4 text-sm font-medium text-[#8B6914] opacity-0 transition-opacity group-hover:opacity-100">
                  자세히 보기 &rarr;
                </p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ───── 섹션 4: 인기 레시피 갤러리 ───── */}
      {popularRecipes.length > 0 && (
        <section className="bg-[#F5F0E8]">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <div className="mb-12 text-center">
              <h2 className="font-serif-title text-3xl font-bold text-[#3D2B1F]">인기 레시피</h2>
              <div className="mx-auto mt-3 h-0.5 w-16 bg-[#8B6914]" />
            </div>

            <RecipeList recipes={popularRecipes} />

            <div className="mt-10 text-center">
              <a href="#recipes" className="text-sm font-medium text-[#8B6914] transition-colors hover:text-[#6B5210]">
                모든 레시피 보기 &rarr;
              </a>
            </div>
          </div>
        </section>
      )}

      {/* ───── 섹션 5: 전체 레시피 목록 ───── */}
      <section id="recipes" className="bg-[#FFFBF0]">
        <div className="mx-auto max-w-6xl px-4 py-20">
          {/* 섹션 제목 */}
          <div className="mb-12 text-center">
            <h2 className="font-serif-title text-3xl font-bold text-[#3D2B1F]">레시피 모음</h2>
            <p className="mt-2 text-[#9B8E7E]">다양한 한식 레시피를 검색하고 평가해보세요</p>
            <div className="mx-auto mt-3 h-0.5 w-16 bg-[#8B6914]" />
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
                className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-[#8B6914] text-white'
                    : 'border border-[#E8DFD0] bg-[#FFFBF0] text-[#3D2B1F] hover:bg-[#F5F0E8]'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* 로딩 상태 */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#8B6914] border-t-transparent" />
              <span className="ml-3 text-[#9B8E7E]">로딩 중...</span>
            </div>
          ) : (
            <RecipeList recipes={recipes} />
          )}
        </div>
      </section>
    </>
  );
}
