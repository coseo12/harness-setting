"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Product } from "@/types/product";
import WishlistButton from "@/components/WishlistButton";

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // 제품 및 위시리스트 데이터 로드
  useEffect(() => {
    async function fetchData() {
      try {
        const [productRes, wishlistRes] = await Promise.all([
          fetch(`/api/products/${id}`),
          fetch("/api/wishlist"),
        ]);

        if (!productRes.ok) {
          setError(true);
          return;
        }

        const productJson = await productRes.json();
        const wishlistJson = await wishlistRes.json();

        setProduct(productJson.data);
        const wishlistProductIds = (wishlistJson.data as Product[]).map(
          (p) => p.id
        );
        setIsWishlisted(wishlistProductIds.includes(id));
      } catch (err) {
        console.error("데이터 로드 실패:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-[var(--color-warm-gray)] text-lg font-serif-title">로딩 중...</div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-[var(--color-warm-gray)] text-lg">제품을 찾을 수 없습니다</p>
        <Link
          href="/"
          className="text-[var(--color-charcoal)] hover:text-[var(--color-gold)] font-medium border-b border-[var(--color-charcoal)]"
        >
          목록으로 돌아가기
        </Link>
      </div>
    );
  }

  // 재고 상태
  const stockLabel = product.stock > 0 ? `재고 ${product.stock}개` : "품절";
  const stockColor = product.stock > 0 ? "text-green-700" : "text-red-600";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 뒤로가기 — 차콜 텍스트 링크 */}
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-[var(--color-charcoal)] hover:text-[var(--color-gold)] mb-8 transition-colors text-sm"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
        </svg>
        <span>목록으로</span>
      </Link>

      {/* 제품 상세 — 좌우 분할 */}
      <div className="flex flex-col md:flex-row gap-12">
        {/* 좌측: 소프트베이지 배경 이미지 */}
        <div className="md:w-1/2">
          <div className="aspect-square overflow-hidden bg-[var(--color-soft-beige)]">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* 우측: 제품 정보 */}
        <div className="md:w-1/2 flex flex-col justify-center">
          {/* 카테고리 */}
          <p className="text-xs text-[var(--color-warm-gray)] tracking-wide uppercase mb-3">
            {product.category}
          </p>

          {/* 제품명 — 세리프 */}
          <h1 className="font-serif-title text-2xl md:text-3xl text-[var(--color-charcoal)] mb-4">
            {product.name}
          </h1>

          {/* 가격 — 골드 */}
          <p className="text-2xl text-[var(--color-gold)] font-medium mb-4">
            {product.price.toLocaleString()}원
          </p>

          {/* 재고 */}
          <p className={`text-sm font-medium mb-6 ${stockColor}`}>
            {stockLabel}
          </p>

          {/* 설명 */}
          <p className="text-[var(--color-warm-gray)] leading-relaxed mb-8">
            {product.description}
          </p>

          {/* 위시리스트 버튼 (큰 버전) */}
          <div className="flex items-center gap-3">
            <WishlistButton
              productId={product.id}
              initialWishlisted={isWishlisted}
              onToggle={(wishlisted) => setIsWishlisted(wishlisted)}
              large
            />
            <span className="text-sm text-[var(--color-warm-gray)]">
              {isWishlisted ? "위시리스트에 추가됨" : "위시리스트에 추가"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
