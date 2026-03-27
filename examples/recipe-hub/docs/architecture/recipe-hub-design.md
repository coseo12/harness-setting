# RecipeHub 설계 문서

## 1. 디렉토리 구조

```
src/
├── app/
│   ├── layout.tsx              # 루트 레이아웃
│   ├── page.tsx                # 홈(레시피 목록) 페이지
│   ├── recipes/
│   │   ├── [id]/
│   │   │   └── page.tsx        # 레시피 상세 페이지
│   │   └── new/
│   │       └── page.tsx        # 레시피 등록 페이지
│   └── api/
│       └── recipes/
│           ├── route.ts        # GET(목록), POST(등록)
│           └── [id]/
│               ├── route.ts    # GET(상세)
│               └── rating/
│                   └── route.ts # POST(평점)
├── components/
│   ├── RecipeCard.tsx          # 레시피 카드 (목록용)
│   ├── RecipeList.tsx          # 레시피 목록 그리드
│   ├── RecipeDetail.tsx        # 레시피 상세 표시
│   ├── RecipeForm.tsx          # 레시피 등록 폼
│   ├── StarRating.tsx          # 별점 입력/표시
│   └── SearchBar.tsx           # 검색 입력
├── lib/
│   ├── types.ts                # 타입 정의
│   └── recipes.ts              # 데이터 접근 함수
└── data/
    └── recipes.json            # 초기 레시피 데이터
```

## 2. 컴포넌트 설계

### RecipeCard

- **역할**: 목록에서 개별 레시피를 카드 형태로 표시
- **Props**: `recipe: Recipe`
- **동작**: 클릭 시 `/recipes/[id]`로 이동
- **표시 항목**: 이미지, 제목, 카테고리, 평균 평점

### RecipeList

- **역할**: 레시피 카드를 그리드 레이아웃으로 배치
- **Props**: `recipes: Recipe[]`
- **레이아웃**: 모바일 1열, 태블릿 2열, 데스크톱 3열 (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`)

### RecipeDetail

- **역할**: 레시피의 전체 정보를 상세 표시
- **Props**: `recipe: Recipe`
- **표시 항목**: 이미지, 제목, 설명, 재료 목록, 조리 단계(번호 포함), 평점

### RecipeForm

- **역할**: 새 레시피 등록 폼
- **상태**: 제목, 설명, 재료 배열, 조리 단계 배열, 이미지 URL, 카테고리
- **검증**: 제목, 재료(최소 1개), 조리 단계(최소 1개)는 필수
- **동작**: 제출 성공 시 홈(`/`)으로 리다이렉트

### StarRating

- **역할**: 별점 입력 및 표시
- **Props**: `rating: number`, `count: number`, `onRate?: (score: number) => void`
- **모드**: 읽기 전용(목록용) / 입력 가능(상세용)
- **접근성**: 키보드로 별점 선택 가능, `aria-label` 제공

### SearchBar

- **역할**: 검색어 입력
- **Props**: `value: string`, `onChange: (query: string) => void`
- **동작**: 입력 시 실시간 필터링 (디바운스 300ms)

## 3. API 계약

### GET /api/recipes

레시피 목록을 조회한다.

```
Query Parameters:
  - q (string, optional): 검색어 (제목/재료 매칭)
  - category (string, optional): 카테고리 필터

Response 200:
{
  "recipes": Recipe[]
}
```

### GET /api/recipes/[id]

특정 레시피의 상세 정보를 조회한다.

```
Path Parameters:
  - id (string): 레시피 ID

Response 200:
{
  "recipe": Recipe
}

Response 404:
{
  "error": "레시피를 찾을 수 없습니다"
}
```

### POST /api/recipes

새 레시피를 등록한다.

```
Request Body:
{
  "title": string,        // 필수
  "description": string,
  "ingredients": string[], // 필수, 최소 1개
  "steps": string[],       // 필수, 최소 1개
  "imageUrl": string,
  "category": string
}

Response 201:
{
  "recipe": Recipe
}

Response 400:
{
  "error": "필수 필드를 입력해주세요",
  "fields": string[]
}
```

### POST /api/recipes/[id]/rating

레시피에 별점을 등록한다.

```
Path Parameters:
  - id (string): 레시피 ID

Request Body:
{
  "score": number  // 1~5
}

Response 200:
{
  "rating": number,      // 업데이트된 평균 평점
  "ratingCount": number  // 총 평가 수
}

Response 400:
{
  "error": "평점은 1~5 사이여야 합니다"
}
```

## 4. 데이터 모델

### Recipe

```typescript
interface Recipe {
  id: string;            // UUID
  title: string;         // 레시피 제목
  description: string;   // 레시피 설명
  ingredients: string[]; // 재료 목록
  steps: string[];       // 조리 단계
  imageUrl: string;      // 이미지 URL
  category: string;      // 카테고리 (한식, 양식, 중식, 일식, 기타)
  rating: number;        // 평균 평점 (0~5)
  ratingCount: number;   // 평가 횟수
  createdAt: string;     // ISO 8601 생성일시
}
```

### 카테고리 목록

```typescript
const CATEGORIES = ['한식', '양식', '중식', '일식', '기타'] as const;
```

## 5. 반응형 설계

### 브레이크포인트

| 뷰포트 | 너비 | 그리드 열 | 비고 |
|---------|------|-----------|------|
| 모바일 | ~479px | 1열 | 카드 풀 너비 |
| 태블릿 | 480~1199px | 2열 | 중간 레이아웃 |
| 데스크톱 | 1200px~ | 3열 | 최대 너비 제한 |

### 상태 전이

- **모바일(480px)**: 레시피 카드가 세로 1열로 쌓임, 검색바 풀 너비
- **데스크톱(1200px)**: 레시피 카드가 3열 그리드, 검색바 상단 고정

### Tailwind CSS 클래스

```
// 그리드
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6

// 컨테이너
max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
```

## 6. 테스트 시나리오

Specification-Driven Testing 전략에 따라 아래 시나리오를 테스트 코드로 구현한 후 기능을 개발한다.

### 6.1 레시피 목록

1. **레시피 목록이 그리드 형태로 표시된다**: 홈 페이지 접속 시 레시피 카드들이 그리드 레이아웃으로 렌더링되는지 확인한다.

2. **검색어 입력 시 제목/재료가 포함된 레시피만 필터링된다**: 검색바에 키워드를 입력하면 해당 키워드가 제목 또는 재료에 포함된 레시피만 표시되고, 나머지는 숨겨지는지 확인한다.

3. **레시피 카드 클릭 시 상세 페이지로 이동한다**: 레시피 카드를 클릭하면 `/recipes/[id]` 경로로 라우팅되는지 확인한다.

### 6.2 레시피 상세

4. **상세 페이지에서 재료와 조리 단계가 순서대로 표시된다**: 상세 페이지에서 재료 목록이 불릿 리스트로, 조리 단계가 번호 매겨진 리스트로 올바른 순서대로 표시되는지 확인한다.

5. **별점 클릭 시 평균 평점이 업데이트된다**: 별점을 클릭하면 API를 호출하고, 반환된 새 평균 평점이 화면에 반영되는지 확인한다.

### 6.3 레시피 등록

6. **등록 폼에서 필수 필드 미입력 시 에러 메시지가 표시된다**: 제목, 재료, 조리 단계 중 하나라도 비어 있으면 해당 필드에 에러 메시지가 표시되고 제출이 차단되는지 확인한다.

7. **등록 성공 시 목록 페이지로 리다이렉트된다**: 필수 필드를 모두 입력하고 제출하면 레시피가 생성되고 홈(`/`)으로 리다이렉트되는지 확인한다.

### 6.4 반응형 레이아웃

8. **모바일(480px)에서 레시피 카드가 1열로 표시된다**: 뷰포트 너비 480px에서 레시피 카드가 세로로 1열 배치되는지 확인한다.

9. **데스크톱(1200px)에서 레시피 카드가 3열로 표시된다**: 뷰포트 너비 1200px에서 레시피 카드가 3열 그리드로 배치되는지 확인한다.
