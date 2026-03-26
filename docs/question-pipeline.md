# Question Pipeline

대규모 Codex 문제 작성은 아래 흐름을 기준으로 운영합니다.

## 원칙

- 소스 오브 트루스는 `lib/training-data/questions/*.ts`
- 중복 방지 기준은 수동 표가 아니라 generated catalog
- 사람 검수는 전수 검수가 아니라 batch sample review
- 나머지는 validator, Vitest, UI QA, CI가 자동 게이트

## 기본 절차

1. Codex가 문제를 추가하거나 수정합니다.
2. postflop이면 `reviewSpec`을 함께 작성합니다.
3. 태그는 [`question-tags.ts`](../lib/training-data/question-tags.ts) registry 안에서만 고릅니다.
4. `odds.pot`은 항상 상대 베팅이 포함된 현재 팟으로 작성합니다.
5. `npm run questions:catalog`로 [`question-catalog.md`](question-catalog.md)를 갱신합니다.
6. `npm run verify:content -- --base <ref>`를 실행합니다.
7. `npm run qa:questions -- --base <ref>`를 실행합니다.
8. `.qa-artifacts/questions/batch-report.md`의 `Required Sample Review` 목록을 사람이 검수합니다.
9. CI green 확인 후 merge합니다.

## 표준 명령

catalog 갱신:

```bash
npm run questions:catalog
```

전체 콘텐츠 검증:

```bash
npm run verify:content -- --base origin/main
```

변경 문제 batch report:

```bash
npm run questions:batch-report -- --base origin/main
```

변경 문제 모바일 QA:

```bash
npm run qa:ui:install
npm run qa:questions -- --base origin/main
```

## 자동 게이트

### 로컬

- `pre-push`는 관련 파일이 바뀐 경우에만 `verify:content`를 실행합니다.
- `docs/question-catalog.md`가 최신이 아니면 push를 막습니다.

### CI

- GitHub Actions `content-quality`가 relevant path 기반으로만 실행됩니다.
- PR에서는 base SHA를 기준으로 `verify:content`와 `qa:questions`를 실행합니다.
- generated catalog drift가 있으면 fail입니다.

## 검수 규칙

### Sample review

- 변경 문제가 12개 이하이면 전수 검수
- 13개 이상이면 warning/error 문제 전수 검수
- 여기에 카테고리별 clean question 15%를 추가 검수
- 카테고리별 샘플 수는 최소 1개, 최대 5개
- 샘플 선택은 deterministic ordering

### 꼭 보는 항목

- near duplicate warning이 실제로 다른 학습 포인트를 가지는지
- 새 태그가 registry 확장 없이 들어오지 않았는지
- postflop 키워드와 `reviewSpec`이 실제로 맞는지
- odds 문제의 `pot` 설명과 숫자가 현재 규약과 맞는지
- 모바일 `quiz` / `feedback` 화면에서 텍스트가 깨지지 않는지

## 산출물

자동 생성 또는 갱신되는 주요 파일:

- [`question-catalog.md`](question-catalog.md)
- `.qa-artifacts/questions/batch-report.json`
- `.qa-artifacts/questions/batch-report.md`
- `.qa-artifacts/questions/qa-report.json`
- `.qa-artifacts/questions/*.png`

## 참고 문서

- [`question-generator.md`](skills/question-generator.md)
- [`question-expression-review.md`](skills/question-expression-review.md)
- [`testing.md`](testing.md)
