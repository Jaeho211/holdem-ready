# Holdem Ready

모바일 중심의 홀덤 학습 앱입니다. 짧은 상황 문제를 반복해서 풀고, 오답과 약점을 다시 복습하면서 라이브 포커 감각을 올리는 것을 목표로 합니다.

상세 구조와 상태 흐름은 [docs/app-overview.md](docs/app-overview.md)에서 볼 수 있습니다.

## 현재 구현 범위

- 홈, 오답, 기록 3개 탭 기반 학습 흐름
- 오늘의 10문제 세션 시작 및 이어풀기
- 최근 오답 재도전, 단일 오답 다시 풀기
- 약점 태그 기반 5문제 드릴
- 라이브 팁 체크리스트 5개 섹션
- 퀴즈 화면의 테이블 시각화, 용어 칩, 피드백 시트
- 설정 모달: 언어, 진동, 사운드, 하루 목표, 데이터 초기화
- PWA 메타데이터와 서비스 워커 기반 기본 오프라인 캐시
- 개발용 UI QA 프리뷰와 Playwright 스크린샷 점검 스크립트

참고:

- 현재 UI에는 별도 `training` 탭이 없습니다.
- 카테고리 세션 생성 로직은 `lib/holdem/sessions.ts`에 남아 있지만, 실제 화면에서는 오늘 세션, 오답 복습, 약점 드릴 중심으로 노출됩니다.

## 문제 구성

- 프리플랍 31문제
- 포스트플랍 29문제
- 확률 28문제
- 라이브 팁 5개 섹션 / 16개 체크 항목

총 88개의 퀴즈 문제와 16개의 체크리스트 항목이 들어 있습니다.

## 화면과 흐름

### 홈

- 오늘 목표 진행률
- 오늘의 10문제 시작 또는 이어풀기
- 최근 오답 기반 약점 요약 문구
- 최근 오답 다시 풀기 진입
- 라이브 팁 진행도 확인

### 오답

- 전체 / 프리플랍 / 포스트플랍 / 확률 / Live Tips 필터
- 최근 틀린 문제 목록
- 문제별 내 선택, 정답, 초보자 실수 포인트 확인
- 태그 기반 약점 드릴 시작
- 단일 문제 다시 풀기

### 기록

- 전체 정답률
- 연속 학습 일수
- 누적 풀이 수
- 카테고리별 정확도
- 최근 7일 학습 빈도
- 약점 3개 추천과 바로가기

### Live Tips

- 핸드 진행 순서
- 핵심 용어
- 빠른 오즈 계산
- 블라인드와 베팅 구조
- 초보 실수

### 퀴즈

- 문제 본문과 상황 카드
- 포커 테이블 형태의 보드 / 히어로 핸드 시각화
- 프리플랍 전용 테이블 정보, 포스트플랍 스포트라이트, 오즈 전용 시각화
- 용어 칩과 글로서리 모달
- 선택 직후 정답 여부, 해설, 초보자 실수 포인트 제공
- 세션 완료 후 결과 요약

### 설정 모달

- 한국어 UI 고정
- 진동 / 사운드 토글
- 하루 목표 문제 수 설정
- 저장 데이터 전체 초기화

## 기술 스택

- Next.js 16.2.1
- React 19.2.4
- Tailwind CSS 4
- TypeScript
- Vitest
- Playwright

## 실행 방법

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000`을 열면 됩니다.

주요 명령:

```bash
npm run build
npm run lint
npm test
npm run verify:content -- --base origin/main
npm run questions:catalog
npm run qa:questions -- --base origin/main
```

정적 결과물은 `npm run build` 후 `out/` 디렉터리에 생성됩니다.

## UI QA

개발 환경에서 `/qa/ui` 경로로 고정 시나리오 프리뷰를 볼 수 있습니다.

스크린샷 기반 수동 QA:

```bash
npm run qa:ui:install
npm run qa:ui
```

특정 시나리오만 확인하려면:

```bash
npm run qa:ui -- --scenario quiz-postflop
```

결과물은 `.qa-artifacts/ui/` 아래에 스크린샷과 `report.json`으로 저장됩니다.

## Netlify 배포

이 프로젝트는 서버나 DB 없이 동작하므로 정적 사이트로 배포할 수 있습니다.

- Build command: `npm run build`
- Publish directory: `out`

배포 방법:

1. GitHub의 이 저장소를 Netlify에 Import합니다.
2. 빌드 설정에서 `npm run build`와 `out`을 확인합니다.
3. Deploy를 실행하면 공개 URL이 생성됩니다.
4. 이후에는 `main` 브랜치에 푸시할 때마다 자동 재배포됩니다.

PR 기반 미리보기 URL이 필요하면 Netlify Deploy Preview를 켜면 됩니다.

## 데이터 저장 방식

- 서버나 DB 없이 클라이언트 단독으로 동작합니다.
- 학습 기록, 세션 진행 상태, 라이브 팁 체크 상태, 설정은 `localStorage`에 저장됩니다.
- 저장 키는 `holdem-ready:v1`입니다.
- 응답 기록은 최신 500개까지만 유지합니다.
- 하루 목표 문제 수는 홈 진행률 기준이며, 오늘 세션 길이는 항상 10문제로 고정입니다.
- 서비스 워커가 앱 셸에 가까운 리소스를 기본 캐시합니다.

즉, 현재 앱은 개인 학습용 MVP에 가깝고, 로그인이나 동기화 기능은 없습니다.

## 프로젝트 구조

```text
app/
  _components/
    browser.ts               서비스 워커 등록, 진동/사운드 피드백
    holdem-ready-app.tsx     상태 로딩, 저장, 액션 처리
    holdem-ready-model.ts    앱 상태/액션 타입
    holdem-ready-view.tsx    화면 조합과 파생 데이터 계산
    poker-table.tsx          포지션/액션 테이블 시각화
    qa-ui-preview.tsx        개발용 QA 프리뷰 쉘
    qa-ui-scenarios.ts       고정 QA 시나리오 fixture
    screens.tsx              각 화면과 모달 컴포넌트
    ui.tsx                   공용 UI와 카드 컴포넌트
  globals.css               전역 스타일
  layout.tsx                메타데이터와 루트 레이아웃
  manifest.ts               PWA 매니페스트
  page.tsx                  앱 엔트리 포인트
  qa/ui/page.tsx            개발 전용 QA 프리뷰 라우트
lib/
  holdem/
    cards.ts                카드 코드/렌더링 유틸
    constants.ts            저장 키, 세션 크기, 기본 설정
    glossary.ts             용어 칩과 설명
    questions.ts            문제 ID 인덱스
    selectors.ts            통계/오답/약점 계산
    sessions.ts             세션 생성과 진행 로직
    store.ts                localStorage 입출력과 정규화
    table.ts                포스트플랍 스포트라이트 파싱
    types.ts                앱 상태 타입
  training-data.ts          공개 데이터 export 진입점
  training-data/
    questions/              카테고리별 문제 데이터
    question-bank.ts        questionBank 조합
    live-tips.ts            라이브 팁 데이터
    category-meta.ts        카테고리 메타
    defaults.ts             기본 약점 프롬프트
public/
  cards/                    카드 뒷면 SVG
  icon.svg                  앱 아이콘
  sw.js                     서비스 워커
scripts/
  qa-ui.mjs                 Playwright 기반 UI QA 스크립트
```

## 문서

- [앱 개요 문서](docs/app-overview.md)
- [테스트 가이드](docs/testing.md)
- [문제 작성 파이프라인](docs/question-pipeline.md)
- [문제 카탈로그](docs/question-catalog.md)
