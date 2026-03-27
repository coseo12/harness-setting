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

  // 위시리스트에서 제거 시 목록에서 즉시 제거
  const handleWishlistToggle = (productId: string, wishlisted: boolean) => {
    if (!wishlisted) {
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      setWishlistIds((prev) => prev.filter((id) => id !== productId));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-[var(--color-warm-gray)] text-lg font-serif-title">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* 페이지 헤더 */}
      <div className="text-center mb-12">
        <p className="text-sm text-[var(--color-gold)] tracking-[0.2em] uppercase mb-3">
          My Collection
        </p>
        <h1 className="font-serif-title text-3xl text-[var(--color-charcoal)]">
          위시리스트
        </h1>
      </div>

      {products.length === 0 ? (
        // 빈 위시리스트 — 우아한 메시지
        <div className="flex flex-col items-center justify-center py-20 gap-6">
          <svg
            className="h-16 w-16 text-[var(--color-light-gray)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          <p className="text-[var(--color-warm-gray)] text-lg font-serif-title">
            아직 담아둔 아이템이 없습니다
          </p>
          <p className="text-[var(--color-warm-gray)] text-sm">
            마음에 드는 제품을 찾아 위시리스트에 추가해보세요
          </p>
          <Link
            href="/"
            className="mt-4 px-8 py-3 bg-[var(--color-gold)] text-white text-sm font-medium tracking-wide hover:opacity-90 transition-opacity"
          >
            컬렉션 둘러보기
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
