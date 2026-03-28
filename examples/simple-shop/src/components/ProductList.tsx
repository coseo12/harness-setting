"use client";

import { Product } from "@/types/product";
import ProductCard from "@/components/ProductCard";

interface ProductListProps {
  products: Product[];
  wishlist: string[];
  searchQuery?: string;
  onWishlistToggle?: (productId: string, wishlisted: boolean) => void;
  onClearSearch?: () => void;
}

// 제품 그리드 목록 컴포넌트
export default function ProductList({
  products,
  wishlist,
  searchQuery,
  onWishlistToggle,
  onClearSearch,
}: ProductListProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-[var(--color-warm-gray)] text-lg">
          {searchQuery
            ? `"${searchQuery}"에 대한 검색 결과가 없습니다`
            : "제품이 없습니다"}
        </p>
        {searchQuery && onClearSearch && (
          <button
            onClick={onClearSearch}
            className="px-6 py-2 bg-[var(--color-charcoal)] text-white text-sm tracking-wide hover:opacity-90 transition-opacity cursor-pointer"
          >
            전체 상품 보기
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          isWishlisted={wishlist.includes(product.id)}
          onWishlistToggle={onWishlistToggle}
        />
      ))}
    </div>
  );
}
