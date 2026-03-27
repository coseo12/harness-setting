"use client";

import { Product } from "@/types/product";
import ProductCard from "@/components/ProductCard";

interface ProductListProps {
  products: Product[];
  wishlist: string[];
  onWishlistToggle?: (productId: string, wishlisted: boolean) => void;
}

// 제품 그리드 목록 컴포넌트
export default function ProductList({
  products,
  wishlist,
  onWishlistToggle,
}: ProductListProps) {
  if (products.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500">
        <p className="text-lg">제품이 없습니다</p>
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
