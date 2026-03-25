/** title 유효성 검증. 에러 시 메시지 반환, 정상이면 null */
export function validateTitle(title: unknown): string | null {
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return '제목은 필수입니다.';
  }
  if (title.length > 200) {
    return '제목은 200자 이하여야 합니다.';
  }
  return null;
}

/** PATCH 시 title 검증. undefined면 통과, 비어있으면 에러 */
export function validateUpdateTitle(title: unknown): string | null {
  if (title === undefined) return null;
  if (typeof title !== 'string' || title.trim().length === 0) {
    return '제목은 비어있을 수 없습니다.';
  }
  return null;
}
