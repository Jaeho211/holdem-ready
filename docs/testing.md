# 테스트 가이드

이 프로젝트의 콘텐츠 검증은 세 층으로 나뉩니다.

- `questions:validate`: 문제 데이터 규칙 검증
- `Vitest`: 로직 및 통합 테스트
- `Playwright`: 모바일 UI 레이아웃 QA
- `release:assets`: Play 스토어용 그래픽 / 스크린샷 생성

문제 데이터 작업은 이제 수동 확인만으로 끝내지 않습니다. 관련 파일이 바뀌면 로컬 `pre-push`와 GitHub Actions가 자동 게이트를 겁니다.

## 자동 실행 지점

### 1. 로컬 pre-push

- `.githooks/pre-push`가 `node scripts/pre-push-verify.mjs`를 실행합니다.
- 질문 데이터, validator, QA, 파이프라인 문서 관련 파일이 바뀐 경우에만 동작합니다.
- 실행 내용:
  - `npm run verify:content`
  - `docs/question-catalog.md` 최신화 여부 확인

관련 파일이 아니면 no-op입니다.

### 2. GitHub Actions

- 워크플로 파일: [`content-quality.yml`](../.github/workflows/content-quality.yml)
- PR과 `main` push에서, 콘텐츠 관련 경로가 바뀐 경우에만 실행됩니다.
- 실행 내용:
  - `npm ci`
  - `npm run verify:content -- --base <base sha>`
  - generated catalog drift 확인
  - `npm run qa:ui:install`
  - `npm run qa:questions -- --base <base sha>`

즉, question data가 포함된 PR은 `verify:content`와 `qa:questions`를 둘 다 통과해야 merge 가능합니다.

## 핵심 명령

전체 콘텐츠 검증:

```bash
npm run verify:content -- --base origin/main
```

이 명령은 아래를 순서대로 실행합니다.

1. `npm run lint`
2. `npx tsc --noEmit`
3. `npm run questions:validate`
4. `npm test`
5. `npm run questions:catalog`
6. `npm run questions:batch-report -- --base <ref>`

질문 데이터 validator만 단독 실행:

```bash
npm run questions:validate
```

catalog 생성:

```bash
npm run questions:catalog
```

변경 문제 batch report 생성:

```bash
npm run questions:batch-report -- --base origin/main
```

변경 문제 모바일 QA:

```bash
npm run qa:ui:install
npm run qa:questions -- --base origin/main
```

기존 고정 fixture 기반 앱 셸 smoke QA:

```bash
npm run qa:ui
```

## 질문 데이터 validator

공통 validator는 [`lib/holdem/question-bank-validator.ts`](../lib/holdem/question-bank-validator.ts)에 있습니다.
[`lib/holdem/question-bank.test.ts`](../lib/holdem/question-bank.test.ts)는 이 shared validator를 호출하는 통합 테스트 레이어입니다.

### Hard fail 규칙

- 카테고리별 ID 연속성 및 no-gap
- `questionBank` 카테고리 순서 유지
- 문자열 trim / empty 금지
- `tags` 정확히 2개
- tag registry 미등록 태그 금지
- `pitfall`의 `"~실수"` 패턴 유지
- `title <= 32자`
- `prompt <= 100자`
- `prompt <= 2문장`
- `prompt` 금지 표현 차단
- `actionBefore <= 60자`
- `mathFocus <= 24자`
- whole-bank 난이도 분포 `기초 30-50 / 실전 30-50 / 응용 10-30`
- exact duplicate signature 금지

카테고리별 추가 규칙:

- preflop: `hand`와 `holeCards` 일치
- postflop: `reviewSpec`과 실제 카드 상태 일치
- postflop: `title`, `prompt`, `explanation`의 핵심 용어와 `reviewSpec` 모순 금지
- odds: `options.length === 3`
- odds: `options[].label`은 `/^(약 )?\d+%$/`
- odds: pot odds는 `pot = 현재 팟(상대 베팅 포함)` 규약만 허용
- odds: 카드 기반 문제는 `outsSpec` 기준 아웃 수/확률 자동 검산

### Warning 규칙

- near duplicate signature

warning은 테스트를 깨지 않지만, batch report의 필수 샘플 검수 대상으로 올라갑니다.

## Postflop reviewSpec 검증

postflop 문제는 `reviewSpec`이 필수입니다.

```ts
reviewSpec: {
  street: "flop" | "turn" | "river";
  madeHand?: "topPair" | "middlePair" | "bottomPair" | "overpair" | "twoPair" | "set" | "trips" | "straight" | "flush" | "fullHouse";
  draws?: ("flushDraw" | "nutFlushDraw" | "oesd" | "gutshot" | "comboDraw")[];
  boardTexture?: "dry" | "wet";
  suitTexture?: "rainbow" | "twoTone" | "mono";
}
```

validator는 [`postflop-review.ts`](../lib/holdem/postflop-review.ts)에서 실제 값을 계산해 아래를 비교합니다.

- street
- made hand
- draws
- board texture
- suit texture

또한 `탑페어`, `미들페어`, `바텀페어`, `오버페어`, `투페어`, `셋`, `트립스`, `플러시 드로우`, `넛 플러시 드로우`, `오픈엔디드`, `거트샷`, `콤보 드로우`, `젖은 보드`, `드라이 보드`, `레인보우`, `투톤` 같은 키워드가 `title/prompt/explanation`에 들어가면 `reviewSpec`과 모순되면 fail입니다.

## Odds 수학 검증

카드 기반 문제는 [`outs.ts`](../lib/holdem/outs.ts)로 자동 검산합니다.

- `mathFocus`의 아웃 수와 실제 계산 아웃 수 비교
- `correct`와 실제 hit rate 비교
- `outsSpec` 누락 시 fail

포트 오즈 문제는 `pot` 의미를 하나로 고정합니다.

- `pot`: 상대 베팅이 이미 포함된 현재 팟
- `villainBet`: 지금 내가 콜해야 하는 금액

예:

```ts
pot: "60bb"
villainBet: "30bb"
correct: "33"
```

검산:

```text
30 / (60 + 30) = 33.3%
```

## Batch Report

batch report는 [`question-batch-report.ts`](../lib/holdem/question-batch-report.ts)가 생성합니다.

산출물:

- `.qa-artifacts/questions/batch-report.json`
- `.qa-artifacts/questions/batch-report.md`

포함 내용:

- 변경 question ID 목록
- 카테고리별 변경 개수
- exact duplicate / near duplicate
- 새 태그
- whole-bank / batch-only 난이도 비율
- 변경 문제 기준 validation warning / error
- 필수 샘플 검수 ID

샘플 검수 규칙:

- 변경 문제가 12개 이하이면 전수 검수
- 13개 이상이면 warning/error 전수 검수 + 카테고리별 clean question 15% 추가
- 카테고리별 샘플은 최소 1개, 최대 5개
- 샘플 선택은 deterministic ordering

## UI QA

### 1. `qa:questions`

변경된 question만 모바일 뷰포트에서 렌더링합니다.

- 기준 뷰포트: `384x698`
- 상태: 각 문제를 `quiz`, `feedback` 두 상태로 검사
- 검사 항목:
  - horizontal overflow
  - clipped elements
  - sibling overlap

산출물:

- `.qa-artifacts/questions/qa-report.json`
- 변경 문제별 PNG 스크린샷

개발 서버는 다음 규칙으로 처리합니다.

1. `QA_UI_BASE_URL`이 있으면 그 서버 사용
2. 없고 `http://127.0.0.1:3000`이 살아 있으면 재사용
3. 둘 다 아니면 `http://127.0.0.1:3301`에서 개발 서버를 띄움

### 2. `qa:ui`

[`app/_components/qa-ui-scenarios.ts`](../app/_components/qa-ui-scenarios.ts)의 고정 fixture를 이용한 앱 셸 smoke test입니다.
새 문제 콘텐츠 레이아웃 검증은 `qa:questions`가 담당하고, `qa:ui`는 홈/요약/설정 같은 화면 회귀 확인 용도로 유지합니다.

기본 뷰포트:

- `360x780` small phone
- `412x915` large phone
- `800x1280` tablet portrait

옵션:

```bash
npm run qa:ui -- --viewport large-phone
```

즉, 출시 전에는 단일 모바일 폭만 보는 대신 작은 폰, 큰 폰, 대화면 세로 레이아웃까지 함께 점검합니다.

## 릴리스 자산 생성

```bash
npm run release:assets
```

산출물:

- `public/icons/` PWA / Android 아이콘 PNG
- `.release-artifacts/play-store/` feature graphic, 스토어용 폰 스크린샷

## 관련 파일

- [`lib/holdem/question-bank-validator.ts`](../lib/holdem/question-bank-validator.ts)
- [`lib/holdem/question-batch-report.ts`](../lib/holdem/question-batch-report.ts)
- [`lib/holdem/question-bank.test.ts`](../lib/holdem/question-bank.test.ts)
- [`lib/holdem/question-bank-validator.test.ts`](../lib/holdem/question-bank-validator.test.ts)
- [`scripts/questions-validate.ts`](../scripts/questions-validate.ts)
- [`scripts/questions-catalog.ts`](../scripts/questions-catalog.ts)
- [`scripts/questions-batch-report.ts`](../scripts/questions-batch-report.ts)
- [`scripts/qa-questions.mjs`](../scripts/qa-questions.mjs)
- [`scripts/verify-content.mjs`](../scripts/verify-content.mjs)
- [`docs/question-pipeline.md`](question-pipeline.md)
