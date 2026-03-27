import { wishlist } from "@/data/wishlist";
import { products } from "@/data/products";

// GET /api/wishlist — 위시리스트에 담긴 제품 목록 반환
export async function GET() {
  // 위시리스트의 productId로 실제 제품 정보를 조회
  const wishlistProducts = wishlist
    .map((productId) => products.find((p) => p.id === productId))
    .filter(Boolean);

  return Response.json({ data: wishlistProducts });
}

// POST /api/wishlist — 위시리스트에 제품 추가
export async function POST(request: Request) {
  const body = await request.json();
  const { productId } = body;

  if (!productId) {
    return Response.json(
      { error: "productId가 필요합니다." },
      { status: 400 }
    );
  }

  // 제품 존재 여부 확인
  const product = products.find((p) => p.id === productId);
  if (!product) {
    return Response.json(
      { error: "존재하지 않는 제품입니다." },
      { status: 404 }
    );
  }

  // 이미 위시리스트에 있으면 무시 (중복 추가 방지)
  if (!wishlist.includes(productId)) {
    wishlist.push(productId);
  }

  return Response.json({ data: product });
}
