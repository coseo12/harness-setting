import { type NextRequest } from "next/server";
import { products } from "@/data/products";

// GET /api/products — 제품 목록 조회 (검색, 카테고리 필터, 가격 정렬 지원)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");
  const category = searchParams.get("category");
  const sort = searchParams.get("sort");

  let result = [...products];

  // 제품명 검색
  if (query) {
    result = result.filter((product) =>
      product.name.toLowerCase().includes(query.toLowerCase())
    );
  }

  // 카테고리 필터
  if (category) {
    result = result.filter((product) => product.category === category);
  }

  // 가격 정렬
  if (sort === "price-asc") {
    result.sort((a, b) => a.price - b.price);
  } else if (sort === "price-desc") {
    result.sort((a, b) => b.price - a.price);
  }

  return Response.json({ data: result });
}
