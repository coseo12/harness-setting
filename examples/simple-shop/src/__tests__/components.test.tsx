import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ProductCard from '@/components/ProductCard'
import ProductList from '@/components/ProductList'
import SearchBar from '@/components/SearchBar'
import { Product } from '@/data/products'

// next/link 모킹 — 테스트 환경에서 Link를 단순 앵커로 대체
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

// WishlistButton 모킹 — 외부 의존성 제거
vi.mock('@/components/WishlistButton', () => ({
  default: () => <button data-testid="wishlist-btn">위시리스트</button>,
}))

// 테스트용 제품 데이터
const mockProduct: Product = {
  id: 'test-001',
  name: '테스트 제품',
  description: '테스트용 제품 설명',
  price: 25000,
  imageUrl: 'https://placehold.co/400x400',
  category: '테스트',
  stock: 10,
  createdAt: '2026-01-01T00:00:00Z',
}

describe('ProductCard', () => {
  it('제품명과 가격이 렌더링된다', () => {
    render(
      <ProductCard product={mockProduct} isWishlisted={false} />
    )

    expect(screen.getByText('테스트 제품')).toBeInTheDocument()
    expect(screen.getByText('25,000원')).toBeInTheDocument()
  })
})

describe('ProductList', () => {
  it('빈 목록일 때 안내 메시지를 표시한다', () => {
    render(
      <ProductList products={[]} wishlist={[]} />
    )

    expect(screen.getByText('제품이 없습니다')).toBeInTheDocument()
  })
})

describe('SearchBar', () => {
  it('입력 시 onChange 콜백이 호출된다', () => {
    const handleChange = vi.fn()

    render(<SearchBar value="" onChange={handleChange} />)

    const input = screen.getByPlaceholderText('제품 검색...')
    fireEvent.change(input, { target: { value: '이어폰' } })

    expect(handleChange).toHaveBeenCalledWith('이어폰')
  })
})
