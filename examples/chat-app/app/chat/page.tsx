export default function ChatHomePage() {
  return (
    <div className="chat-empty">
      <div className="chat-empty-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <p>채팅방을 선택하거나 새로 만들어보세요</p>
    </div>
  );
}
