import { describe, expect, it } from "vitest";
import {
  calculateOutsFromSpec,
  getOutsHitRatePercent,
  parseOutsCount,
} from "./outs";

describe("outs calculator", () => {
  it("counts turn overcards plus gutshot without double counting", () => {
    const calculation = calculateOutsFromSpec(
      ["Ah", "Kd"],
      ["Qc", "Js", "7h", "2d"],
      { components: ["overcardPair", "straightDraw"] },
    );

    expect(calculation.outs).toHaveLength(10);
    expect(calculation.byComponent.overcardPair).toHaveLength(6);
    expect(calculation.byComponent.straightDraw).toHaveLength(4);
  });

  it("counts top-pair improvement outs as two pair plus trips", () => {
    const calculation = calculateOutsFromSpec(
      ["Jh", "Tc"],
      ["Js", "8d", "5h", "2c"],
      { components: ["holePairImprove"] },
    );

    expect(calculation.outs).toHaveLength(5);
    expect(calculation.outs).toEqual(["Jd", "Jc", "Ts", "Th", "Td"]);
  });

  it("counts open-ended plus one overcard pair as eleven flop outs", () => {
    const calculation = calculateOutsFromSpec(
      ["Kc", "Jc"],
      ["Qh", "Td", "2s"],
      { components: ["straightDraw", "overcardPair"] },
    );

    expect(calculation.outs).toHaveLength(11);
  });

  it("parses outs labels and turns them into hit rates", () => {
    expect(parseOutsCount("15 Outs / Flop to River")).toBe(15);
    expect(getOutsHitRatePercent(8, ["Td", "7c", "2h"])).toBeCloseTo(31.45, 1);
    expect(getOutsHitRatePercent(10, ["Qc", "Js", "7h", "2d"])).toBeCloseTo(21.74, 1);
  });
});
