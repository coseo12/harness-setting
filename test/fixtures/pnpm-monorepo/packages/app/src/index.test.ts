import { describe, it, expect } from "vitest";
import { sum } from "@fixture/lib";

describe("@fixture/app — dist-based exports 소비", () => {
  it("@fixture/lib 의 sum 을 dist 경로로 import 할 수 있다", () => {
    // 이 테스트의 진짜 의도는 결과값 자체가 아니라,
    // lib 의 dist/index.js 가 정상 빌드되어 app 이 workspace:* 로 import 할 수 있음을 검증.
    // v2.28.2 / v2.29.1 부류 regression 이 여기서 실패로 드러난다.
    expect(sum(2, 3)).toBe(5);
  });
});
