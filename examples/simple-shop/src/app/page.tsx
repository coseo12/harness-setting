"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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
      // API는 제품 객체 배열을 반환하므로 ID만 추출
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-500 text-lg">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 페이지 제목 */}
      <h1 className="text-2xl font-bold text-gray-900 mb-6">전체 제품</h1>

      {/* 검색 및 필터 영역 */}
      <div className="space-y-4 mb-8">
        {/* 검색바 */}
        <SearchBar value={searchQuery} onChange={setSearchQuery} />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* 카테고리 필터 버튼 */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer
                  ${
                    selectedCategory === category
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                  }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* 정렬 선택 */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as SortOrder)}
            className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="default">기본 정렬</option>
            <option value="price-asc">가격 낮은순</option>
            <option value="price-desc">가격 높은순</option>
          </select>
        </div>
      </div>

      {/* 제품 목록 */}
      <ProductList
        products={products}
        wishlist={wishlistIds}
        onWishlistToggle={handleWishlistToggle}
      />
    </div>
  );
}
