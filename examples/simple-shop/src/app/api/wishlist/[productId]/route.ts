import { wishlist } from "@/data/wishlist";

// DELETE /api/wishlist/[productId] — 위시리스트에서 제품 제거
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { productId } = await params;
  const index = wishlist.indexOf(productId);

  if (index === -1) {
    return Response.json(
      { error: "위시리스트에 해당 제품이 없습니다." },
      { status: 404 }
    );
  }

  // 위시리스트에서 제거
  wishlist.splice(index, 1);

  return Response.json({ data: { productId, removed: true } });
}
