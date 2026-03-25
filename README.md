# Holdem Ready

모바일 중심의 홀덤 학습 앱입니다. 짧은 상황 문제를 반복해서 풀고, 오답과 약점을 다시 훈련하면서 라이브 포커 감각을 올리는 것을 목표로 합니다.

상세 구조는 [docs/app-overview.md](docs/app-overview.md)에서 볼 수 있습니다.

## 현재 구현 범위

- 오늘의 10문제 세션
- 카테고리별 훈련
- 오답노트와 오답 재도전
- 약점 태그 기반 5문제 드릴
- 최근 기록, 정답률, 연속 학습, 7일 추이
- 라이브 카지노 팁 체크리스트
- 설정: 진동, 사운드, 하루 목표 문제 수, 데이터 초기화
- PWA 메타데이터와 서비스 워커 기반 기본 오프라인 캐시

## 문제 구성

- 프리플랍 10문제
- 포스트플랍 8문제
- 확률 6문제
- 라이브 팁 5개 섹션 / 15개 체크 항목

총 24개의 퀴즈 문제와 15개의 현장 체크 항목이 들어 있습니다.

## 화면 구성

### 홈

- 오늘 목표 진행률
- 오늘의 10문제 시작 또는 이어풀기
- 현재 약점 태그 표시
- 약한 영역 드릴 진입
- 라이브 팁 진행도
- 카테고리별 빠른 시작

### 훈련

- 프리플랍, 포스트플랍, 확률 훈련 시작
- 카테고리별 이어풀기 / 새로 시작
- 라이브 카지노 팁 체크리스트 진입

### 오답노트

- 전체 / 카테고리별 오답 필터
- 최근 틀린 문제 재도전
- 문제별 내 선택, 정답, 약점 태그 확인

### 기록

- 전체 정답률
- 연속 학습 일수
- 누적 풀이 수
- 카테고리별 정확도
- 최근 7일 학습 빈도
- 현재 약점 3개 추천

### 퀴즈 진행

- 카테고리별 문제 카드
- 보드 5칸과 히어로 핸드 2장을 테이블 형태로 표시
- 앞면 카드는 컴포넌트에서 직접 그린 인덱스/수트 스타일 사용
- 히어로 핸드가 없는 확률 문제는 카드 뒷면으로 숨김 표시
- 선택 직후 정답 여부, 해설, 초보자 실수 포인트 제공
- 세션 완료 후 결과 요약

### 라이브 팁

- 테이블 앉기
- 바잉과 칩 관리
- 액션 순서
- 베팅 규칙
- 초보자 실수

## 기술 스택

- Next.js 16.2.1
- React 19.2.4
- Tailwind CSS 4
- TypeScript

## 실행 방법

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000`을 열면 됩니다.

빌드와 린트:

```bash
npm run build
npm run lint
npm test
```

정적 결과물은 `npm run build` 후 `out/` 디렉터리에 생성됩니다.

## Netlify 배포

이 프로젝트는 현재 서버나 DB 없이 동작하므로 정적 사이트로 배포할 수 있습니다.

이미 저장소에 Netlify용 설정이 포함돼 있습니다.

- Build command: `npm run build`
- Publish directory: `out`

배포 방법:

1. GitHub의 이 저장소를 Netlify에 Import합니다.
2. 빌드 설정이 보이면 기본값 대신 `npm run build`와 `out`을 확인합니다.
3. Deploy를 실행하면 공개 URL이 생성됩니다.
4. 이후에는 `main` 브랜치에 푸시할 때마다 자동 재배포됩니다.

PR 기반 미리보기 URL이 필요하면 Netlify Deploy Preview를 켜면 됩니다.

## 데이터 저장 방식

- 서버나 DB 없이 클라이언트 단독으로 동작합니다.
- 학습 기록, 세션 진행 상태, 라이브 팁 체크 상태, 설정은 `localStorage`에 저장됩니다.
- 저장 키는 `holdem-ready:v1`입니다.
- 서비스 워커가 `/`, 매니페스트, 아이콘을 기본 캐시합니다.

즉, 현재 앱은 개인 학습용 MVP에 가깝고, 로그인이나 동기화 기능은 없습니다.

## 프로젝트 구조

```text
app/
  _components/
    holdem-ready-app.tsx  클라이언트 상태와 화면 전환
    screens.tsx           화면별 UI 구성
    ui.tsx                공용 UI와 카드 컴포넌트
  globals.css        전역 스타일
  layout.tsx         메타데이터와 루트 레이아웃
  manifest.ts        PWA 매니페스트
  page.tsx           앱 엔트리 포인트
lib/
  holdem/
    cards.ts         카드 코드, 라벨, 에셋 경로 유틸
    selectors.ts     통계/오답/약점 계산
    sessions.ts      세션 생성과 진행 로직
    store.ts         localStorage 입출력
  training-data.ts   문제 은행, 카테고리 메타, 라이브 팁 데이터
public/
  cards/             카드 뒷면 SVG와 카드 관련 정적 에셋
  icon.svg           앱 아이콘
  sw.js              서비스 워커
```

현재 구현은 App Router 엔트리에서 `HoldemReadyApp`을 불러오고, 상태 로직과 화면 UI가 `app/_components/` 아래로 분리돼 있습니다.

## 문서

- [앱 개요 문서](docs/app-overview.md)
- [테스트 가이드](docs/testing.md)
