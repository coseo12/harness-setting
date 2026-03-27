import { describe, it, expect, beforeEach } from 'vitest'

// 위시리스트 로직을 직접 시뮬레이션 (API 라우트 없이 순수 로직 테스트)
describe('위시리스트', () => {
  let wishlist: string[]

  beforeEach(() => {
    // 매 테스트마다 초기화
    wishlist = []
  })

  it('초기 상태는 빈 배열이다', () => {
    expect(wishlist).toEqual([])
    expect(wishlist).toHaveLength(0)
  })

  it('제품 추가 후 포함 여부를 확인할 수 있다', () => {
    const productId = 'prod-001'
    wishlist.push(productId)

    expect(wishlist).toContain(productId)
    expect(wishlist).toHaveLength(1)
  })

  it('중복 추가를 방지한다', () => {
    const productId = 'prod-001'

    // 첫 번째 추가
    if (!wishlist.includes(productId)) {
      wishlist.push(productId)
    }
    // 중복 추가 시도
    if (!wishlist.includes(productId)) {
      wishlist.push(productId)
    }

    expect(wishlist).toHaveLength(1)
  })

  it('제거 후 미포함을 확인할 수 있다', () => {
    const productId = 'prod-002'
    wishlist.push(productId)
    expect(wishlist).toContain(productId)

    // 제거
    wishlist = wishlist.filter((id) => id !== productId)

    expect(wishlist).not.toContain(productId)
    expect(wishlist).toHaveLength(0)
  })
})
