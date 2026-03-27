"use client";

import Link from "next/link";
import { Product } from "@/types/product";
import WishlistButton from "@/components/WishlistButton";

interface ProductCardProps {
  product: Product;
  isWishlisted: boolean;
  onWishlistToggle?: (productId: string, wishlisted: boolean) => void;
}

// 제품 카드 컴포넌트
export default function ProductCard({
  product,
  isWishlisted,
  onWishlistToggle,
}: ProductCardProps) {
  return (
    <Link href={`/products/${product.id}`}>
      <div className="bg-white rounded-xl overflow-hidden border border-gray-200 transition-shadow hover:shadow-lg cursor-pointer">
        {/* 제품 이미지 */}
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          {/* 위시리스트 버튼 — 이미지 우측 상단 */}
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
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-gray-900 line-clamp-1">
              {product.name}
            </h3>
            <span className="shrink-0 inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
              {product.category}
            </span>
          </div>
          <p className="mt-2 text-lg font-bold text-gray-900">
            {product.price.toLocaleString()}원
          </p>
        </div>
      </div>
    </Link>
  );
}
