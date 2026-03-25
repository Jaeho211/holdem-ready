<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Skills

- **문제 생성 (Question Generator)**: `questionBank`에 문제를 추가하거나 수정할 때는 반드시 [docs/skills/question-generator.md](docs/skills/question-generator.md)를 먼저 읽고 규칙을 따르세요. 특히 `5-A. UI 렌더링 계약` 섹션을 확인해 각 필드가 언제, 어떻게 보이는지 기준으로 작성하세요.
- **표현 검수 (Question Expression Review)**: `questionBank` 문구를 새로 쓰거나 다듬을 때는 [docs/skills/question-expression-review.md](docs/skills/question-expression-review.md)를 함께 확인하세요. 생성 규칙과 필드 계약은 `question-generator`, 한국어 표현 검수와 리라이트는 이 문서가 담당합니다.
