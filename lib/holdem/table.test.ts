import { describe, expect, it } from "vitest";
import { parsePostflopSpotlight, parsePreflopActions } from "./table";

describe("table action parsers", () => {
  it("maps preflop seats from action order around the hero", () => {
    const seats = parsePreflopActions("BB", "CO 3bb 오픈, BTN 콜, SB 폴드");

    expect(seats.get("CO")).toEqual({ action: "open", betSize: "3bb" });
    expect(seats.get("BTN")).toEqual({ action: "call", betSize: undefined });
    expect(seats.get("SB")).toEqual({ action: "fold", betSize: undefined });
    expect(seats.get("BB")).toEqual({ action: "hero" });
    expect(seats.get("UTG")).toEqual({ action: "fold", betSize: undefined });
  });

  it("finds the current postflop aggressor for continuation bets", () => {
    expect(
      parsePostflopSpotlight("BB", "BB 콜 vs BTN 오픈, 플랍 체크 후 BTN c-bet", "3bb"),
    ).toEqual({
      seat: "BTN",
      label: "BET",
      actionText: "bet",
      ariaLabel: "BTN, bet, 3bb",
      summary: "BTN 3bb bet",
      betSize: "3bb",
    });
  });

  it("uses the final aggressive action when a check-raise happens", () => {
    expect(
      parsePostflopSpotlight(
        "CO",
        "CO 오픈, BB 콜, 플랍에서 3bb c-bet 후 BB 체크레이즈",
        "15bb 체크레이즈",
      ),
    ).toEqual({
      seat: "BB",
      label: "CHECK-RAISE",
      actionText: "check-raise",
      ariaLabel: "BB, check-raise, 15bb",
      summary: "BB 15bb check-raise",
      betSize: "15bb",
    });
  });

  it("handles multiway overbet spots", () => {
    expect(
      parsePostflopSpotlight("CO", "CO 오픈, BTN 콜, BB 콜, 턴에서 BB 오버벳", "28bb"),
    ).toEqual({
      seat: "BB",
      label: "OVERBET",
      actionText: "overbet",
      ariaLabel: "BB, overbet, 28bb",
      summary: "BB 28bb overbet",
      betSize: "28bb",
    });
  });

  it.each([
    {
      heroPosition: "BB",
      actionBefore: "BB 콜 vs BTN 오픈, 플랍 체크 후 BTN 소형 c-bet",
      betSize: "3bb",
      expectedSeat: "BTN",
      expectedSummary: "BTN 3bb bet",
    },
    {
      heroPosition: "BTN",
      actionBefore: "BTN 오픈에 BB 콜, 플랍에서 BB 소형 돈크벳",
      betSize: "4bb",
      expectedSeat: "BB",
      expectedSummary: "BB 4bb bet",
    },
    {
      heroPosition: "CO",
      actionBefore: "CO 오픈, BTN 콜, BB 콜, 턴에서 BB 큰 리드",
      betSize: "18bb",
      expectedSeat: "BB",
      expectedSummary: "BB 18bb bet",
    },
    {
      heroPosition: "BB",
      actionBefore: "BB 콜 vs BTN 오픈, 플랍 체크콜 후 턴에서 BTN 큰 세컨드 배럴",
      betSize: "11bb",
      expectedSeat: "BTN",
      expectedSummary: "BTN 11bb bet",
    },
    {
      heroPosition: "BTN",
      actionBefore: "BTN 콜 vs CO 오픈, 플랍 체크체크 후 턴에서 CO 배럴",
      betSize: "11bb",
      expectedSeat: "CO",
      expectedSummary: "CO 11bb bet",
    },
  ])("normalizes postflop betting actions for Prior Action", ({
    heroPosition,
    actionBefore,
    betSize,
    expectedSeat,
    expectedSummary,
  }) => {
    expect(parsePostflopSpotlight(heroPosition, actionBefore, betSize)).toMatchObject({
      seat: expectedSeat,
      label: "BET",
      actionText: "bet",
      ariaLabel: `${expectedSeat}, bet, ${betSize}`,
      summary: expectedSummary,
      betSize,
    });
  });

  it("infers the villain check on river value-bet spots", () => {
    expect(
      parsePostflopSpotlight(
        "BTN",
        "BTN 오픈에 BB 콜, 플랍 체크콜, 턴 체크체크, 리버 체크",
        "체크",
      ),
    ).toEqual({
      seat: "BB",
      label: "CHECK",
      actionText: "check",
      ariaLabel: "BB, check",
      summary: "BB check",
      betSize: undefined,
    });
  });
});
