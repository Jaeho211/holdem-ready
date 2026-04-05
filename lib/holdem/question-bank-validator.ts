import {
  calculateOutsFromSpec,
  getOutsHitRatePercent,
  parseOutsCount,
} from "./outs";
import { getHandNotation, isCardCode } from "./cards";
import { derivePostflopReviewSpec } from "./postflop-review";
import {
  ALL_QUESTION_TAG_SET,
  QUESTION_TAG_SET_BY_CATEGORY,
  type HoldemQuestion,
  type OddsQuestion,
  type PostflopQuestion,
  type PreflopQuestion,
  type TrainingCategory,
} from "../training-data";

type ValidationSeverity = "error" | "warning";

export type QuestionValidationIssue = {
  severity: ValidationSeverity;
  code: string;
  message: string;
  questionId?: string;
  field?: string;
  relatedQuestionIds?: string[];
};

export type QuestionDuplicateGroup = {
  category: TrainingCategory;
  questionIds: string[];
  signature: string;
  differingFields?: string[];
};

export type QuestionBankStats = {
  total: number;
  byCategory: Record<TrainingCategory, number>;
  byDifficulty: Record<"기초" | "실전" | "응용", number>;
  difficultyPercent: Record<"기초" | "실전" | "응용", number>;
};

export type QuestionBankValidationResult = {
  errors: QuestionValidationIssue[];
  warnings: QuestionValidationIssue[];
  stats: QuestionBankStats;
  exactDuplicateGroups: QuestionDuplicateGroup[];
  nearDuplicateGroups: QuestionDuplicateGroup[];
  questionIssues: Record<string, QuestionValidationIssue[]>;
};

export type QuestionBankAssemblyInput = {
  questionBank: HoldemQuestion[];
  preflopQuestions?: readonly PreflopQuestion[];
  postflopQuestions?: readonly PostflopQuestion[];
  oddsQuestions?: readonly OddsQuestion[];
};

export const PROMPT_BANNED_PHRASES = [
  "좋은 자리입니다",
  "명확한 밸류 오픈입니다",
  "폴드가 편함",
  "계속 갈 수 있다",
  "공격적으로 열 수 있습니다",
  "과감히 접어야 한다",
  "이 우선입니다",
] as const;

export const QUESTION_TEXT_LIMITS = {
  title: 32,
  prompt: 100,
  actionBefore: 60,
  mathFocus: 24,
} as const;

type SignaturePart = {
  field: string;
  value: string;
};

const CATEGORY_PREFIX: Record<TrainingCategory, string> = {
  preflop: "pre-",
  postflop: "post-",
  odds: "odds-",
};

const CATEGORY_KEYS = ["preflop", "postflop", "odds"] as const;
const ODDS_LABEL_PATTERN = /^(약 )?\d+%$/;

const EXACT_SIGNATURE_LABEL = {
  preflop: "position + hand + actionBefore + correct",
  postflop: "holeCards + board + actionBefore + correct",
  odds: "pot/mathFocus signature",
} as const;

const postflopKeywordMatchers = [
  { phrase: "탑페어", field: "madeHand", matches: ["topPair"] },
  { phrase: "미들페어", field: "madeHand", matches: ["middlePair"] },
  { phrase: "바텀페어", field: "madeHand", matches: ["bottomPair"] },
  { phrase: "오버페어", field: "madeHand", matches: ["overpair"] },
  { phrase: "투페어", field: "madeHand", matches: ["twoPair"] },
  { phrase: "셋", field: "madeHand", matches: ["set"] },
  { phrase: "트립스", field: "madeHand", matches: ["trips"] },
  { phrase: "풀하우스", field: "madeHand", matches: ["fullHouse"] },
  { phrase: "스트레이트를 완성", field: "madeHand", matches: ["straight"] },
  { phrase: "완성 스트레이트", field: "madeHand", matches: ["straight"] },
  { phrase: "스트레이트 밸류", field: "madeHand", matches: ["straight"] },
  { phrase: "넛 플러시 드로우", field: "draws", matches: ["nutFlushDraw"] },
  { phrase: "플러시 드로우", field: "draws", matches: ["flushDraw", "nutFlushDraw"] },
  { phrase: "오픈엔디드", field: "draws", matches: ["oesd"] },
  { phrase: "거트샷", field: "draws", matches: ["gutshot"] },
  { phrase: "콤보 드로우", field: "draws", matches: ["comboDraw"] },
  { phrase: "젖은 보드", field: "boardTexture", matches: ["wet"] },
  { phrase: "드라이 보드", field: "boardTexture", matches: ["dry"] },
  { phrase: "레인보우", field: "suitTexture", matches: ["rainbow"] },
  { phrase: "투톤", field: "suitTexture", matches: ["twoTone"] },
] as const;

const roundPercent = (value: number) => Math.round(value * 100) / 100;

const createStats = (questionBank: HoldemQuestion[]): QuestionBankStats => {
  const byCategory = {
    preflop: 0,
    postflop: 0,
    odds: 0,
  };
  const byDifficulty = {
    기초: 0,
    실전: 0,
    응용: 0,
  };

  for (const question of questionBank) {
    byCategory[question.category] += 1;
    byDifficulty[question.difficulty] += 1;
  }

  return {
    total: questionBank.length,
    byCategory,
    byDifficulty,
    difficultyPercent: {
      기초: questionBank.length ? roundPercent((byDifficulty.기초 / questionBank.length) * 100) : 0,
      실전: questionBank.length ? roundPercent((byDifficulty.실전 / questionBank.length) * 100) : 0,
      응용: questionBank.length ? roundPercent((byDifficulty.응용 / questionBank.length) * 100) : 0,
    },
  };
};

const pushIssue = (
  issues: QuestionValidationIssue[],
  severity: ValidationSeverity,
  code: string,
  message: string,
  options: Omit<QuestionValidationIssue, "severity" | "code" | "message"> = {},
) => {
  issues.push({
    severity,
    code,
    message,
    ...options,
  });
};

const isTrimmedText = (value: string) => value.trim() === value && value.length > 0;

const countSentences = (text: string) => {
  const normalized = text.trim();
  if (!normalized) {
    return 0;
  }

  const matches = normalized.match(/[^.!?]+[.!?]?/g) ?? [];
  return matches.filter((part) => part.trim().length > 0).length;
};

const parseBb = (value: string) => Number.parseFloat(value.replace(/bb$/i, ""));

const getSignatureParts = (question: HoldemQuestion): SignaturePart[] => {
  if (question.category === "preflop") {
    return [
      { field: "position", value: question.position },
      { field: "hand", value: question.hand },
      { field: "actionBefore", value: question.actionBefore },
      { field: "correct", value: question.correct },
    ];
  }

  if (question.category === "postflop") {
    return [
      { field: "holeCards", value: question.holeCards.join("/") },
      { field: "board", value: question.board.join("/") },
      { field: "actionBefore", value: question.actionBefore },
      { field: "correct", value: question.correct },
    ];
  }

  const cardBased = Boolean(question.holeCards && question.board);
  return cardBased
    ? [
        { field: "holeCards", value: question.holeCards!.join("/") },
        { field: "board", value: question.board!.join("/") },
        { field: "mathFocus", value: question.mathFocus },
        { field: "correct", value: String(question.correct) },
      ]
    : [
        { field: "pot", value: question.pot },
        { field: "villainBet", value: question.villainBet },
        { field: "mathFocus", value: question.mathFocus },
        { field: "correct", value: String(question.correct) },
      ];
};

export const getQuestionSignature = (question: HoldemQuestion) =>
  getSignatureParts(question)
    .map((part) => `${part.field}=${part.value}`)
    .join(" | ");

const getQuestionSignatureSummary = (question: HoldemQuestion) =>
  getSignatureParts(question)
    .map((part) => part.value)
    .join(" / ");

export const getQuestionCatalogSignature = getQuestionSignatureSummary;

const getQuestionFieldsForTrimCheck = (question: HoldemQuestion) => {
  const shared = [
    { field: "id", value: question.id },
    { field: "title", value: question.title },
    { field: "prompt", value: question.prompt },
    { field: "explanation", value: question.explanation },
    { field: "pitfall", value: question.pitfall },
  ];

  if (question.category === "preflop") {
    return [
      ...shared,
      { field: "hand", value: question.hand },
      { field: "position", value: question.position },
      { field: "table", value: question.table },
      { field: "stack", value: question.stack },
      { field: "actionBefore", value: question.actionBefore },
    ];
  }

  if (question.category === "postflop") {
    return [
      ...shared,
      { field: "position", value: question.position },
      { field: "preflopAction", value: question.preflopAction },
      { field: "pot", value: question.pot },
      { field: "villainBet", value: question.villainBet },
      { field: "actionBefore", value: question.actionBefore },
      { field: "stack", value: question.stack },
    ];
  }

  return [
    ...shared,
    { field: "pot", value: question.pot },
    { field: "villainBet", value: question.villainBet },
    { field: "actionBefore", value: question.actionBefore },
    { field: "mathFocus", value: question.mathFocus },
  ];
};

const getCategoryQuestions = (
  questionBank: HoldemQuestion[],
  category: TrainingCategory,
) => questionBank.filter((question) => question.category === category);

const checkQuestionTextRules = (
  question: HoldemQuestion,
  issues: QuestionValidationIssue[],
) => {
  for (const entry of getQuestionFieldsForTrimCheck(question)) {
    if (!isTrimmedText(entry.value)) {
      pushIssue(
        issues,
        "error",
        "trimmed-text",
        `${entry.field} must be trimmed and non-empty.`,
        { questionId: question.id, field: entry.field },
      );
    }
  }

  for (const tag of question.tags) {
    if (!isTrimmedText(tag)) {
      pushIssue(
        issues,
        "error",
        "trimmed-tag",
        "tags must be trimmed and non-empty.",
        { questionId: question.id, field: "tags" },
      );
    }
  }

  if (question.title.length > QUESTION_TEXT_LIMITS.title) {
    pushIssue(
      issues,
      "error",
      "title-too-long",
      `title must be ${QUESTION_TEXT_LIMITS.title} characters or fewer.`,
      { questionId: question.id, field: "title" },
    );
  }

  if (question.prompt.length > QUESTION_TEXT_LIMITS.prompt) {
    pushIssue(
      issues,
      "error",
      "prompt-too-long",
      `prompt must be ${QUESTION_TEXT_LIMITS.prompt} characters or fewer.`,
      { questionId: question.id, field: "prompt" },
    );
  }

  if (countSentences(question.prompt) > 2) {
    pushIssue(
      issues,
      "error",
      "prompt-too-many-sentences",
      "prompt must use at most 2 sentences.",
      { questionId: question.id, field: "prompt" },
    );
  }

  for (const phrase of PROMPT_BANNED_PHRASES) {
    if (question.prompt.includes(phrase)) {
      pushIssue(
        issues,
        "error",
        "prompt-banned-phrase",
        `prompt contains banned phrase: "${phrase}".`,
        { questionId: question.id, field: "prompt" },
      );
    }
  }

  if ("actionBefore" in question && question.actionBefore.length > QUESTION_TEXT_LIMITS.actionBefore) {
    pushIssue(
      issues,
      "error",
      "action-before-too-long",
      `actionBefore must be ${QUESTION_TEXT_LIMITS.actionBefore} characters or fewer.`,
      { questionId: question.id, field: "actionBefore" },
    );
  }

  if (question.category === "odds" && question.mathFocus.length > QUESTION_TEXT_LIMITS.mathFocus) {
    pushIssue(
      issues,
      "error",
      "math-focus-too-long",
      `mathFocus must be ${QUESTION_TEXT_LIMITS.mathFocus} characters or fewer.`,
      { questionId: question.id, field: "mathFocus" },
    );
  }
};

const checkQuestionStructureRules = (
  questionBank: HoldemQuestion[],
  issues: QuestionValidationIssue[],
) => {
  const ids = questionBank.map((question) => question.id);
  if (ids.length !== new Set(ids).size) {
    pushIssue(issues, "error", "duplicate-id", "question IDs must be unique.");
  }

  for (const category of CATEGORY_KEYS) {
    const prefix = CATEGORY_PREFIX[category];
    const categoryQuestions = getCategoryQuestions(questionBank, category);
    const parsedIds = categoryQuestions.map((question) => Number.parseInt(question.id.slice(prefix.length), 10));

    categoryQuestions.forEach((question) => {
      if (!new RegExp(`^${prefix}\\d{3}$`).test(question.id)) {
        pushIssue(
          issues,
          "error",
          "invalid-id-format",
          `ID must match ${prefix}NNN.`,
          { questionId: question.id, field: "id" },
        );
      }
    });

    parsedIds.forEach((value, index) => {
      if (value !== index + 1) {
        pushIssue(
          issues,
          "error",
          "id-sequence-gap",
          `${category} IDs must be sequential and gap-free.`,
          { questionId: categoryQuestions[index]?.id, field: "id" },
        );
      }
    });
  }

  const categoryOrder = questionBank.map((question) => question.category).join(",");
  const expectedOrder = [
    ...Array(getCategoryQuestions(questionBank, "preflop").length).fill("preflop"),
    ...Array(getCategoryQuestions(questionBank, "postflop").length).fill("postflop"),
    ...Array(getCategoryQuestions(questionBank, "odds").length).fill("odds"),
  ].join(",");

  if (categoryOrder !== expectedOrder) {
    pushIssue(
      issues,
      "error",
      "category-order",
      "questionBank must keep categories in preflop -> postflop -> odds order.",
    );
  }
};

const checkQuestionDataRules = (
  question: HoldemQuestion,
  issues: QuestionValidationIssue[],
) => {
  if (!question.pitfall.endsWith("실수")) {
    pushIssue(
      issues,
      "error",
      "pitfall-format",
      'pitfall must end with "실수".',
      { questionId: question.id, field: "pitfall" },
    );
  }

  if (question.tags.length !== 2) {
    pushIssue(
      issues,
      "error",
      "tag-count",
      "questions must have exactly 2 tags.",
      { questionId: question.id, field: "tags" },
    );
  }

  const categoryTagSet = QUESTION_TAG_SET_BY_CATEGORY[question.category];
  for (const tag of question.tags) {
    if (!ALL_QUESTION_TAG_SET.has(tag) || !categoryTagSet.has(tag)) {
      pushIssue(
        issues,
        "error",
        "unregistered-tag",
        `tag "${tag}" is not registered for ${question.category}.`,
        { questionId: question.id, field: "tags" },
      );
    }
  }

  if ("holeCards" in question && question.holeCards) {
    for (const card of question.holeCards) {
      if (!isCardCode(card)) {
        pushIssue(
          issues,
          "error",
          "invalid-card-code",
          `invalid card code: ${card}.`,
          { questionId: question.id, field: "holeCards" },
        );
      }
    }
  }

  if (question.category === "preflop") {
    if (getHandNotation(question.holeCards) !== question.hand) {
      pushIssue(
        issues,
        "error",
        "preflop-hand-mismatch",
        `hand must match holeCards (${getHandNotation(question.holeCards)}).`,
        { questionId: question.id, field: "hand" },
      );
    }

    if (!["fold", "call", "raise"].includes(question.correct)) {
      pushIssue(
        issues,
        "error",
        "invalid-correct-choice",
        'preflop correct must be one of "fold", "call", "raise".',
        { questionId: question.id, field: "correct" },
      );
    }

    return;
  }

  if (question.category === "postflop") {
    if (!["fold", "call", "raise"].includes(question.correct)) {
      pushIssue(
        issues,
        "error",
        "invalid-correct-choice",
        'postflop correct must be one of "fold", "call", "raise".',
        { questionId: question.id, field: "correct" },
      );
    }

    if (question.board.length < 3 || question.board.length > 5) {
      pushIssue(
        issues,
        "error",
        "invalid-board-length",
        "postflop board must have 3 to 5 cards.",
        { questionId: question.id, field: "board" },
      );
    }

    const allCards = [...question.holeCards, ...question.board];
    if (allCards.length !== new Set(allCards).size) {
      pushIssue(
        issues,
        "error",
        "duplicate-card",
        "holeCards and board must not contain duplicate cards.",
        { questionId: question.id, field: "board" },
      );
    }

    for (const card of allCards) {
      if (!isCardCode(card)) {
        pushIssue(
          issues,
          "error",
          "invalid-card-code",
          `invalid card code: ${card}.`,
          { questionId: question.id, field: "board" },
        );
      }
    }

    const actualSpec = derivePostflopReviewSpec(question.holeCards, question.board);
    const expectedDraws = new Set(question.reviewSpec.draws ?? []);
    const actualDraws = new Set(actualSpec.draws ?? []);

    if (question.reviewSpec.street !== actualSpec.street) {
      pushIssue(
        issues,
        "error",
        "postflop-review-street",
        `reviewSpec.street must match board street (${actualSpec.street}).`,
        { questionId: question.id, field: "reviewSpec.street" },
      );
    }

    if (question.reviewSpec.madeHand && question.reviewSpec.madeHand !== actualSpec.madeHand) {
      pushIssue(
        issues,
        "error",
        "postflop-review-made-hand",
        `reviewSpec.madeHand must match actual hand (${actualSpec.madeHand ?? "none"}).`,
        { questionId: question.id, field: "reviewSpec.madeHand" },
      );
    }

    if (question.reviewSpec.boardTexture && question.reviewSpec.boardTexture !== actualSpec.boardTexture) {
      pushIssue(
        issues,
        "error",
        "postflop-review-board-texture",
        `reviewSpec.boardTexture must match actual board texture (${actualSpec.boardTexture}).`,
        { questionId: question.id, field: "reviewSpec.boardTexture" },
      );
    }

    if (question.reviewSpec.suitTexture && question.reviewSpec.suitTexture !== actualSpec.suitTexture) {
      pushIssue(
        issues,
        "error",
        "postflop-review-suit-texture",
        `reviewSpec.suitTexture must match actual suit texture (${actualSpec.suitTexture}).`,
        { questionId: question.id, field: "reviewSpec.suitTexture" },
      );
    }

    const drawsEqual =
      expectedDraws.size === actualDraws.size &&
      [...expectedDraws].every((draw) => actualDraws.has(draw));

    if (!drawsEqual) {
      pushIssue(
        issues,
        "error",
        "postflop-review-draws",
        `reviewSpec.draws must match actual draws (${[...actualDraws].join(", ") || "none"}).`,
        { questionId: question.id, field: "reviewSpec.draws" },
      );
    }

    const text = `${question.title} ${question.prompt} ${question.explanation}`;
    for (const matcher of postflopKeywordMatchers) {
        if (!text.includes(matcher.phrase)) {
          continue;
        }

        if (matcher.field === "madeHand") {
        if (!(matcher.matches as readonly string[]).includes(question.reviewSpec.madeHand ?? "")) {
          pushIssue(
            issues,
            "error",
            "postflop-keyword-made-hand",
            `"${matcher.phrase}" must align with reviewSpec.madeHand.`,
            { questionId: question.id, field: "reviewSpec.madeHand" },
          );
        }
        continue;
      }

      if (matcher.field === "draws") {
        const draws = question.reviewSpec.draws ?? [];
        if (!matcher.matches.some((value) => draws.includes(value as typeof draws[number]))) {
          pushIssue(
            issues,
            "error",
            "postflop-keyword-draw",
            `"${matcher.phrase}" must align with reviewSpec.draws.`,
            { questionId: question.id, field: "reviewSpec.draws" },
          );
        }
        continue;
      }

      if (matcher.field === "boardTexture") {
        if (!(matcher.matches as readonly string[]).includes(question.reviewSpec.boardTexture ?? "")) {
          pushIssue(
            issues,
            "error",
            "postflop-keyword-board-texture",
            `"${matcher.phrase}" must align with reviewSpec.boardTexture.`,
            { questionId: question.id, field: "reviewSpec.boardTexture" },
          );
        }
        continue;
      }

      if (!(matcher.matches as readonly string[]).includes(question.reviewSpec.suitTexture ?? "")) {
        pushIssue(
          issues,
          "error",
          "postflop-keyword-suit-texture",
          `"${matcher.phrase}" must align with reviewSpec.suitTexture.`,
          { questionId: question.id, field: "reviewSpec.suitTexture" },
        );
      }
    }

    return;
  }

  const optionValues = question.options.map((option) => option.value);
  if (!optionValues.includes(question.correct)) {
    pushIssue(
      issues,
      "error",
      "invalid-correct-choice",
      "odds correct must exist in options.",
      { questionId: question.id, field: "correct" },
    );
  }

  if (question.options.length !== 3) {
    pushIssue(
      issues,
      "error",
      "invalid-option-count",
      "odds questions must define exactly 3 options.",
      { questionId: question.id, field: "options" },
    );
  }

  question.options.forEach((option, index) => {
    if (!isTrimmedText(option.value)) {
      pushIssue(
        issues,
        "error",
        "trimmed-option-value",
        "option values must be trimmed and non-empty.",
        { questionId: question.id, field: `options[${index}].value` },
      );
    }

    if (!isTrimmedText(option.label)) {
      pushIssue(
        issues,
        "error",
        "trimmed-option-label",
        "option labels must be trimmed and non-empty.",
        { questionId: question.id, field: `options[${index}].label` },
      );
    }

    if (!ODDS_LABEL_PATTERN.test(option.label)) {
      pushIssue(
        issues,
        "error",
        "invalid-odds-label",
        'odds option labels must match /^(약 )?\\d+%$/.',
        { questionId: question.id, field: `options[${index}].label` },
      );
    }
  });

  const allCards = [...(question.holeCards ?? []), ...(question.board ?? [])];
  if (allCards.length !== new Set(allCards).size) {
    pushIssue(
      issues,
      "error",
      "duplicate-card",
      "odds holeCards and board must not contain duplicate cards.",
      { questionId: question.id, field: "board" },
    );
  }

  for (const card of allCards) {
    if (!isCardCode(card)) {
      pushIssue(
        issues,
        "error",
        "invalid-card-code",
        `invalid card code: ${card}.`,
        { questionId: question.id, field: "board" },
      );
    }
  }

  const expectedOuts = parseOutsCount(question.mathFocus);
  if (question.holeCards && question.board && expectedOuts !== null) {
    if (!question.outsSpec || question.outsSpec.components.length === 0) {
      pushIssue(
        issues,
        "error",
        "missing-outs-spec",
        "card-based odds questions must include outsSpec.",
        { questionId: question.id, field: "outsSpec" },
      );
    } else {
      const calculated = calculateOutsFromSpec(question.holeCards, question.board, question.outsSpec);
      if (calculated.outs.length !== expectedOuts) {
        pushIssue(
          issues,
          "error",
          "outs-count-mismatch",
          `mathFocus outs (${expectedOuts}) must match calculated outs (${calculated.outs.length}).`,
          { questionId: question.id, field: "mathFocus" },
        );
      }

      const expectedPercent = getOutsHitRatePercent(calculated.outs.length, question.board);
      const shownPercent = Number(question.correct);
      if (Number.isNaN(shownPercent) || Math.abs(expectedPercent - shownPercent) > 1) {
        pushIssue(
          issues,
          "error",
          "outs-percent-mismatch",
          `correct must be within 1%p of calculated outs probability (${Math.round(expectedPercent)}%).`,
          { questionId: question.id, field: "correct" },
        );
      }
    }
  }

  const pot = parseBb(question.pot);
  const bet = parseBb(question.villainBet);
  const correctNum = Number(question.correct);
  const isPotOddsQuestion = !question.mathFocus.toLowerCase().includes("outs");

  if (!Number.isNaN(pot) && !Number.isNaN(bet) && bet > 0 && isPotOddsQuestion) {
    const expectedRequired = Math.round((bet / (pot + bet)) * 100);
    if (expectedRequired !== correctNum) {
      pushIssue(
        issues,
        "error",
        "pot-odds-mismatch",
        `pot must mean current pot including villain bet. Expected ${expectedRequired}% required equity.`,
        { questionId: question.id, field: "pot" },
      );
    }

    const beforeMatch = question.actionBefore.match(/기존 팟\s+(\d+(?:\.\d+)?)bb/);
    const currentMatch = question.actionBefore.match(/현재 팟(?:이)?\s+(\d+(?:\.\d+)?)bb/);

    if (beforeMatch) {
      const existingPot = Number.parseFloat(beforeMatch[1]);
      if (Math.abs(existingPot + bet - pot) > 0.01) {
        pushIssue(
          issues,
          "error",
          "pot-actionbefore-mismatch",
          "actionBefore existing-pot copy must align with pot + villainBet convention.",
          { questionId: question.id, field: "actionBefore" },
        );
      }
    }

    if (currentMatch) {
      const currentPot = Number.parseFloat(currentMatch[1]);
      if (Math.abs(currentPot - pot) > 0.01) {
        pushIssue(
          issues,
          "error",
          "pot-current-copy-mismatch",
          "actionBefore current pot copy must align with pot.",
          { questionId: question.id, field: "actionBefore" },
        );
      }
    }
  }
};

const analyzeDuplicateGroups = (questionBank: HoldemQuestion[]) => {
  const exactDuplicateGroups: QuestionDuplicateGroup[] = [];
  const nearDuplicateGroups: QuestionDuplicateGroup[] = [];
  const exactGroups = new Map<string, HoldemQuestion[]>();

  for (const question of questionBank) {
    const signature = `${question.category}:${getQuestionSignature(question)}`;
    const group = exactGroups.get(signature) ?? [];
    group.push(question);
    exactGroups.set(signature, group);
  }

  for (const [signature, group] of exactGroups) {
    if (group.length > 1) {
      exactDuplicateGroups.push({
        category: group[0].category,
        questionIds: group.map((question) => question.id),
        signature,
      });
    }
  }

  for (const category of CATEGORY_KEYS) {
    const questions = getCategoryQuestions(questionBank, category);
    for (let index = 0; index < questions.length; index += 1) {
      for (let cursor = index + 1; cursor < questions.length; cursor += 1) {
        const left = questions[index];
        const right = questions[cursor];
        const leftParts = getSignatureParts(left);
        const rightParts = getSignatureParts(right);
        const differingFields = leftParts
          .filter((part, partIndex) => part.value !== rightParts[partIndex]?.value)
          .map((part) => part.field);

        if (category === "preflop" && differingFields.length === 1 && differingFields[0] === "hand") {
          continue;
        }

        if (differingFields.length === 1) {
          nearDuplicateGroups.push({
            category,
            questionIds: [left.id, right.id],
            signature: `${left.id} ~ ${right.id}`,
            differingFields,
          });
        }
      }
    }
  }

  return { exactDuplicateGroups, nearDuplicateGroups };
};

export const validateQuestionBank = (
  input: QuestionBankAssemblyInput,
): QuestionBankValidationResult => {
  const issues: QuestionValidationIssue[] = [];
  const stats = createStats(input.questionBank);
  const { exactDuplicateGroups, nearDuplicateGroups } = analyzeDuplicateGroups(input.questionBank);

  checkQuestionStructureRules(input.questionBank, issues);

  if (
    input.preflopQuestions &&
    input.postflopQuestions &&
    input.oddsQuestions
  ) {
    const expectedIds = [
      ...input.preflopQuestions,
      ...input.postflopQuestions,
      ...input.oddsQuestions,
    ].map((question) => question.id);
    const actualIds = input.questionBank.map((question) => question.id);

    if (expectedIds.join(",") !== actualIds.join(",")) {
      pushIssue(
        issues,
        "error",
        "question-bank-assembly",
        "questionBank must be assembled from category modules in order.",
      );
    }
  }

  if (
    stats.difficultyPercent.기초 < 30 ||
    stats.difficultyPercent.기초 > 50 ||
    stats.difficultyPercent.실전 < 30 ||
    stats.difficultyPercent.실전 > 50 ||
    stats.difficultyPercent.응용 < 10 ||
    stats.difficultyPercent.응용 > 30
  ) {
    pushIssue(
      issues,
      "error",
      "difficulty-distribution",
      "whole-bank difficulty distribution must stay within 기초 30-50%, 실전 30-50%, 응용 10-30%.",
    );
  }

  for (const question of input.questionBank) {
    checkQuestionTextRules(question, issues);
    checkQuestionDataRules(question, issues);
  }

  for (const group of exactDuplicateGroups) {
    pushIssue(
      issues,
      "error",
      "exact-duplicate",
      `exact duplicate signature detected for ${EXACT_SIGNATURE_LABEL[group.category]}.`,
      {
        questionId: group.questionIds[0],
        relatedQuestionIds: group.questionIds,
      },
    );
  }

  for (const group of nearDuplicateGroups) {
    pushIssue(
      issues,
      "warning",
      "near-duplicate",
      `near duplicate signature detected; only ${group.differingFields?.join(", ")} differs.`,
      {
        questionId: group.questionIds[0],
        relatedQuestionIds: group.questionIds,
      },
    );
  }

  const errors = issues.filter((issue) => issue.severity === "error");
  const warnings = issues.filter((issue) => issue.severity === "warning");
  const questionIssues: Record<string, QuestionValidationIssue[]> = {};

  for (const issue of issues) {
    if (!issue.questionId) {
      continue;
    }
    questionIssues[issue.questionId] ??= [];
    questionIssues[issue.questionId].push(issue);
  }

  return {
    errors,
    warnings,
    stats,
    exactDuplicateGroups,
    nearDuplicateGroups,
    questionIssues,
  };
};

export const formatValidationIssue = (issue: QuestionValidationIssue) => {
  const location = [issue.questionId, issue.field].filter(Boolean).join(" / ");
  const related = issue.relatedQuestionIds?.length
    ? ` [${issue.relatedQuestionIds.join(", ")}]`
    : "";
  return `${issue.severity.toUpperCase()} ${issue.code}${location ? ` (${location})` : ""}: ${issue.message}${related}`;
};
