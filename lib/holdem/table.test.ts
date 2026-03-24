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
      parsePostflopSpotlight("BB 콜 vs BTN 오픈, 플랍 체크 후 BTN c-bet", "3bb"),
    ).toEqual({
      seat: "BTN",
      label: "C-BET",
      actionText: "c-bet",
      ariaLabel: "BTN, continuation bet, 3bb",
      summary: "BTN c-bet 3bb",
      betSize: "3bb",
    });
  });

  it("uses the final aggressive action when a check-raise happens", () => {
    expect(
      parsePostflopSpotlight(
        "CO 오픈, BB 콜, 플랍에서 3bb c-bet 후 BB 체크레이즈",
        "15bb 체크레이즈",
      ),
    ).toEqual({
      seat: "BB",
      label: "X/R",
      actionText: "체크레이즈",
      ariaLabel: "BB, check-raise, 15bb",
      summary: "BB 체크레이즈 15bb",
      betSize: "15bb",
    });
  });

  it("handles multiway overbet spots", () => {
    expect(
      parsePostflopSpotlight("CO 오픈, BTN 콜, BB 콜, 턴에서 BB 오버벳", "28bb"),
    ).toEqual({
      seat: "BB",
      label: "OVB",
      actionText: "오버벳",
      ariaLabel: "BB, overbet, 28bb",
      summary: "BB 오버벳 28bb",
      betSize: "28bb",
    });
  });
});
