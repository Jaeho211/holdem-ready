import { describe, expect, it } from "vitest";
import { questionBank } from "../training-data";
import { oddsQuestions } from "../training-data/questions/odds";
import { postflopQuestions } from "../training-data/questions/postflop";
import { preflopQuestions } from "../training-data/questions/preflop";
import { selectSampleReviewIds } from "./question-batch-report";
import { validateQuestionBank } from "./question-bank-validator";

function cloneAssembly() {
  return {
    questionBank: structuredClone(questionBank),
    preflopQuestions: structuredClone(preflopQuestions),
    postflopQuestions: structuredClone(postflopQuestions),
    oddsQuestions: structuredClone(oddsQuestions),
  };
}

function rebuildQuestionBank(assembly: ReturnType<typeof cloneAssembly>) {
  assembly.questionBank = [
    ...assembly.preflopQuestions,
    ...assembly.postflopQuestions,
    ...assembly.oddsQuestions,
  ];
}

function getIssueCodes(result: ReturnType<typeof validateQuestionBank>, questionId: string) {
  return (result.questionIssues[questionId] ?? []).map((issue) => issue.code);
}

describe("question bank validator", () => {
  it("flags id sequencing gaps", () => {
    const assembly = cloneAssembly();
    assembly.preflopQuestions[1].id = "pre-099";
    rebuildQuestionBank(assembly);

    const result = validateQuestionBank(assembly);

    expect(getIssueCodes(result, "pre-099")).toContain("id-sequence-gap");
  });

  it("flags trimmed or empty string fields", () => {
    const assembly = cloneAssembly();
    assembly.preflopQuestions[0].title = " bad title ";
    rebuildQuestionBank(assembly);

    const result = validateQuestionBank(assembly);

    expect(getIssueCodes(result, "pre-001")).toContain("trimmed-text");
  });

  it("flags unregistered tags", () => {
    const assembly = cloneAssembly();
    assembly.preflopQuestions[0].tags = ["초반 포지션", "새 태그"];
    rebuildQuestionBank(assembly);

    const result = validateQuestionBank(assembly);

    expect(getIssueCodes(result, "pre-001")).toContain("unregistered-tag");
  });

  it("flags prompt length and banned prompt phrases", () => {
    const assembly = cloneAssembly();
    assembly.preflopQuestions[0].prompt = `${"a".repeat(101)} 좋은 자리입니다`;
    rebuildQuestionBank(assembly);

    const result = validateQuestionBank(assembly);

    expect(getIssueCodes(result, "pre-001")).toContain("prompt-too-long");
    expect(getIssueCodes(result, "pre-001")).toContain("prompt-banned-phrase");
  });

  it("flags exact duplicate signatures", () => {
    const assembly = cloneAssembly();
    assembly.preflopQuestions[1].position = assembly.preflopQuestions[0].position;
    assembly.preflopQuestions[1].hand = assembly.preflopQuestions[0].hand;
    assembly.preflopQuestions[1].actionBefore = assembly.preflopQuestions[0].actionBefore;
    assembly.preflopQuestions[1].correct = assembly.preflopQuestions[0].correct;
    rebuildQuestionBank(assembly);

    const result = validateQuestionBank(assembly);

    expect(getIssueCodes(result, "pre-001")).toContain("exact-duplicate");
  });

  it("does not flag preflop spot variants when only the hand differs", () => {
    const assembly = cloneAssembly();
    assembly.preflopQuestions[1].position = assembly.preflopQuestions[0].position;
    assembly.preflopQuestions[1].actionBefore = assembly.preflopQuestions[0].actionBefore;
    assembly.preflopQuestions[1].correct = assembly.preflopQuestions[0].correct;
    rebuildQuestionBank(assembly);

    const result = validateQuestionBank(assembly);

    expect(getIssueCodes(result, "pre-001")).not.toContain("near-duplicate");
  });

  it("still flags near duplicates outside preflop hand-only variants", () => {
    const assembly = cloneAssembly();
    const left = assembly.oddsQuestions.find((question) => question.id === "odds-006");
    const right = assembly.oddsQuestions.find((question) => question.id === "odds-016");

    if (!left || !right) {
      throw new Error("expected odds-006 and odds-016 fixtures");
    }

    right.pot = left.pot;
    right.villainBet = left.villainBet;
    right.correct = left.correct;
    right.mathFocus = "different math label";
    rebuildQuestionBank(assembly);

    const result = validateQuestionBank(assembly);

    expect(
      result.nearDuplicateGroups.some(
        (group) =>
          group.questionIds.includes("odds-006") &&
          group.questionIds.includes("odds-016") &&
          group.differingFields?.join(",") === "mathFocus",
      ),
    ).toBe(true);
  });

  it("flags preflop hand notation mismatches", () => {
    const assembly = cloneAssembly();
    assembly.preflopQuestions[0].hand = "AQo";
    rebuildQuestionBank(assembly);

    const result = validateQuestionBank(assembly);

    expect(getIssueCodes(result, "pre-001")).toContain("preflop-hand-mismatch");
  });

  it("flags postflop reviewSpec mismatches", () => {
    const assembly = cloneAssembly();
    assembly.postflopQuestions[0].reviewSpec.madeHand = "bottomPair";
    rebuildQuestionBank(assembly);

    const result = validateQuestionBank(assembly);

    expect(getIssueCodes(result, "post-001")).toContain("postflop-review-made-hand");
  });

  it("flags odds option label format issues", () => {
    const assembly = cloneAssembly();
    assembly.oddsQuestions[0].options[0].label = "19 percent";
    rebuildQuestionBank(assembly);

    const result = validateQuestionBank(assembly);

    expect(getIssueCodes(result, "odds-001")).toContain("invalid-odds-label");
  });

  it("flags pot convention mismatches for odds questions", () => {
    const assembly = cloneAssembly();
    assembly.oddsQuestions[6].pot = "30bb";
    rebuildQuestionBank(assembly);

    const result = validateQuestionBank(assembly);

    expect(getIssueCodes(result, "odds-007")).toContain("pot-odds-mismatch");
  });

  it("selects deterministic sample review ids", () => {
    const validation = validateQuestionBank({
      questionBank,
      preflopQuestions,
      postflopQuestions,
      oddsQuestions,
    });
    const changedQuestionIds = questionBank.slice(0, 18).map((question) => question.id);

    const first = selectSampleReviewIds({
      changedQuestionIds,
      validation,
      currentQuestionBank: questionBank,
    });
    const second = selectSampleReviewIds({
      changedQuestionIds,
      validation,
      currentQuestionBank: questionBank,
    });

    expect(first).toEqual(second);
    expect(first.length).toBeGreaterThan(0);
  });
});
