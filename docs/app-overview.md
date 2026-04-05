# 앱 개요

## 목적

`Holdem Quiz`는 라이브 홀덤 입문자가 짧은 문제 풀이와 체크리스트를 통해 실전 감각을 익히도록 만든 모바일 우선 학습 앱입니다.

핵심은 두 가지입니다.

- 의사결정 문제를 반복해서 풀게 한다.
- 틀린 문제와 약한 태그를 바로 다시 연습하게 한다.

## 제품 성격

- 클라이언트 전용 앱
- 로그인 없음
- 서버 API 없음
- 로컬 저장 기반 MVP
- 모바일 화면 폭에 맞춘 단일 페이지 앱
- App Router 기반 정적 export 배포

앱 엔트리는 [`app/page.tsx`](../app/page.tsx)이고, 상태 로직은 [`app/_components/holdem-quiz-app.tsx`](../app/_components/holdem-quiz-app.tsx), 상태/액션 타입은 [`app/_components/holdem-quiz-model.ts`](../app/_components/holdem-quiz-model.ts), 파생 데이터 조합과 화면 분기는 [`app/_components/holdem-quiz-view.tsx`](../app/_components/holdem-quiz-view.tsx), 실제 화면 컴포넌트는 [`app/_components/screens.tsx`](../app/_components/screens.tsx)에 있습니다.

## 주요 뷰와 오버레이

현재 앱의 주요 뷰는 아래 5개입니다.

- `home`
- `wrongs`
- `records`
- `liveTips`
- `quiz`

하단 탭은 `home`, `wrongs`, `records` 세 개만 노출됩니다. `liveTips`와 `quiz`는 내부 흐름에서 진입합니다.

별도 화면은 아니지만, 다음 오버레이도 사용자 흐름에서 중요합니다.

- 설정 모달
- 퀴즈 피드백 시트
- 용어 설명 모달

정적 안내 페이지:

- `privacy`
- `support`

참고:

- 현재 UI에는 `training` 뷰가 없습니다.
- 다만 도메인 레이어에는 카테고리 세션 생성 함수가 남아 있어, 이후 UI 확장 시 재사용할 수 있습니다.

## 화면별 역할

### 1. 홈

홈은 대시보드 역할을 합니다.

- 오늘 푼 문제 수와 목표 진행률 표시
- 오늘의 10문제 세션 시작 또는 이어풀기
- 최근 오답 기반 약점 요약 문구 표시
- 최근 오답 다시 풀기 진입
- 라이브 팁 체크 진행도 확인

홈의 `dailyGoal`은 진행률 기준값입니다. 오늘 세션 길이를 바꾸지는 않으며, 오늘 세션은 항상 10문제로 생성됩니다.

### 2. 오답

오답 화면은 최근에 틀린 문제를 다시 보는 용도입니다.

- 전체 / 프리플랍 / 포스트플랍 / 확률 / Live Tips 필터
- 오답 10문제 재도전
- 문제별 내 선택과 정답 비교
- 태그를 눌러 약점 드릴 시작
- 단일 문제 다시 풀기

`liveTips` 필터는 체크리스트형 데이터라 실제 오답 항목을 쌓지 않으며, 빈 상태 안내 문구만 노출합니다.

### 3. 기록

기록 화면은 학습 통계를 보여줍니다.

- 전체 정답률
- 연속 학습 일수
- 누적 풀이 수
- 카테고리별 정확도
- 최근 7일 학습 빈도
- 약점 3개 추천

약점 카드에서 바로 5문제 드릴을 시작할 수 있습니다.

### 4. 라이브 팁

라이브 팁은 실전 현장 적응을 위한 체크리스트입니다.

- 핸드 진행 순서
- 핵심 용어
- 빠른 오즈 계산
- 블라인드와 베팅 구조
- 초보 실수

각 항목은 체크 여부만 저장합니다. 오답노트나 정답률 집계에는 포함되지 않습니다.

### 5. 퀴즈

퀴즈 화면은 세션 진행 화면입니다.

- 문제 본문과 상황 카드 표시
- 용어 칩 표시 및 용어 설명 모달 호출
- 보드 5칸과 히어로 핸드를 포커 테이블 형태로 표시
- 프리플랍은 포지션/스택/선행 액션 중심 테이블 시각화
- 포스트플랍은 프리플랍 액션, 현재 액션, 베팅 맥락을 강조
- 오즈 문제는 포트 오즈 또는 아웃 계산 맥락에 맞는 시각화 사용
- 확률 문제 중 히어로 카드가 없는 경우 카드 뒷면으로 숨김 표시
- 선택지 버튼 표시
- 정답 여부 피드백 시트
- 해설과 초보자 실수 포인트 제공
- 다음 문제 또는 세션 결과 보기

카드 UI는 작은 모바일 화면에서도 읽기 쉽게 앞면 인덱스와 중앙 수트 심볼을 직접 렌더링합니다.

## 상태 구조

앱은 [`lib/holdem/types.ts`](../lib/holdem/types.ts)의 `Store`를 중심으로 동작합니다. 저장 키는 `holdem-quiz:v1`입니다.

저장되는 주요 상태:

- `settings`
- `responses`
- `tipChecks`
- `sessions`

### settings

- 언어
- 진동 여부
- 사운드 여부
- 하루 목표 문제 수
- JSON 백업 내보내기 / 불러오기 진입

### responses

문제 풀이 이력입니다.

- 문제 ID
- 카테고리
- 내가 고른 선택
- 정답 여부
- 정답 선택지
- 응답 시각
- 태그

응답 기록은 최신 500개까지만 유지합니다.

### tipChecks

라이브 팁 체크리스트 항목의 완료 여부입니다.

### sessions

진행 중인 세션의 문제 목록, 현재 인덱스, 결과 기록을 보관합니다.

## 데이터 구성

[`lib/training-data.ts`](../lib/training-data.ts)는 공개 export 진입점이고, 실제 데이터 본문은 `lib/training-data/` 하위 모듈에 나뉘어 있습니다.

- 프리플랍 31문제
- 포스트플랍 29문제
- 확률 28문제
- 라이브 팁 5개 섹션 / 16개 항목

카테고리 메타, 기본 약점 프롬프트, 라이브 팁도 같은 디렉터리 안에서 분리 관리합니다.

## 세션 규칙

세션은 모두 랜덤 셔플 기반으로 생성됩니다.

- 오늘 세션: 전체 문제 중 10문제
- 약점 드릴: 해당 태그 중심 5문제
- 오답 재도전: 최근 오답 중심 최대 10문제
- 단일 복습: 선택한 문제 1문제

도메인 레이어에만 남아 있는 내부 세션 크기:

- 프리플랍 세션: 8문제
- 포스트플랍 세션: 6문제
- 확률 세션: 5문제

오늘 세션은 최근 약점 태그를 우선 반영해 문제를 섞고, 진행 중 상태는 저장되므로 이어풀기가 가능합니다.

## 통계 계산 방식

기록 화면과 홈에서 쓰는 값은 대부분 클라이언트에서 즉시 계산합니다.

- 전체 정답률
- 카테고리별 정답률
- 최근 40개 오답 기준 약점 태그
- 최근 7일 학습량 추이
- 연속 학습 일수
- 오늘 푼 문제 수

즉, 별도 집계 서버 없이 브라우저 내 기록만으로 통계를 계산합니다.

## UI 구성 책임

컴포넌트 역할은 대략 이렇게 나뉩니다.

- [`app/_components/holdem-quiz-app.tsx`](../app/_components/holdem-quiz-app.tsx): 저장소 로드/저장, 세션 시작, 답안 처리, 설정 변경
- [`app/_components/holdem-quiz-view.tsx`](../app/_components/holdem-quiz-view.tsx): 파생 데이터 계산 후 각 화면에 주입
- [`app/_components/screens.tsx`](../app/_components/screens.tsx): 화면, 모달, 피드백 시트 렌더링
- [`app/_components/poker-table.tsx`](../app/_components/poker-table.tsx): 포지션/액션 테이블 비주얼
- [`app/_components/browser.ts`](../app/_components/browser.ts): 서비스 워커 등록, 진동/사운드 피드백
- [`lib/holdem/sessions.ts`](../lib/holdem/sessions.ts): 세션 생성과 진행
- [`lib/holdem/selectors.ts`](../lib/holdem/selectors.ts): 통계와 오답/약점 계산

## 개발용 QA 프리뷰

개발 환경에서만 [`app/qa/ui/page.tsx`](../app/qa/ui/page.tsx) 경로가 열립니다.

- [`app/_components/qa-ui-preview.tsx`](../app/_components/qa-ui-preview.tsx): 시나리오 선택 UI
- [`app/_components/qa-ui-scenarios.ts`](../app/_components/qa-ui-scenarios.ts): 고정 상태 fixture
- [`scripts/qa-ui.mjs`](../scripts/qa-ui.mjs): Playwright로 시나리오별 스크린샷과 레이아웃 리포트 생성

이 프리뷰는 실제 사용자의 저장 상태를 읽지 않고, 고정 시나리오 상태를 렌더링합니다.

## PWA / 오프라인

앱은 기본적인 PWA 구성을 갖고 있습니다.

- [`app/manifest.ts`](../app/manifest.ts)
- [`public/sw.js`](../public/sw.js)

서비스 워커는 앱 셸에 가까운 리소스를 캐시하고, 네트워크 실패 시 캐시를 우선 사용합니다.

추가 정적 페이지:

- [`app/privacy/page.tsx`](../app/privacy/page.tsx)
- [`app/support/page.tsx`](../app/support/page.tsx)

## 스타일과 UI 방향

- 모바일 우선
- 최대 폭 `520px`
- 포커 테이블 느낌의 녹색 / 금색 톤
- 카드형 레이아웃과 타원형 테이블 씬
- 앞면 카드는 컴포넌트에서 직접 그린 인덱스/수트 기반 디자인
- 카드 뒷면은 정적 SVG 에셋 사용
- 정답/오답에 따른 진동과 사운드 피드백 옵션

## 현재 구조상 특징

- 구현 속도를 우선한 단일 페이지 구조입니다.
- App Router 엔트리는 얇고, 클라이언트 상태 관리와 화면 UI는 `app/_components/` 아래로 분리돼 있습니다.
- 저장소 정규화와 세션 로직이 `lib/holdem/` 아래로 분리돼 있어 UI 컴포넌트보다 테스트하기 쉽습니다.
- 서버 연동 없이도 바로 실행 가능한 데모 성격이 강합니다.

## 다음에 문서화하거나 개선할 만한 항목

- 카테고리 세션 UI 노출 여부 정리
- 문제 추가 방식과 편집 규칙
- 데이터 스키마 분리
- 화면 컴포넌트 분리 기준
- QA 스냅샷 비교 자동화
- 향후 백엔드 연동 시 저장 모델
