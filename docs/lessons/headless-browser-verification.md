# headless 브라우저 검증 ≠ 실 브라우저 동작

> **요지**: CLAUDE.md 실전 교훈의 headless 브라우저 부분 freeze 블록 상세. 본문 요약은 CLAUDE.md `## 실전 교훈` 의 포인터 참조.
>
> **근거**: harness [#199](https://github.com/coseo12/harness-setting/issues/199) Phase 3-A 에서 추출.

---

## 개요

`agent-browser` / Playwright headless(특히 `--use-webgpu-adapter=swiftshader` 같은 software adapter)는 3D/WebGPU/카메라 조작 경로에서 **부분 freeze** 가 발생해 coarse assertion(비검정 canvas / fps 유지 / 컴파일 성공) 만으론 기능 실패를 탐지하지 못한다. 한 pipeline(예: background lensing 왜곡) 은 성공하고 다른 pipeline(예: accretion disk mask) 은 실패하는 **부분 성공** 케이스가 "headless 8/8 PASS" false positive 로 "채택" 판정될 수 있다. CRITICAL #3 "3단계 브라우저 검증"의 확장.

## 예방 규약

- 시각 효과(3D/WebGPU/camera 조작/shader-bound 렌더)를 포함하는 작업은 **실 Chrome GUI 수동 검증 최소 1회**. `status:review` 전이 전 체크리스트에 명시
- browser-verify 스크립트에 **도메인 특화 pixel 검증**(특정 색상 존재, scene object visibility, 카메라 회전 응답 diff)을 추가하되, 단독으론 충분하지 않다 — swiftshader freeze 상황에서 여전히 false positive 가능
- 완전 실패가 아닌 partial 자산은 `?feature=1` 류 옵트인 경로로 보존하고 ADR 에 "향후 디버깅 자산" 명시. 자동 폐기 금지
- PM 계약에 **"M1 백업 경로"** (실패 시 대체안) 을 사전 박제하면 sub-agent 가 실패 판정 후 재승인 없이 대체안으로 자동 전환 가능

## 근거

- volt [#33](https://github.com/coseo12/volt/issues/33) — astro-simulator P7-C 에서 5차 재시도 중 3차(Frustum Corner Interpolation) 가 headless 8/8 PASS + fps=23 + 비검정 canvas 로 "채택" 판정받았으나 실 Chrome 에서 accretion disk 렌더 실패 확인, 5차 D' 로 전환
