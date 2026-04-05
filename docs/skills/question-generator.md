# Question Generator Skill

이 문서는 `lib/training-data/questions/*.ts`의 `questionBank` 데이터에 새 문제를 추가할 때 따라야 할 규칙과 레퍼런스입니다.
AI 코딩 도구(Gemini, Claude Code, Codex 등)가 이 문서를 읽고 일관된 품질의 문제를 생성합니다.

---

## 1. 타입 스키마

모든 문제 타입은 `lib/training-data.ts`에서 export됩니다. 추가 전에 공개 타입과 해당 카테고리 파일의 최신 구조를 함께 확인하세요.

> **타입 임포트**: `CardCode = \`${CardRank}${CardSuit}\``, `HoleCards = readonly [CardCode, CardCode]` — `lib/holdem/cards.ts`에서 정의

### PreflopQuestion

```ts
{
  id: string;              // "pre-NNN" (3자리 0-패딩, 기존 마지막 번호 +1)
  category: "preflop";
  difficulty: "기초" | "실전" | "응용";
  title: string;           // 핵심 상황 한 줄 (ex: "UTG 첫 오픈 결정")
  prompt: string;          // 상황 설명 1~2문장, 판단 포인트 제시
  explanation: string;     // 왜 이 액션이 맞는지 2~3문장
  pitfall: string;         // 초보가 하기 쉬운 실수 한 줄
  tags: string[];          // 2개 권장 (아래 태그 목록 참조)
  hand: string;            // "AJo", "76s", "TT" 등
  holeCards: HoleCards;    // ["Ah", "Jc"] — hand의 구체적 카드 2장
  position: string;        // "UTG" | "MP" | "HJ" | "CO" | "BTN" | "SB" | "BB"
  table: string;           // "100bb" 형식 (9-handed 고정이므로 생략)
  stack: string;           // "유효스택 100bb" 형식 (UI에 표시되는 값)
  actionBefore: string;    // 앞선 액션 한 줄
  correct: "fold" | "call" | "raise";
}
```

### PostflopQuestion

```ts
{
  id: string;              // "post-NNN"
  category: "postflop";
  difficulty: "기초" | "실전" | "응용";
  title: string;
  prompt: string;
  explanation: string;
  pitfall: string;
  tags: string[];
  position: string;        // "UTG" | "MP" | "HJ" | "CO" | "BTN" | "SB" | "BB"
  preflopAction: string;   // "BB 콜, 나머지 폴드" — 프리플랍 라인 한 줄
  holeCards: HoleCards;    // ["Qs", "Js"] — 2장 튜플
  board: CardCode[];       // 3~5장 (플랍/턴/리버)
  pot: string;             // "12bb" 형식
  villainBet: string;      // "6bb" 또는 "15bb 체크레이즈" 등
  actionBefore: string;    // 라인 설명 한 줄
  stack: string;           // "94bb 남음" 형식
  reviewSpec: {
    street: "flop" | "turn" | "river";
    madeHand?:
      | "topPair"
      | "middlePair"
      | "bottomPair"
      | "overpair"
      | "twoPair"
      | "set"
      | "trips"
      | "straight"
      | "flush"
      | "fullHouse";
    draws?: ("flushDraw" | "nutFlushDraw" | "oesd" | "gutshot" | "comboDraw")[];
    boardTexture?: "dry" | "wet";
    suitTexture?: "rainbow" | "twoTone" | "mono";
  };
  correct: "fold" | "call" | "raise";
}
```

### OddsQuestion

```ts
{
  id: string;              // "odds-NNN"
  category: "odds";
  difficulty: "기초" | "실전" | "응용";
  title: string;
  prompt: string;
  explanation: string;
  pitfall: string;
  tags: string[];
  holeCards?: HoleCards;   // 선택 — 없으면 순수 수학 문제
  board?: CardCode[];      // 선택
  outsSpec?: {             // 카드 기반 아웃 문제면 사실상 필수
    components: (
      | "straightDraw"
      | "flushDraw"
      | "overcardPair"
      | "holePairImprove"
      | "currentPairTrips"
      | "pocketPairSet"
    )[];
  };
  pot: string;             // 현재 팟 (상대 베팅 포함), "60bb" 형식
  villainBet: string;
  actionBefore: string;
  mathFocus: string;       // "9 Outs / Turn to River" 형식
  options: { value: string; label: string }[];  // 3개 선택지
  correct: string;         // options의 value 중 하나
}
```

---

## 2. ID 규칙

| 카테고리 | 접두사 | 예시 |
|----------|--------|------|
| preflop  | `pre-` | `pre-011`, `pre-012` |
| postflop | `post-` | `post-009`, `post-010` |
| odds     | `odds-` | `odds-007`, `odds-008` |

- **3자리 0-패딩** 사용
- 기존 마지막 ID를 확인하고 그 다음 번호 사용
- 중간 번호 삽입 금지

---

## 3. 난이도 분배

| 난이도 | 비율 | 설명 |
|--------|------|------|
| 기초 | ~40% | 명확한 정답이 있는 기본 상황 |
| 실전 | ~40% | 판단이 필요한 현실적 상황 |
| 응용 | ~20% | 복합적이거나 반직관적인 상황 |

---

## 4. 태그 가이드

태그의 소스 오브 트루스는 [`lib/training-data/question-tags.ts`](../../lib/training-data/question-tags.ts)입니다.

- 문제마다 `tags`는 **정확히 2개**
- 기존 태그 재사용이 기본
- 새 태그가 필요하면 문제를 추가하기 전에 반드시 registry를 먼저 수정
- registry에 없는 태그는 `npm run questions:validate`에서 즉시 fail

### 현재 registry

**Preflop**: 초반 포지션, 오프수트 브로드웨이, 버튼 스틸, 수딧 커넥터, SB 디펜스, BB 디펜스, 컷오프 오픈, 강한 브로드웨이, 작은 페어, 수딧 에이스, 지배당하는 핸드, 림퍼 아이솔레이트, 수딧 브로드웨이, SB 스틸, 폴드 투 유, 3벳 팟, 4벳 팟, 포켓페어 오픈, 미들 포지션, HJ 오픈, 스퀴즈, 오버림프, 숏스택

**Postflop**: 탑페어 운영, 플랍 콜다운, 강한 메이드 핸드, 젖은 보드, 약한 드로우, 턴 폴드, 강한 드로우, 오버페어 운영, 멀티웨이, 리버 밸류벳, 리버 블러프 캐치, 체크레이즈, 돈크벳 대응, 드라이 보드, 턴 더블배럴, 셋 슬로우플레이, 보텀페어, 미들페어

**Odds**: 아웃 계산, 턴 확률, 플랍 확률, 포트 오즈, 필요 승률, 콤보 드로우, 임플라이드 오즈, 리버스 임플라이드 오즈, 블러프 빈도, MDF, 콤보 카운팅

---

## 5. 관점과 톤

- **대상**: 라스베가스 1/3 라이브 저스테이크 초보
- **언어**: 한국어
- **톤**: 코치가 옆에서 짧게 정리해주는 느낌
- **explanation**: 왜 이 선택이 맞는지 + 라이브 필드에서의 실전 팁
- **pitfall**: "~하는 실수"로 끝나는 한 줄 패턴
- **prompt**: 상황을 제시하되 답을 유도하지 않기

---

## 5-A. UI 렌더링 계약

`questionBank`의 각 필드는 단순 데이터가 아니라, 실제 앱 화면에서 **보이는 위치와 역할이 다릅니다**.
문제를 작성할 때는 "뜻이 맞는가?"뿐 아니라, "**이 문장이 화면에서 어떤 크기와 밀도로 보이는가**"까지 같이 고려해야 합니다.

### 공통 원칙

- **title**: 문제 카드 최상단의 짧은 헤드라인으로 노출됨. 길게 쓰지 말고 핵심 상황만 압축
- **prompt**: 문제를 풀기 **전에** 보이는 본문 카드. 이 문장만 읽어도 상황이 이해되어야 함
- **explanation**: 정답 확인 **후** 피드백 패널의 메인 해설. 계산, 전략 이유, 실전 팁은 여기에 배치
- **pitfall**: 정답 확인 **후** "Beginner Leak" 카드에 따로 노출됨. 한 줄로 단정하게 작성
- **tags**: 풀이 중 본문으로 보이지 않으며, 오답 복습/약점 세션 추천에 사용됨
- 용어가 `title`, `prompt`, `explanation`, `pitfall`, `actionBefore`, `mathFocus`에 들어가면 글로서리 칩으로 추출될 수 있으므로, 용어 선택도 일관되게 유지

### 필드별 작성 규칙

#### `title`

- 화면 최상단 `CardEyebrow` 스타일로 보여서 **짧고 즉시 읽혀야 함**
- 3~6단어 수준 권장
- 설명문보다 **상황 이름**에 가깝게 작성
- 예: `"Turn 5 Outs"` / `"UTG 첫 오픈 결정"`
- 비추천: 해설까지 포함한 긴 문장

#### `prompt`

- 문제 풀이 전에 별도 본문 카드로 노출됨
- 사용자가 선택지를 누르기 전에 읽는 핵심 문장이라, **맥락 부족이 없어야 함**
- 단, 정답 방향을 직접 암시하면 안 됨
- `prompt`는 **상황 설명**에 머물고, 액션 결론이나 코칭 문장은 `explanation`으로 보낸다
- 허용 표현: 포지션 불리함, 멀티웨이 가능성, 보드 텍스처, 가격 존재, 개선 가능성, 초보가 흔들리는 이유
- 금지 표현: `"좋은 자리"`, `"명확한 밸류 오픈"`, `"폴드가 편함"`, `"계속 갈 수 있다"`, `"공격적으로 열 수 있다"`, `"과감히 접어야 한다"`, `"~이 우선입니다"`처럼 정답 방향을 직접 미는 문장
- `odds` 문제에서는 특히 "왜 이 상황이 몇 아웃인지"를 사용자가 추론할 수 있을 정도로 써야 함
- 비추천: `"턴에서 5아웃 확률을 묻는 문제입니다"`처럼 숫자만 말하고 근거 상황은 생략하는 문장
- 리라이트 예시: `"스틸하기 좋은 자리입니다"` → `"블라인드만 남아 있어 포지션 이점이 큰 스팟입니다"`
- 리라이트 예시: `"명확한 밸류 오픈입니다"` → `"뒤 플레이어 수가 적어 핸드 강도를 살리기 좋은 스팟입니다"`
- 리라이트 예시: `"적절한 가격이면 계속 갈 수 있습니다"` → `"가격과 쇼다운 가치가 함께 걸린 상황입니다"`

#### `explanation`

- 정답 확인 뒤 펼쳐지는 본문 해설
- 확률 숫자, 간단 계산식, 전략적 의미, 라이브 저스테이크 팁을 넣어도 됨
- 문제 풀이 전에 보일 필요가 없는 정보는 여기로 보내는 것이 맞음

#### `pitfall`

- 정답 확인 뒤 별도 경고 카드로 보임
- 초보가 자주 하는 누수를 한 문장으로 요약
- 반드시 `"~하는 실수"` 패턴 유지

#### `actionBefore`

- **preflop/postflop**에서는 테이블 상황 요약으로 시각화되거나 보조 정보로 노출됨
- 그래서 문장형 설명보다 **압축된 액션 라인**으로 작성해야 함
- 예: `"HJ 3bb 오픈, 나머지 폴드"`, `"BTN 오픈에 BB 콜, 플랍 체크 후 BTN c-bet"`
- 비추천: 해설형 긴 문장, 감상형 문장
- **odds**에서는 현재 메인 문제 화면에 직접 노출되지 않는 경우가 있으므로, 핵심 설명을 `actionBefore`에만 의존하면 안 됨

#### `mathFocus`

- `odds` 문제의 작은 라벨/보조 헤더로 노출됨
- 공식명, 구조명, 거리(플랍→리버 / 턴→리버)처럼 **짧은 표기용 텍스트**로 작성
- 예: `"5 Outs / Turn to River"`, `"Half Pot Bet"`
- 비추천: 완전한 설명문, 계산 결과를 포함한 긴 서술

### 카테고리별 주의점

#### Preflop

- `title`과 `actionBefore`만 봐도 자리와 스팟이 빠르게 읽혀야 함
- `prompt`는 왜 판단이 애매한지, 초보가 어디서 흔들리는지 설명하는 용도

#### Postflop

- 보드/핸드가 같이 보이므로 `prompt`는 판단 포인트를 짚는 쪽이 좋음
- `actionBefore`는 라인 요약, `explanation`은 액션 이유를 담당

#### Odds

- `holeCards`와 `board`가 있으면 사용자는 카드를 실제로 보면서 풂
- 따라서 `prompt`는 "몇 아웃인지 알 수 있는 단서"를 포함해야 함
- `actionBefore`는 현재 odds UI에서 핵심 설명 필드가 아니므로, **아웃 근거를 여기에만 숨기면 안 됨**
- `mathFocus`는 문제의 수학 타입을 보여주는 라벨일 뿐, 본문 설명을 대체하지 못함
- 카드 기반 아웃 문제면 `outsSpec`을 반드시 함께 넣어, 테스트가 실제 카드 기준으로 아웃 수와 확률을 자동 검산할 수 있게 할 것
- `outsSpec`은 자연어 해석용이 아니라 **작성 의도를 구조화하는 필드**이므로, "이 문제에서 어떤 개선만 셀 것인가"를 명시적으로 고르기

### 작성 전 자문

- 이 문장이 화면에 떴을 때 한눈에 읽히는가?
- 이 정보가 정답 **전**에 보여도 되는가, 아니면 **후** 해설로 보내야 하는가?
- 이 필드가 실제로 크게 보이는가, 작게 보이는가, 혹은 거의 보이지 않는가?
- 핵심 맥락이 `prompt` 없이도 이해되는가? 아니라면 `prompt`를 더 구체화
- `prompt`만 읽고도 액션이 거의 확정된다면, 문장이 너무 직접적이지 않은가?
- 반대로 `prompt`를 빼면 스팟이 무너진다면, 핵심 맥락을 너무 많이 여기에만 실어 둔 것은 아닌가?

---

## 5-B. 표현 리뷰 연계

`question-generator`는 문제 구조와 필드 역할의 기준 문서입니다. 문장을 최종 반영하기 전에는 반드시 [question-expression-review.md](question-expression-review.md) 기준으로 **표현 검수 1회**를 추가하세요.

- 생성 규칙과 필드 계약은 이 문서가 우선합니다.
- 표현 검수는 한국어 자연스러움, 번역투, 필드 역할 혼선, 정답 유도 표현을 잡는 **2차 검수**입니다.
- 가능하면 `title`, `prompt`, `explanation`, `pitfall`, `actionBefore`를 함께 넘겨 문맥 속에서 검토하세요.
- 리뷰 결과가 이 문서의 작성 규칙과 충돌하면, 문장을 다시 조정하되 **이 문서의 계약을 우선**합니다.

---

## 6. 시나리오 커버리지 (중복 방지)

수동으로 유지하는 “이미 커버된 스팟” 표는 더 이상 쓰지 않습니다.
현재 커버리지는 `npm run questions:catalog`로 생성하는 [`docs/question-catalog.md`](../question-catalog.md)가 기준입니다.

문제를 만들기 전에 아래 순서로 확인하세요.

1. `npm run questions:catalog`
2. `docs/question-catalog.md`에서 같은 카테고리의 유사 signature를 먼저 확인
3. 배치 작업 중이면 `npm run questions:batch-report -- --base <ref>`로 변경분 기준 중복 warning까지 확인

### Exact duplicate fail 기준

- **Preflop**: `position + hand + actionBefore + correct`
- **Postflop**: `holeCards + board + actionBefore + correct`
- **Odds / 카드형**: `holeCards + board + mathFocus + correct`
- **Odds / 수학형**: `pot + villainBet + mathFocus + correct`

위 signature가 완전히 같으면 `questions:validate`에서 fail입니다.

### Near duplicate warning 기준

- 같은 카테고리에서 핵심 signature의 **필드 1개만 다른 경우**
- 자동 fail은 아니지만 batch report warning으로 남습니다
- 대량 생성 시에는 warning도 리뷰 대상으로 간주하세요

---

## 7. 카드 표기법

- **suit**: `h`(하트), `d`(다이아), `c`(클럽), `s`(스페이드)
- **rank**: `A`, `K`, `Q`, `J`, `T`, `9`~`2`
- 예: `"Ah"` = 하트 에이스, `"Ts"` = 스페이드 10
- **핸드 표기(preflop)**: `"AJo"` (오프수트), `"76s"` (수딧), `"TT"` (페어)

---

## 8. 검증 (필수)

문제를 `questionBank`에 반영하기 전에 아래 명령을 기준으로 검증하세요.

```bash
npm run questions:validate
npm run verify:content -- --base <ref>
npm run qa:questions -- --base <ref>
```

`verify:content`는 `lint`, `tsc --noEmit`, question validator, Vitest, catalog 생성, batch report 생성을 한 번에 수행합니다.

### 8-A. 공통 hard fail

- ID는 카테고리별 `NNN` 순번이 연속이고 gap이 없어야 함
- `questionBank`는 `preflop -> postflop -> odds` 순서 유지
- 모든 문자열 필드는 trim 되어 있고 비어 있지 않아야 함
- `tags`는 정확히 2개이고 registry에 등록되어 있어야 함
- `pitfall`은 `"~하는 실수"` 패턴 유지
- `title <= 32자`
- `prompt <= 100자`
- `prompt`는 2문장 이하
- `prompt`는 금지 표현을 포함하면 안 됨
  - `"좋은 자리입니다"`
  - `"명확한 밸류 오픈입니다"`
  - `"폴드가 편함"`
  - `"계속 갈 수 있다"`
  - `"공격적으로 열 수 있습니다"`
  - `"과감히 접어야 한다"`
  - `"~이 우선입니다"`
- `actionBefore <= 60자`
- `mathFocus <= 24자`
- whole bank 난이도 분포는 `기초 30-50% / 실전 30-50% / 응용 10-30%`
- exact duplicate signature는 fail

### 8-B. Preflop 추가 검증

- `hand`는 `holeCards`와 정확히 일치해야 함
- `correct`는 `fold | call | raise` 중 하나

### 8-C. Postflop 추가 검증

postflop 문제는 `reviewSpec`이 필수입니다.

- `reviewSpec.street`는 보드 장수와 일치해야 함
- `reviewSpec.madeHand`, `draws`, `boardTexture`, `suitTexture`는 실제 카드 정보에서 계산한 값과 일치해야 함
- `title`, `prompt`, `explanation`에 아래 키워드가 들어가면 `reviewSpec`과 모순되면 fail
  - `탑페어`, `미들페어`, `바텀페어`, `오버페어`, `투페어`, `셋`, `트립스`
  - `플러시 드로우`, `넛 플러시 드로우`, `오픈엔디드`, `거트샷`, `콤보 드로우`
  - `젖은 보드`, `드라이 보드`, `레인보우`, `투톤`
- 카드 중복, 잘못된 카드 코드, 잘못된 board 길이는 즉시 fail

### 8-D. Odds 추가 검증

- `options`는 정확히 3개
- `correct`는 `options[].value` 중 하나
- `options[].label`은 `/^(약 )?\\d+%$/` 형식
- 카드 기반 문제는 `outsSpec`으로 실제 아웃 수와 확률을 자동 검산
- pot odds 문제에서 `pot`은 항상 **상대 베팅이 이미 포함된 현재 팟**

포트 오즈 계산식:

```text
필요 승률 = 콜 금액 / (현재 팟 + 콜 금액)
```

예:

```ts
pot: "60bb"       // 기존 팟 30bb + 상대 베팅 30bb
villainBet: "30bb"
mathFocus: "상대가 풀팟 베팅"
correct: "33"
```

검산:

```text
30 / (60 + 30) = 33.3%
```

### 8-E. Warnings

- near duplicate는 fail이 아니라 warning
- batch report에서 warning/error가 걸린 문제는 전수 검수 대상

---

## 9. 사용법

문제 추가를 요청할 때:

```
"preflop 문제 5개 추가해줘"
"포스트플랍 응용 난이도로 3개 만들어줘"
"odds 문제 중 임플라이드 오즈 관련으로 2개"
"커버되지 않은 스팟 위주로 각 카테고리 3개씩"
```

결과물은 해당 카테고리 파일(`lib/training-data/questions/preflop.ts`, `postflop.ts`, `odds.ts`)의 배열 끝에 추가합니다.
추가 후 아래 순서로 처리하세요:

1. `npm run questions:catalog`
2. `npm run verify:content -- --base <ref>`
3. `npm run qa:questions -- --base <ref>`
4. `.qa-artifacts/questions/batch-report.md`에서 `Required Sample Review` 목록 확인
5. [docs/skills/question-expression-review.md](question-expression-review.md) 기준으로 문구 최종 검수

배치 리포트 산출물:

- `.qa-artifacts/questions/batch-report.json`
- `.qa-artifacts/questions/batch-report.md`
- `.qa-artifacts/questions/qa-report.json`
- 변경 문제별 `quiz` / `feedback` 모바일 스크린샷 PNG

샘플 검수 규칙:

- 변경 문제가 12개 이하이면 전수 검수
- 13개 이상이면 warning/error 문제 전수 검수 + 카테고리별 clean question 15% 추가 검수
- 카테고리별 샘플 수는 최소 1개, 최대 5개

운영 절차 전체는 [`docs/question-pipeline.md`](../question-pipeline.md)를 기준으로 따르세요.

카드 기반 `odds` 문제를 만들 때는 아래 중 필요한 컴포넌트를 조합하세요:

- `straightDraw`
- `flushDraw`
- `overcardPair`
- `holePairImprove`
- `currentPairTrips`
- `pocketPairSet`
