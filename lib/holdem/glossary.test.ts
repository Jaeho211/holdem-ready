import { describe, expect, it } from "vitest";
import { questionBank } from "../training-data";
import { getQuestionGlossaryTerms } from "./glossary";

describe("question glossary terms", () => {
  it("shows specific preflop terms instead of raw tags", () => {
    const question = questionBank.find((entry) => entry.id === "pre-001");
    expect(question).toBeDefined();

    const terms = getQuestionGlossaryTerms(question!);

    expect(terms[0]).toBe("utg");
    expect(terms).toContain("open");
    expect(terms).toContain("offsuitBroadway");
  });

  it("extracts postflop concepts from board and action text", () => {
    const question = questionBank.find((entry) => entry.id === "post-002");
    expect(question).toBeDefined();

    const terms = getQuestionGlossaryTerms(question!);

    expect(terms).toContain("set");
    expect(terms).toContain("checkRaise");
    expect(terms).toContain("wetBoard");
  });

  it("keeps at least two odds-related glossary chips visible", () => {
    const question = questionBank.find((entry) => entry.id === "odds-004");
    expect(question).toBeDefined();

    const terms = getQuestionGlossaryTerms(question!);

    expect(terms.length).toBeGreaterThanOrEqual(2);
    expect(terms).toEqual(["potOdds", "requiredEquity"]);
  });

  it("keeps limp visible on limper isolation spots", () => {
    const question = questionBank.find((entry) => entry.id === "pre-008");
    expect(question).toBeDefined();

    const terms = getQuestionGlossaryTerms(question!);

    expect(terms).toEqual(["button", "isoRaise", "limp"]);
  });
});
