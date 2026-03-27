"use client";

import Link from "next/link";
import { Product } from "@/types/product";
import WishlistButton from "@/components/WishlistButton";

interface ProductCardProps {
  product: Product;
  isWishlisted: boolean;
  onWishlistToggle?: (productId: string, wishlisted: boolean) => void;
}

// 제품 카드 컴포넌트 — 매거진 스타일
export default function ProductCard({
  product,
  isWishlisted,
  onWishlistToggle,
}: ProductCardProps) {
  return (
    <Link href={`/products/${product.id}`}>
      <div className="bg-[var(--color-offwhite)] border border-[var(--color-light-gray)] overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer group">
        {/* 제품 이미지 — 소프트베이지 배경 */}
        <div className="relative aspect-square overflow-hidden bg-[var(--color-soft-beige)]">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {/* 위시리스트 버튼 — 우상단 */}
          <div className="absolute top-2 right-2">
            <WishlistButton
              productId={product.id}
              initialWishlisted={isWishlisted}
              onToggle={(wishlisted) =>
                onWishlistToggle?.(product.id, wishlisted)
              }
            />
          </div>
        </div>

        {/* 제품 정보 */}
        <div className="p-4">
          {/* 카테고리 — 심플한 텍스트 */}
          <p className="text-xs text-[var(--color-warm-gray)] tracking-wide mb-1">
            {product.category}
          </p>
          {/* 제품명 — 세리프 */}
          <h3 className="font-serif-title text-[var(--color-charcoal)] line-clamp-1 mb-2">
            {product.name}
          </h3>
          {/* 가격 — 골드 */}
          <p className="text-[var(--color-gold)] font-medium">
            {product.price.toLocaleString()}원
          </p>
        </div>
      </div>
    </Link>
  );
}
