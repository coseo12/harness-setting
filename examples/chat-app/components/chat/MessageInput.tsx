'use client';

import { useState, type FormEvent, type KeyboardEvent } from 'react';

interface MessageInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
}

export default function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [content, setContent] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setContent('');
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  return (
    <div className="message-input-bar">
      <form className="message-input-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="message-input"
          placeholder="메시지를 입력하세요..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          maxLength={2000}
        />
        <button
          type="submit"
          className="btn-send"
          disabled={disabled || !content.trim()}
          aria-label="전송"
        >
          ↑
        </button>
      </form>
    </div>
  );
}
