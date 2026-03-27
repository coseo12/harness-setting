'use client';

import Avatar from './Avatar';

interface SidebarProps {
  totalUnread: number;
}

/** 메뉴 아이템 정의 */
const MENU_ITEMS = [
  { icon: 'chat', label: 'Chats', hasUnread: true },
  { icon: 'shop', label: 'Marketplace', hasUnread: false },
  { icon: 'request', label: 'Message requests', hasUnread: false },
  { icon: 'archive', label: 'Archive', hasUnread: false },
] as const;

/** 장식용 커뮤니티 데이터 */
const COMMUNITIES = [
  { name: 'UI/UX Design', active: '2,922' },
  { name: 'Frontend Dev', active: '1,458' },
];

export default function Sidebar({ totalUnread }: SidebarProps) {
  return (
    <div className="w-[300px] h-full glass-panel rounded-2xl flex flex-col shrink-0">
      {/* 프로필 영역 */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-border-subtle">
        <div className="flex items-center gap-3">
          <Avatar nickname="나" size="sm" online />
          <span className="text-sm font-semibold text-text-primary">
            내 프로필
          </span>
        </div>
        {/* 설정 아이콘 (장식용) */}
        <button className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-text-secondary">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      {/* 메뉴 목록 */}
      <nav className="px-2 py-2">
        {MENU_ITEMS.map((item) => (
          <button
            key={item.label}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <span className="text-text-secondary">
                {item.icon === 'chat' && (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                )}
                {item.icon === 'shop' && (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                  </svg>
                )}
                {item.icon === 'request' && (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                )}
                {item.icon === 'archive' && (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                )}
              </span>
              <span className="text-sm text-text-primary">{item.label}</span>
            </div>
            {/* 읽지않은 메시지 뱃지 */}
            {item.hasUnread && totalUnread > 0 && (
              <span className="min-w-[20px] h-5 flex items-center justify-center rounded-full bg-accent-blue text-[11px] font-semibold text-white px-1.5">
                {totalUnread}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* 구분선 */}
      <div className="mx-4 border-t border-border-subtle" />

      {/* 커뮤니티 섹션 */}
      <div className="px-4 py-3 flex-1 overflow-y-auto">
        <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
          Communities
        </h4>
        <div className="flex flex-col gap-2">
          {COMMUNITIES.map((community) => (
            <button
              key={community.name}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors text-left"
            >
              {/* 커뮤니티 아이콘 */}
              <div className="w-10 h-10 rounded-xl bg-accent-blue/20 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-accent-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-sm text-text-primary truncate">
                  {community.name}
                </p>
                <p className="text-[11px] text-text-muted">
                  {community.active} active
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
