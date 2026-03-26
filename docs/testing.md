# 테스트 가이드

이 프로젝트의 테스트는 두 갈래입니다.

- `Vitest`: 데이터/로직 검증
- `Playwright`: 개발용 UI 시나리오 스크린샷 및 레이아웃 점검

두 방식 모두 현재는 **수동 실행**입니다. 저장, 커밋, 푸시 시 자동으로 돌지 않습니다.

## 언제 테스트가 도는가

현재 테스트는 아래 경우에만 실행됩니다.

- 개발자가 직접 `npm test`를 실행할 때
- 개발자가 직접 `npx vitest run ...`으로 특정 테스트 파일을 실행할 때
- 개발자가 직접 `npm run qa:ui`를 실행할 때

자동 실행되지 않는 항목:

- 파일 저장 시 자동 실행 없음
- Git pre-commit 훅 없음
- GitHub Actions / CI 없음

근거:

- [`package.json`](../package.json)에서 `test` 스크립트는 `vitest run`
- [`package.json`](../package.json)에서 `qa:ui` 스크립트는 `node scripts/qa-ui.mjs`
- [`vitest.config.ts`](../vitest.config.ts)에서 `lib/**/*.test.ts`만 테스트 대상으로 포함
- 저장소에 `.husky/`, `.github/workflows/`가 없음

## 실행 방법

전체 테스트:

```bash
npm test
```

특정 파일만:

```bash
npx vitest run lib/holdem/question-bank.test.ts
npx vitest run lib/holdem/outs.test.ts
```

UI QA 실행:

```bash
npm run qa:ui:install
npm run qa:ui
```

특정 시나리오만:

```bash
npm run qa:ui -- --scenario quiz-postflop
```

테스트와 별개로 린트도 같이 확인하는 편이 좋습니다.

```bash
npm run lint
```

## 어떤 파일이 테스트되는가

### 1. Vitest 로직 테스트

Vitest 설정은 [`vitest.config.ts`](../vitest.config.ts)에 있습니다.

```ts
test: {
  environment: "node",
  include: ["lib/**/*.test.ts"],
}
```

즉 현재는 `lib/` 아래의 `*.test.ts` 파일만 실행됩니다.

주요 테스트 파일:

- [`lib/holdem/question-bank.test.ts`](../lib/holdem/question-bank.test.ts): 문제 데이터 자동 검증
- [`lib/holdem/outs.test.ts`](../lib/holdem/outs.test.ts): 아웃 계산 로직 검증
- [`lib/holdem/glossary.test.ts`](../lib/holdem/glossary.test.ts): 글로서리 칩 추출 검증
- [`lib/holdem/cards.test.ts`](../lib/holdem/cards.test.ts): 카드 코드/핸드 표기 정합성 검증
- [`lib/holdem/sessions.test.ts`](../lib/holdem/sessions.test.ts): 세션 생성/진행 검증
- [`lib/holdem/store.test.ts`](../lib/holdem/store.test.ts): 저장 포맷 검증
- [`lib/holdem/selectors.test.ts`](../lib/holdem/selectors.test.ts): 통계/선택자 계산 검증
- [`lib/holdem/table.test.ts`](../lib/holdem/table.test.ts): 액션 파서 검증

### 2. Playwright UI QA

UI QA는 [`scripts/qa-ui.mjs`](../scripts/qa-ui.mjs)가 담당합니다.

이 스크립트는 다음 순서로 동작합니다.

1. 기존 개발 서버 `http://127.0.0.1:3000`이 살아 있으면 재사용합니다.
2. 없으면 별도 개발 서버를 `http://127.0.0.1:3301`에서 띄웁니다.
3. 개발 전용 라우트 [`app/qa/ui/page.tsx`](../app/qa/ui/page.tsx)의 시나리오 목록을 읽습니다.
4. 각 시나리오를 모바일 뷰포트 `384x698` 기준으로 캡처합니다.
5. 수평 오버플로우, 잘림, 형제 요소 겹침을 검사합니다.
6. 결과를 `.qa-artifacts/ui/report.json`과 PNG 파일로 저장합니다.

시나리오 정의는 [`app/_components/qa-ui-scenarios.ts`](../app/_components/qa-ui-scenarios.ts)에 있습니다.

대표 시나리오:

- `home-default`
- `home-progress`
- `wrongs-list`
- `records-populated`
- `live-tips`
- `quiz-preflop`
- `quiz-postflop`
- `quiz-feedback-sheet`
- `quiz-summary`
- `settings-modal`

주의:

- `/qa/ui`는 개발 환경에서만 열립니다.
- Chromium이 없으면 먼저 `npm run qa:ui:install`을 한 번 실행해야 합니다.

## 문제 데이터 테스트 구조

핵심 데이터 검증은 [`lib/holdem/question-bank.test.ts`](../lib/holdem/question-bank.test.ts)에서 수행합니다.

### 8-A. 공통 검증

모든 문제를 순회하며 아래를 확인합니다.

- ID 유일성
- `pre-001`, `post-001`, `odds-001` 형식
- `pitfall`이 `실수`로 끝나는지
- `tags` 길이 2개인지
- `correct`가 유효한 선택지인지
- 카드가 있으면 유효한 `CardCode`인지

### 8-B. Postflop 정합성

포스트플랍 문제는 추가로 아래를 확인합니다.

- `holeCards`와 `board` 사이 카드 중복 없음
- 모든 카드 코드 유효
- `board` 길이 3~5장

### 8-C. Odds 수학 검증

확률 문제는 두 부류로 검증합니다.

1. 포트 오즈 문제

- `pot`, `villainBet`, `correct`를 읽어 필요 승률이 맞는지 계산합니다.
- `pot` 필드가 "상대 베팅 포함 팟"인지 "기존 팟"인지 문제별 표현이 섞여 있어, 현재 테스트는 가능한 두 해석 중 하나와 맞으면 통과하도록 되어 있습니다.

2. 카드 기반 아웃 문제

- `mathFocus`에서 `10 Outs`, `15 Outs` 같은 숫자를 파싱합니다.
- 각 문제의 `outsSpec`을 기반으로 실제 아웃 카드를 계산합니다.
- 계산된 고유 아웃 수가 `mathFocus`와 같은지 확인합니다.
- 계산된 확률이 `correct`와 1%p 이내인지 확인합니다.

## 아웃 계산 알고리즘

카드 기반 아웃 검증은 [`lib/holdem/outs.ts`](../lib/holdem/outs.ts)에서 담당합니다.

### 1. 입력

- `holeCards`
- `board`
- `outsSpec`

`outsSpec`은 문제 작성자가 "이 문제에서 어떤 종류의 아웃을 세는가"를 명시하는 구조입니다.

예:

```ts
outsSpec: {
  components: ["overcardPair", "straightDraw"];
}
```

### 2. 지원하는 아웃 컴포넌트

- `straightDraw`
- `flushDraw`
- `overcardPair`
- `holePairImprove`
- `currentPairTrips`
- `pocketPairSet`

### 3. 컴포넌트별 계산 방식

#### `straightDraw`

- 현재 `holeCards + board`로 이미 스트레이트면 추가 아웃은 `0`
- 그렇지 않으면 남은 모든 카드 47장 또는 46장을 하나씩 대입
- 대입 후 스트레이트가 완성되는 카드만 아웃으로 채택
- 스트레이트 판정은 중복 랭크를 제거한 뒤 연속 5장 이상인지 검사
- A는 `A-2-3-4-5` 휠도 허용하도록 `14`와 `1`을 함께 취급

#### `flushDraw`

- 현재 카드 중 같은 수트가 정확히 4장인 경우만 플러시 드로우로 간주
- 그 수트의 남은 카드 전부를 아웃으로 계산

#### `overcardPair`

- 홀카드 랭크 중 보드 최고 랭크보다 높은 랭크만 고릅니다.
- 그 랭크와 같은 남은 카드들을 아웃으로 계산합니다.
- 예: `AK` on `QJ72`면 `A 3장 + K 3장`

#### `holePairImprove`

- 홀카드 두 랭크의 남은 카드 전부를 계산합니다.
- 이미 원페어를 가진 핸드가 투페어/트립스로 좋아지는 교육용 문제에 사용합니다.

#### `currentPairTrips`

- 이미 보드와 맞아 있는 홀카드 랭크만 골라, 그 랭크의 남은 카드만 계산합니다.
- 예: `98` on `T79`에서 `9`만 트립스 아웃으로 계산

#### `pocketPairSet`

- 포켓페어이고 아직 보드에 같은 랭크가 없을 때만 적용
- 남은 같은 랭크 2장을 셋 아웃으로 계산

### 4. 중복 제거

여러 컴포넌트를 함께 쓰면 같은 카드가 둘 이상의 이유로 잡힐 수 있습니다.
테스트에서는 각 컴포넌트 결과를 합친 뒤 `Set`으로 중복을 제거합니다.

예:

- 플러시 아웃과 스트레이트 아웃이 같은 카드인 경우
- 오버카드 페어 아웃과 다른 개선 아웃이 겹치는 경우

최종 아웃 수는 항상 **고유 카드 기준**입니다.

### 5. 확률 계산 방식

#### Turn to River

턴 문제는 남은 카드가 46장입니다.

```text
hit% = outs / 46
```

예:

- 10아웃이면 `10 / 46 = 21.74%`
- 문제에서는 반올림해 `22%`

#### Flop to River

플랍 문제는 턴과 리버 두 장을 모두 봅니다.
적중 확률은 "두 번 다 못 맞을 확률"의 여집합으로 계산합니다.

```text
hit% = 1 - ((47 - outs) / 47) * ((46 - outs) / 46)
```

예:

- 8아웃이면 약 `31.45%`
- 15아웃이면 약 `54.12%`

테스트는 계산값과 `correct` 차이가 `1%p` 이내면 통과로 봅니다.
즉 표기용 반올림은 허용하지만, 잘못된 스팟 설계는 통과하지 못하게 하는 의도입니다.

## 새 odds 문제를 추가할 때

카드가 있는 아웃 문제라면 아래를 같이 넣어야 합니다.

1. `holeCards`
2. `board`
3. `mathFocus`의 아웃 수 표기
4. `correct`의 반올림 확률
5. `outsSpec`

예:

```ts
{
  id: "odds-999",
  category: "odds",
  title: "Turn 10 Outs",
  holeCards: ["Ah", "Kd"],
  board: ["Qc", "Js", "7h", "2d"],
  outsSpec: { components: ["overcardPair", "straightDraw"] },
  mathFocus: "10 Outs / Turn to River",
  correct: "22",
}
```

이렇게 하면 `question-bank.test.ts`가 문구와 숫자를 같이 검증합니다.

## 한계

이 테스트는 "포커 엔진 전체"가 아니라 "문제 작성자가 의도한 교육용 아웃 계산"을 검증합니다.
즉 모든 문제를 GTO/에퀴티 계산기로 재해석하지는 않습니다.

예를 들어:

- 더 약한 페어 메이드까지 모두 포함할지
- 이미 쇼다운 가치가 있는 핸드의 추가 개선만 셀지
- 백도어를 교육 목적상 제외할지

이런 부분은 `outsSpec`으로 명시적으로 고정합니다.
즉 테스트는 자연어를 추측하지 않고, 문제 작성 의도를 구조화해서 검증합니다.
