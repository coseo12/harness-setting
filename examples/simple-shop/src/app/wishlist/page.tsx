"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Product } from "@/types/product";
import ProductList from "@/components/ProductList";

export default function WishlistPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // 위시리스트 데이터 로드
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/wishlist");
        const json = await res.json();
        const wishlistProducts: Product[] = json.data;

        setProducts(wishlistProducts);
        setWishlistIds(wishlistProducts.map((p) => p.id));
      } catch (error) {
        console.error("데이터 로드 실패:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // 위시리스트에서 제거 시 목록에서 즉시 제거 (optimistic update)
  const handleWishlistToggle = (productId: string, wishlisted: boolean) => {
    if (!wishlisted) {
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      setWishlistIds((prev) => prev.filter((id) => id !== productId));
    }
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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">위시리스트</h1>

      {products.length === 0 ? (
        // 빈 위시리스트 상태
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          {/* 빈 하트 아이콘 */}
          <svg
            className="h-16 w-16 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          <p className="text-gray-500 text-lg">위시리스트가 비어있습니다</p>
          <Link
            href="/"
            className="mt-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium
              hover:bg-blue-700 transition-colors"
          >
            쇼핑하러 가기
          </Link>
        </div>
      ) : (
        <ProductList
          products={products}
          wishlist={wishlistIds}
          onWishlistToggle={handleWishlistToggle}
        />
      )}
    </div>
  );
}
