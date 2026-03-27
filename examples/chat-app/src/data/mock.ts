import { User, ChatRoom, Message } from './types';

/** 현재 로그인한 사용자 ID */
export const CURRENT_USER_ID = '0';

/** 현재 사용자 */
export const currentUser: User = {
  id: '0',
  nickname: '나',
  online: true,
};

/** 목 사용자 데이터 (Unsplash 실제 인물 사진 사용) */
export const users: User[] = [
  {
    id: '1',
    nickname: '김민준',
    avatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    online: true,
    lastSeen: '1:18 PM',
  },
  {
    id: '2',
    nickname: '이서연',
    avatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
    online: true,
    lastSeen: '1:18 PM',
  },
  {
    id: '3',
    nickname: '박지호',
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
    online: false,
    lastSeen: '11:30 AM',
  },
  {
    id: '4',
    nickname: '최수아',
    avatar:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
    online: true,
    lastSeen: '12:45 PM',
  },
  {
    id: '5',
    nickname: '정예준',
    avatar:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    online: true,
    lastSeen: '12:00 PM',
  },
  {
    id: '6',
    nickname: '강하은',
    avatar:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face',
    online: false,
    lastSeen: '3 Jan',
  },
  {
    id: '7',
    nickname: '윤도현',
    avatar:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face',
    online: true,
    lastSeen: 'Thu',
  },
  {
    id: '8',
    nickname: '임소율',
    avatar:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
    online: true,
    lastSeen: '12:30 PM',
  },
];

/** 목 채팅방 데이터 */
export const rooms: ChatRoom[] = [
  {
    id: 'r1',
    name: '김민준',
    lastMessage: '내일 회의 시간 확인해주세요',
    lastMessageTime: '1:18 PM',
    unreadCount: 3,
    members: [users[0], currentUser],
  },
  {
    id: 'r2',
    name: '이서연',
    lastMessage: '사진 2장을 보냈습니다',
    lastMessageTime: '1:18 PM',
    unreadCount: 0,
    members: [users[1], currentUser],
  },
  {
    id: 'r3',
    name: '디자인 팀',
    lastMessage: '피드백 반영했습니다',
    lastMessageTime: '12:45 PM',
    unreadCount: 5,
    members: [users[0], users[2], users[3], users[4]],
  },
  {
    id: 'r4',
    name: '박지호',
    lastMessage: '영상통화를 놓쳤습니다',
    lastMessageTime: '11:30 AM',
    unreadCount: 1,
    members: [users[2], currentUser],
  },
  {
    id: 'r5',
    name: '프로젝트 알파',
    lastMessage: '배포 완료!',
    lastMessageTime: 'Thu',
    unreadCount: 0,
    members: [users[0], users[4], users[5], users[6]],
  },
  {
    id: 'r6',
    name: '강하은',
    lastMessage: '사진 2장을 보냈습니다',
    lastMessageTime: '3 Jan',
    unreadCount: 0,
    members: [users[5], currentUser],
  },
];

/** 목 메시지 데이터 (r1 채팅방용) */
export const messages: Record<string, Message[]> = {
  r1: [
    {
      id: 'm1',
      content: '안녕하세요! 내일 회의 관련해서 연락드립니다.',
      senderId: '1',
      timestamp: '1:10 PM',
    },
    {
      id: 'm2',
      content: '네, 말씀하세요.',
      senderId: '0',
      timestamp: '1:12 PM',
    },
    {
      id: 'm3',
      content:
        '내일 오후 2시에 디자인 리뷰 회의가 있는데, 참석 가능하신가요?',
      senderId: '1',
      timestamp: '1:14 PM',
    },
    {
      id: 'm4',
      content: '네, 가능합니다. 자료 준비해갈게요.',
      senderId: '0',
      timestamp: '1:15 PM',
    },
    {
      id: 'm5',
      content: '감사합니다! 회의실은 3층 대회의실입니다.',
      senderId: '1',
      timestamp: '1:16 PM',
    },
    {
      id: 'm6',
      content: '내일 회의 시간 확인해주세요',
      senderId: '1',
      timestamp: '1:18 PM',
    },
  ],
  r2: [
    {
      id: 'm7',
      content: '어제 찍은 사진 보내드려요!',
      senderId: '2',
      timestamp: '1:15 PM',
    },
    {
      id: 'm8',
      content: '사진 2장을 보냈습니다',
      senderId: '2',
      timestamp: '1:18 PM',
    },
  ],
  r3: [
    {
      id: 'm9',
      content: '디자인 시안 확인 부탁드립니다.',
      senderId: '3',
      timestamp: '12:30 PM',
    },
    {
      id: 'm10',
      content: '피드백 반영했습니다',
      senderId: '4',
      timestamp: '12:45 PM',
    },
  ],
  r4: [
    {
      id: 'm11',
      content: '영상통화를 놓쳤습니다',
      senderId: '3',
      timestamp: '11:30 AM',
    },
  ],
  r5: [
    {
      id: 'm12',
      content: '배포 완료!',
      senderId: '5',
      timestamp: 'Thu',
    },
  ],
  r6: [
    {
      id: 'm13',
      content: '사진 2장을 보냈습니다',
      senderId: '6',
      timestamp: '3 Jan',
    },
  ],
};
