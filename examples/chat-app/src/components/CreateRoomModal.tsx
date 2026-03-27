'use client';

import { useState } from 'react';

interface CreateRoomModalProps {
  onClose: () => void;
  onCreate: (name: string) => void;
}

/* 채팅방 생성 모달 */
export default function CreateRoomModal({ onClose, onCreate }: CreateRoomModalProps) {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 1) return;
    onCreate(name.trim());
  };

  return (
    // 오버레이
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* 모달 카드 */}
      <div
        className="w-full max-w-sm glass-panel rounded-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-text-primary mb-1">
          새 채팅방 만들기
        </h2>
        <p className="text-sm text-text-muted mb-5">
          채팅방 이름을 입력하세요
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="채팅방 이름"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={50}
            autoFocus
            className="w-full bg-bg-card border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none focus:border-accent-blue/40 transition-colors mb-4"
          />

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm text-text-secondary hover:bg-white/5 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={name.trim().length < 1}
              className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-accent-blue hover:bg-accent-blue/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              만들기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
