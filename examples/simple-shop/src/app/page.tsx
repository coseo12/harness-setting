"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Product } from "@/types/product";
import SearchBar from "@/components/SearchBar";
import ProductList from "@/components/ProductList";

// 카테고리 목록
const CATEGORIES = ["전체", "전자기기", "패션", "생활용품"];

// 정렬 옵션
type SortOrder = "default" | "price-asc" | "price-desc";

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [sortOrder, setSortOrder] = useState<SortOrder>("default");
  const [loading, setLoading] = useState(true);

  // 제품 데이터 로드
  const fetchProducts = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("q", searchQuery.trim());
      if (selectedCategory !== "전체") params.set("category", selectedCategory);
      if (sortOrder !== "default") params.set("sort", sortOrder);

      const queryString = params.toString();
      const url = `/api/products${queryString ? `?${queryString}` : ""}`;
      const res = await fetch(url);
      const json = await res.json();
      setProducts(json.data);
    } catch (error) {
      console.error("제품 로드 실패:", error);
    }
  }, [searchQuery, selectedCategory, sortOrder]);

  // 위시리스트 데이터 로드
  const fetchWishlist = useCallback(async () => {
    try {
      const res = await fetch("/api/wishlist");
      const json = await res.json();
      const ids = (json.data as Product[]).map((p) => p.id);
      setWishlistIds(ids);
    } catch (error) {
      console.error("위시리스트 로드 실패:", error);
    }
  }, []);

  // 초기 로드
  useEffect(() => {
    async function init() {
      await Promise.all([fetchProducts(), fetchWishlist()]);
      setLoading(false);
    }
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 필터/정렬/검색 변경 시 제품 다시 로드
  useEffect(() => {
    if (!loading) {
      fetchProducts();
    }
  }, [searchQuery, selectedCategory, sortOrder, fetchProducts]); // eslint-disable-line react-hooks/exhaustive-deps

  // 위시리스트 토글 핸들러
  const handleWishlistToggle = (productId: string, wishlisted: boolean) => {
    setWishlistIds((prev) =>
      wishlisted ? [...prev, productId] : prev.filter((id) => id !== productId)
    );
  };

  // 피처드 상품 (첫 번째 또는 카테고리 필터링된 첫 번째)
  const featuredProducts = products.slice(0, 2);

  return (
    <div>
      {/* ─── 섹션 1: 히어로 ─── */}
      <section className="relative h-[85vh] overflow-hidden">
        {/* 배경 이미지 */}
        <img
          src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1600&h=900&fit=crop"
          alt="히어로 배경"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* 어두운 오버레이 */}
        <div className="absolute inset-0 bg-black/30" />
        {/* 하단 좌측 텍스트 */}
        <div className="absolute bottom-16 left-8 sm:left-16 z-10 max-w-lg">
          <p className="text-white/80 text-sm tracking-[0.3em] uppercase mb-3">
            Curated Lifestyle
          </p>
          <h1 className="font-serif-title text-4xl sm:text-5xl lg:text-6xl text-white leading-tight mb-6">
            일상을 디자인하다
          </h1>
          <Link
            href="#products"
            className="inline-block px-8 py-3 bg-[var(--color-gold)] text-white text-sm font-medium tracking-wide hover:opacity-90 transition-opacity"
          >
            컬렉션 보기
          </Link>
        </div>
      </section>

      {/* ─── 섹션 2: 카테고리 탭 + 피처드 상품 ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* 카테고리 탭 바 */}
        <div className="flex items-center gap-8 mb-12 border-b border-[var(--color-light-gray)]">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`pb-3 text-sm tracking-wide transition-colors cursor-pointer border-b-2 -mb-px
                ${
                  selectedCategory === category
                    ? "border-[var(--color-gold)] text-[var(--color-charcoal)] font-medium"
                    : "border-transparent text-[var(--color-warm-gray)] hover:text-[var(--color-charcoal)]"
                }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* 비대칭 그리드: 텍스트(좌) + 이미지(우) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* 좌측: 피처드 텍스트 */}
          <div className="lg:col-span-4">
            <p className="text-sm text-[var(--color-gold)] tracking-[0.2em] uppercase mb-3">
              Featured
            </p>
            <h2 className="font-serif-title text-3xl text-[var(--color-charcoal)] leading-snug mb-4">
              이번 주의 추천
            </h2>
            <p className="text-[var(--color-warm-gray)] leading-relaxed mb-6">
              {featuredProducts[0]
                ? featuredProducts[0].description
                : "엄선된 제품으로 일상에 특별함을 더해보세요."}
            </p>
            {featuredProducts[0] && (
              <Link
                href={`/products/${featuredProducts[0].id}`}
                className="text-[var(--color-charcoal)] text-sm font-medium border-b border-[var(--color-charcoal)] hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] transition-colors"
              >
                자세히 보기
              </Link>
            )}
          </div>

          {/* 우측: 비대칭 이미지 2개 */}
          <div className="lg:col-span-8 grid grid-cols-2 gap-4">
            {featuredProducts[0] && (
              <Link href={`/products/${featuredProducts[0].id}`} className="block">
                <div className="aspect-[3/4] bg-[var(--color-soft-beige)] overflow-hidden">
                  <img
                    src={featuredProducts[0].imageUrl}
                    alt={featuredProducts[0].name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <p className="mt-3 font-serif-title text-[var(--color-charcoal)] text-sm">{featuredProducts[0].name}</p>
                <p className="text-[var(--color-gold)] text-sm">{featuredProducts[0].price.toLocaleString()}원</p>
              </Link>
            )}
            {featuredProducts[1] && (
              <Link href={`/products/${featuredProducts[1].id}`} className="block mt-12">
                <div className="aspect-[3/4] bg-[var(--color-soft-beige)] overflow-hidden">
                  <img
                    src={featuredProducts[1].imageUrl}
                    alt={featuredProducts[1].name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <p className="mt-3 font-serif-title text-[var(--color-charcoal)] text-sm">{featuredProducts[1].name}</p>
                <p className="text-[var(--color-gold)] text-sm">{featuredProducts[1].price.toLocaleString()}원</p>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ─── 섹션 3: 프로모션 배너 ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 좌측: 프로모션 카드 */}
          <div className="bg-[var(--color-soft-beige)] p-10 sm:p-14 flex flex-col justify-center">
            <p className="text-sm text-[var(--color-gold)] tracking-[0.2em] uppercase mb-4">
              Special Offer
            </p>
            <h2 className="font-serif-title text-2xl sm:text-3xl text-[var(--color-charcoal)] leading-snug mb-4">
              선별된 라이프스타일,<br />특별한 가격
            </h2>
            <p className="text-[var(--color-warm-gray)] leading-relaxed mb-8">
              취향이 담긴 아이템을 합리적인 가격에 만나보세요.
              매주 새로운 셀렉션이 업데이트됩니다.
            </p>
            <Link
              href="#products"
              className="inline-block w-fit px-8 py-3 bg-[var(--color-charcoal)] text-white text-sm font-medium tracking-wide hover:opacity-90 transition-opacity"
            >
              지금 확인하기
            </Link>
          </div>

          {/* 우측: 라이프스타일 이미지 */}
          <div className="overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1616627547584-bf28cee262db?w=800&h=600&fit=crop"
              alt="라이프스타일"
              className="w-full h-full object-cover min-h-[400px]"
            />
          </div>
        </div>
      </section>

      {/* ─── 섹션 4: 브랜드 스토리 ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* 좌측: 큰 세리프 텍스트 */}
          <div>
            <h2 className="font-serif-title text-3xl sm:text-4xl lg:text-5xl text-[var(--color-charcoal)] leading-tight">
              취향을 담은 공간,<br />일상의 영감이 되다
            </h2>
          </div>

          {/* 우측: 브랜드 철학 텍스트 */}
          <div>
            <p className="text-[var(--color-warm-gray)] leading-relaxed mb-6">
              SimpleShop은 단순한 쇼핑이 아닌, 일상의 감각을 높이는 경험을 추구합니다.
              우리는 각 분야의 전문가가 엄선한 제품만을 소개하며,
              품질과 디자인 모두에서 타협하지 않습니다.
            </p>
            <p className="text-[var(--color-warm-gray)] leading-relaxed mb-8">
              전자기기부터 패션, 생활용품까지 — 당신의 라이프스타일에 영감을 더할
              아이템을 만나보세요.
            </p>
            <Link
              href="#products"
              className="text-[var(--color-charcoal)] text-sm font-medium border-b border-[var(--color-charcoal)] hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] transition-colors"
            >
              더 알아보기
            </Link>
          </div>
        </div>
      </section>

      {/* ─── 섹션 5: 제품 그리드 ─── */}
      <section id="products" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* 섹션 헤더 */}
        <div className="text-center mb-12">
          <p className="text-sm text-[var(--color-gold)] tracking-[0.2em] uppercase mb-3">
            Collection
          </p>
          <h2 className="font-serif-title text-3xl text-[var(--color-charcoal)]">
            전체 제품
          </h2>
        </div>

        {/* 검색 및 필터 */}
        <div className="space-y-4 mb-8">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* 카테고리 필터 */}
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 text-sm transition-colors cursor-pointer
                    ${
                      selectedCategory === category
                        ? "bg-[var(--color-charcoal)] text-white"
                        : "bg-[var(--color-soft-beige)] text-[var(--color-warm-gray)] hover:text-[var(--color-charcoal)]"
                    }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* 정렬 */}
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as SortOrder)}
              className="px-4 py-2 border border-[var(--color-light-gray)] bg-[var(--color-offwhite)] text-[var(--color-charcoal)] text-sm
                focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)] focus:border-transparent"
            >
              <option value="default">기본 정렬</option>
              <option value="price-asc">가격 낮은순</option>
              <option value="price-desc">가격 높은순</option>
            </select>
          </div>
        </div>

        {/* 로딩 또는 제품 목록 */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <div className="text-[var(--color-warm-gray)] text-lg font-serif-title">로딩 중...</div>
          </div>
        ) : (
          <ProductList
            products={products}
            wishlist={wishlistIds}
            onWishlistToggle={handleWishlistToggle}
          />
        )}
      </section>
    </div>
  );
}
