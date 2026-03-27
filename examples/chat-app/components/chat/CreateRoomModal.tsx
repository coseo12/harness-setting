'use client';

import { useState, type FormEvent } from 'react';

interface CreateRoomModalProps {
  onClose: () => void;
  onCreate: (name: string) => Promise<void>;
}

export default function CreateRoomModal({ onClose, onCreate }: CreateRoomModalProps) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = (formData.get('name') as string).trim();
    if (!name) return;

    setLoading(true);
    try {
      await onCreate(name);
      onClose();
    } catch {
      // api-client에서 에러 처리
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>새 채팅방 만들기</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="room-name">채팅방 이름</label>
            <input
              id="room-name"
              name="name"
              type="text"
              className="form-input"
              placeholder="채팅방 이름을 입력하세요"
              maxLength={50}
              autoFocus
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              취소
            </button>
            <button type="submit" className="btn-modal-primary" disabled={loading}>
              {loading ? '생성 중...' : '만들기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
