'use client';

import { useState } from 'react';
import { Todo } from '@/data/types';

interface AddTodoModalProps {
  onClose: () => void;
  onAdd: (todo: Omit<Todo, 'id' | 'createdAt' | 'completed'>) => void;
}

// 할 일 추가 모달 컴포넌트
export default function AddTodoModal({ onClose, onAdd }: AddTodoModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Todo['category']>('work');
  const [priority, setPriority] = useState<Todo['priority']>('medium');
  const [dueDate, setDueDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAdd({
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      priority,
      dueDate: dueDate || new Date().toISOString().split('T')[0],
    });
    onClose();
  };

  // 입력 필드 공통 스타일
  const inputStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border)',
  };

  return (
    <div
      className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
    >
      <div
        className="modal-content w-full max-w-md rounded-3xl p-6"
        style={{
          backgroundColor: 'var(--bg-card)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2
            className="text-lg font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            새 할 일 추가
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors"
            style={{ backgroundColor: 'var(--bg-primary)' }}
            aria-label="닫기"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1 1L11 11M11 1L1 11"
                stroke="var(--text-secondary)"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* 제목 (필수) */}
          <div>
            <label
              className="mb-1 block text-xs font-medium"
              style={{ color: 'var(--text-secondary)' }}
            >
              제목 *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="할 일을 입력하세요"
              required
              className="w-full rounded-xl px-4 py-3 text-sm outline-none"
              style={inputStyle}
            />
          </div>

          {/* 설명 */}
          <div>
            <label
              className="mb-1 block text-xs font-medium"
              style={{ color: 'var(--text-secondary)' }}
            >
              설명
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="상세 설명 (선택)"
              rows={2}
              className="w-full resize-none rounded-xl px-4 py-3 text-sm outline-none"
              style={inputStyle}
            />
          </div>

          {/* 카테고리 + 우선순위 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                className="mb-1 block text-xs font-medium"
                style={{ color: 'var(--text-secondary)' }}
              >
                카테고리
              </label>
              <select
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as Todo['category'])
                }
                className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                style={inputStyle}
              >
                <option value="work">업무</option>
                <option value="personal">개인</option>
                <option value="health">건강</option>
                <option value="study">학습</option>
              </select>
            </div>

            <div>
              <label
                className="mb-1 block text-xs font-medium"
                style={{ color: 'var(--text-secondary)' }}
              >
                우선순위
              </label>
              <select
                value={priority}
                onChange={(e) =>
                  setPriority(e.target.value as Todo['priority'])
                }
                className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                style={inputStyle}
              >
                <option value="high">높음</option>
                <option value="medium">보통</option>
                <option value="low">낮음</option>
              </select>
            </div>
          </div>

          {/* 마감일 */}
          <div>
            <label
              className="mb-1 block text-xs font-medium"
              style={{ color: 'var(--text-secondary)' }}
            >
              마감일
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none"
              style={inputStyle}
            />
          </div>

          {/* 버튼 영역 */}
          <div className="mt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl py-3 text-sm font-medium transition-colors"
              style={{
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-secondary)',
              }}
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl py-3 text-sm font-bold transition-colors"
              style={{
                backgroundColor: 'var(--accent-yellow)',
                color: 'var(--text-primary)',
              }}
            >
              추가
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
