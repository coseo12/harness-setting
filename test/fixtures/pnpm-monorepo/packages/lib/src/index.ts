/**
 * fixture 용 단순 함수. 실제 로직 정확성이 아니라 dist 산출물이
 * `@fixture/app` 에서 import 가능한지를 확인하기 위한 최소 공개 API.
 */
export function sum(a: number, b: number): number {
  return a + b;
}
