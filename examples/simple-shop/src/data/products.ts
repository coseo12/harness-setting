// 제품 데이터 모델
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  stock: number;
  createdAt: string;
}

// 초기 제품 데이터
let products: Product[] = [
  {
    id: "prod-001",
    name: "무선 이어폰",
    description:
      "고음질 블루투스 5.3 무선 이어폰. 액티브 노이즈 캔슬링과 30시간 배터리로 언제 어디서나 몰입감 있는 사운드를 즐길 수 있습니다.",
    price: 89000,
    imageUrl:
      "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=400&h=400&fit=crop",
    category: "전자기기",
    stock: 25,
    createdAt: "2026-01-15T09:00:00Z",
  },
  {
    id: "prod-002",
    name: "스마트워치",
    description:
      "심박수, 수면 패턴, 운동 추적 기능을 갖춘 스마트워치. IP68 방수와 5일간 지속되는 배터리를 제공합니다.",
    price: 65000,
    imageUrl: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=400&h=400&fit=crop",
    category: "전자기기",
    stock: 15,
    createdAt: "2026-01-20T10:00:00Z",
  },
  {
    id: "prod-003",
    name: "노트북 거치대",
    description:
      "알루미늄 소재의 인체공학적 노트북 거치대. 높이 조절이 가능하며 최대 17인치 노트북까지 지원합니다.",
    price: 32000,
    imageUrl: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&h=400&fit=crop",
    category: "전자기기",
    stock: 40,
    createdAt: "2026-02-01T11:00:00Z",
  },
  {
    id: "prod-004",
    name: "기계식 키보드",
    description:
      "청축 스위치 기계식 키보드. RGB 백라이트와 매크로 키를 지원하며 타건감이 뛰어납니다.",
    price: 78000,
    imageUrl:
      "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=400&h=400&fit=crop",
    category: "전자기기",
    stock: 20,
    createdAt: "2026-02-10T12:00:00Z",
  },
  {
    id: "prod-005",
    name: "캔버스 토트백",
    description:
      "내구성 좋은 캔버스 소재 토트백. 넉넉한 수납공간과 내부 포켓으로 일상과 여행에 모두 활용 가능합니다.",
    price: 28000,
    imageUrl: "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=400&h=400&fit=crop",
    category: "패션",
    stock: 50,
    createdAt: "2026-02-15T13:00:00Z",
  },
  {
    id: "prod-006",
    name: "니트 카디건",
    description:
      "부드러운 울 블렌드 니트 카디건. 사계절 활용 가능한 가벼운 두께로 레이어드하기 좋습니다.",
    price: 45000,
    imageUrl:
      "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400&h=400&fit=crop",
    category: "패션",
    stock: 30,
    createdAt: "2026-02-20T14:00:00Z",
  },
  {
    id: "prod-007",
    name: "아로마 캔들",
    description:
      "천연 소이 왁스 아로마 캔들. 라벤더와 바닐라 향으로 편안한 분위기를 연출합니다. 연소 시간 약 45시간.",
    price: 18000,
    imageUrl: "https://images.unsplash.com/photo-1602028915047-37269d1a73f7?w=400&h=400&fit=crop",
    category: "생활용품",
    stock: 60,
    createdAt: "2026-03-01T15:00:00Z",
  },
  {
    id: "prod-008",
    name: "텀블러",
    description:
      "이중 진공 단열 스테인리스 텀블러. 12시간 보온, 24시간 보냉 기능으로 음료 온도를 오래 유지합니다. 용량 500ml.",
    price: 12000,
    imageUrl: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&h=400&fit=crop",
    category: "생활용품",
    stock: 45,
    createdAt: "2026-03-10T16:00:00Z",
  },
];

export { products };
