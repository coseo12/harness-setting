// 레시피 타입 정의
export interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: string[];
  steps: string[];
  imageUrl: string;
  category: string;
  rating: number;
  ratingCount: number;
  createdAt: string;
}

// 초기 레시피 데이터 (가변 배열 — API에서 추가/수정 가능)
export let recipes: Recipe[] = [
  {
    id: '1',
    title: '김치찌개',
    description: '잘 익은 김치와 돼지고기로 끓인 얼큰한 찌개',
    ingredients: [
      '묵은지 1컵',
      '돼지고기 앞다리살 150g',
      '두부 1/2모',
      '대파 1대',
      '고춧가루 1큰술',
      '다진 마늘 1큰술',
    ],
    steps: [
      '돼지고기를 한입 크기로 썰어 냄비에 볶는다.',
      '김치를 넣고 함께 볶다가 물 2컵을 붓고 끓인다.',
      '끓어오르면 두부를 넣고 고춧가루, 마늘로 간을 맞춘다.',
      '대파를 송송 썰어 올리고 한소끔 더 끓인다.',
    ],
    imageUrl: 'https://placehold.co/600x400/E74C3C/white?text=Kimchi+Jjigae',
    category: '찌개',
    rating: 4.5,
    ratingCount: 120,
    createdAt: '2026-01-15T09:00:00Z',
  },
  {
    id: '2',
    title: '된장찌개',
    description: '구수한 된장과 신선한 채소로 끓인 전통 찌개',
    ingredients: [
      '된장 2큰술',
      '두부 1/2모',
      '감자 1개',
      '애호박 1/2개',
      '청양고추 1개',
      '대파 1대',
    ],
    steps: [
      '멸치 육수를 낸 뒤 된장을 풀어 끓인다.',
      '감자와 애호박을 깍둑썰기하여 넣는다.',
      '두부를 넣고 중불에서 10분간 끓인다.',
      '청양고추와 대파를 넣고 마무리한다.',
    ],
    imageUrl: 'https://placehold.co/600x400/8B4513/white?text=Doenjang+Jjigae',
    category: '찌개',
    rating: 4.3,
    ratingCount: 95,
    createdAt: '2026-01-20T10:30:00Z',
  },
  {
    id: '3',
    title: '불고기',
    description: '달콤한 간장 양념에 재운 소고기 불고기',
    ingredients: [
      '소고기 등심 300g',
      '간장 3큰술',
      '설탕 1큰술',
      '배즙 2큰술',
      '양파 1개',
      '대파 1대',
    ],
    steps: [
      '소고기를 얇게 썰어 간장, 설탕, 배즙으로 양념한다.',
      '양파를 채 썰어 고기와 함께 30분간 재운다.',
      '달군 팬에 양념한 고기를 볶는다.',
      '대파를 넣고 센 불에서 빠르게 볶아 마무리한다.',
    ],
    imageUrl: 'https://placehold.co/600x400/D35400/white?text=Bulgogi',
    category: '볶음',
    rating: 4.7,
    ratingCount: 200,
    createdAt: '2026-02-01T12:00:00Z',
  },
  {
    id: '4',
    title: '비빔밥',
    description: '갖은 나물과 고추장을 비벼 먹는 한국 대표 밥 요리',
    ingredients: [
      '밥 1공기',
      '시금치 나물 1줌',
      '콩나물 1줌',
      '당근 1/2개',
      '계란 1개',
      '고추장 1큰술',
    ],
    steps: [
      '시금치, 콩나물, 당근을 각각 데쳐서 양념한다.',
      '밥 위에 준비한 나물을 보기 좋게 올린다.',
      '가운데 계란 프라이를 올린다.',
      '고추장과 참기름을 넣고 비벼 먹는다.',
    ],
    imageUrl: 'https://placehold.co/600x400/27AE60/white?text=Bibimbap',
    category: '밥',
    rating: 4.6,
    ratingCount: 180,
    createdAt: '2026-02-10T08:00:00Z',
  },
  {
    id: '5',
    title: '잡채',
    description: '당면과 다양한 채소를 볶아낸 명절 별미',
    ingredients: [
      '당면 200g',
      '시금치 1줌',
      '당근 1/2개',
      '양파 1/2개',
      '표고버섯 3개',
      '간장 3큰술',
    ],
    steps: [
      '당면을 삶아 물기를 빼고 먹기 좋게 자른다.',
      '채소를 채 썰어 각각 볶아낸다.',
      '당면과 채소를 한데 모아 간장, 참기름으로 양념한다.',
      '고루 섞어 접시에 담아낸다.',
    ],
    imageUrl: 'https://placehold.co/600x400/9B59B6/white?text=Japchae',
    category: '볶음',
    rating: 4.4,
    ratingCount: 150,
    createdAt: '2026-02-20T11:00:00Z',
  },
  {
    id: '6',
    title: '떡볶이',
    description: '매콤달콤한 고추장 소스에 졸인 쫄깃한 떡볶이',
    ingredients: [
      '떡볶이 떡 300g',
      '어묵 2장',
      '고추장 2큰술',
      '고춧가루 1큰술',
      '설탕 1큰술',
      '대파 1대',
    ],
    steps: [
      '물 2컵에 고추장, 고춧가루, 설탕을 풀어 양념장을 만든다.',
      '양념장이 끓으면 떡을 넣고 중불에서 졸인다.',
      '어묵을 넣고 떡이 부드러워질 때까지 끓인다.',
      '대파를 넣고 한소끔 더 끓여 마무리한다.',
    ],
    imageUrl: 'https://placehold.co/600x400/E67E22/white?text=Tteokbokki',
    category: '면',
    rating: 4.8,
    ratingCount: 250,
    createdAt: '2026-03-01T14:00:00Z',
  },
];
