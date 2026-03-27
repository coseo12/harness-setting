import { products } from "@/data/products";

// GET /api/products/[id] — 단일 제품 조회
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const product = products.find((p) => p.id === id);

  if (!product) {
    return Response.json(
      { error: "제품을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  return Response.json({ data: product });
}
