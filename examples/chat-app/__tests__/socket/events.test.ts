import { describe, it, expect, vi } from 'vitest';
import { validateMessageContent, validateRoomName } from '@/lib/validation';

// Socket.IO 이벤트의 데이터 검증 테스트 (서버 로직은 통합 테스트에서 검증)
describe('Socket 이벤트 데이터 검증', () => {
  it('메시지 내용이 비어있으면 에러를 반환한다', () => {
    expect(validateMessageContent('')).not.toBeNull();
    expect(validateMessageContent('   ')).not.toBeNull();
  });

  it('유효한 메시지 내용은 null을 반환한다', () => {
    expect(validateMessageContent('안녕하세요!')).toBeNull();
    expect(validateMessageContent('Hello World')).toBeNull();
  });

  it('채팅방 이름이 50자를 초과하면 에러를 반환한다', () => {
    const longName = 'a'.repeat(51);
    expect(validateRoomName(longName)).not.toBeNull();
    expect(validateRoomName('일반 채팅방')).toBeNull();
  });
});
