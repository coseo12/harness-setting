# SimpleShop 설계 문서

## 기술 스택

- Next.js (App Router)
- TypeScript
- Tailwind CSS

## 디렉토리 구조

```
/src
  /app
    /api
      /products
        route.ts          # GET: 제품 목록 (검색, 필터, 정렬)
        /[id]
          route.ts        # GET: 단일 제품
      /wishlist
        route.ts          # GET: 위시리스트 목록, POST: 추가
        /[productId]
          route.ts        # DELETE: 위시리스트에서 제거
    layout.tsx
    page.tsx              # 홈 (제품 목록)
  /components
    ProductCard.tsx
    ProductList.tsx
    ProductDetail.tsx
    SearchBar.tsx
    WishlistButton.tsx
    WishlistPage.tsx
  /data
    products.ts           # 제품 초기 데이터
    wishlist.ts            # 위시리스트 데이터
  /lib
    (유틸리티 함수)
```

## 데이터 모델

### Product

```typescript
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  stock: number;
  createdAt: string;
}
```

## API 설계

### 제품 API

| 메서드 | 경로 | 설명 | 파라미터 |
|--------|------|------|----------|
| GET | /api/products | 전체 목록 | ?q=검색어, ?category=카테고리, ?sort=price-asc\|price-desc |
| GET | /api/products/[id] | 단일 제품 | - |

### 위시리스트 API

| 메서드 | 경로 | 설명 | Body |
|--------|------|------|------|
| GET | /api/wishlist | 위시리스트 목록 | - |
| POST | /api/wishlist | 위시리스트에 추가 | { productId: string } |
| DELETE | /api/wishlist/[productId] | 위시리스트에서 제거 | - |

### 응답 형식

- 성공: `{ data: ... }`
- 실패: `{ error: string }`

## 컴포넌트 설계

### ProductCard
- 제품 이미지, 이름, 가격, 카테고리 표시
- 클릭 시 상세 페이지 이동
- 위시리스트 버튼 포함

### ProductList
- ProductCard를 그리드로 배열
- 반응형: 모바일 1열, 태블릿 2열, 데스크톱 3~4열

### ProductDetail
- 제품명, 가격, 설명, 재고 상태 표시
- 위시리스트 추가/제거 버튼

### SearchBar
- 제품명 기반 검색 입력
- 디바운스 적용

### WishlistButton
- 하트 아이콘 (빈 하트 / 채워진 하트)
- 위시리스트 상태에 따라 토글

### WishlistPage
- 위시리스트에 담긴 제품 목록 표시
- 제거 버튼 포함

## 반응형 설계

| 뷰포트 | 그리드 열 수 |
|---------|-------------|
| ~480px (모바일) | 1열 |
| 481~1024px (태블릿) | 2열 |
| 1025px~ (데스크톱) | 3~4열 |

## 테스트 시나리오

1. 제품 목록이 그리드 형태로 표시된다
2. 검색어 입력 시 제품명에 포함된 제품만 필터링된다
3. 카테고리 버튼 클릭 시 해당 카테고리만 표시된다
4. 제품 카드 클릭 시 상세 페이지로 이동한다
5. 상세 페이지에서 제품명, 가격, 설명, 재고가 표시된다
6. 위시리스트 버튼 클릭 시 제품이 위시리스트에 추가된다
7. 이미 위시리스트에 있는 제품은 하트가 채워져 표시된다
8. 위시리스트 페이지에서 추가한 제품 목록이 표시된다
9. 위시리스트에서 제거 버튼 클릭 시 목록에서 사라진다
10. 모바일(480px)에서 제품이 1열로, 데스크톱(1200px)에서 3열로 표시된다
