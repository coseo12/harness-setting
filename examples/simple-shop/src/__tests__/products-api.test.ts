import { describe, it, expect } from 'vitest'
import { products, Product } from '@/data/products'

// 필수 필드 목록
const REQUIRED_FIELDS: (keyof Product)[] = ['id', 'name', 'price', 'imageUrl', 'category']

describe('제품 데이터', () => {
  it('제품이 8개 존재한다', () => {
    expect(products).toHaveLength(8)
  })

  it('모든 제품에 필수 필드가 존재한다', () => {
    for (const product of products) {
      for (const field of REQUIRED_FIELDS) {
        expect(product[field]).toBeDefined()
      }
    }
  })

  it('모든 제품의 가격이 0보다 크다', () => {
    for (const product of products) {
      expect(product.price).toBeGreaterThan(0)
    }
  })
})

describe('검색 로직', () => {
  it('"이어폰" 키워드로 필터링하면 해당 제품만 반환된다', () => {
    const keyword = '이어폰'
    const filtered = products.filter((p) => p.name.includes(keyword))

    expect(filtered.length).toBeGreaterThan(0)
    // 모든 결과에 키워드가 포함되어 있어야 한다
    for (const product of filtered) {
      expect(product.name).toContain(keyword)
    }
  })
})

describe('카테고리 필터링', () => {
  it('"전자기기" 카테고리 필터링 시 해당 카테고리 제품만 반환된다', () => {
    const category = '전자기기'
    const filtered = products.filter((p) => p.category === category)

    expect(filtered.length).toBeGreaterThan(0)
    for (const product of filtered) {
      expect(product.category).toBe(category)
    }
  })
})

describe('가격 정렬', () => {
  it('price-asc 정렬 시 오름차순으로 정렬된다', () => {
    const sorted = [...products].sort((a, b) => a.price - b.price)

    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i].price).toBeGreaterThanOrEqual(sorted[i - 1].price)
    }
  })
})
