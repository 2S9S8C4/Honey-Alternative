import { describe, expect, it } from "vitest";
import { rankCards } from "../src/background/cardRanking";
import { detectCategory } from "../src/common/categoryLookup";
import type { CreditCard } from "../src/common/types";

function makeCard(nickname: string, rates: Partial<CreditCard["rates"]>): CreditCard {
  return {
    id: nickname,
    nickname,
    network: "Visa",
    issuer: "Test",
    isCustom: false,
    rates: { dining: 1, travel: 1, groceries: 1, gas: 1, general: 1, ...rates },
  };
}

describe("rankCards", () => {
  it("sorts cards by rate for the given category, highest first", () => {
    const cards = [
      makeCard("Low", { dining: 1 }),
      makeCard("High", { dining: 4 }),
      makeCard("Mid", { dining: 2 }),
    ];

    const ranked = rankCards(cards, "dining");

    expect(ranked.map((c) => c.nickname)).toEqual(["High", "Mid", "Low"]);
    expect(ranked[0]?.isBest).toBe(true);
    expect(ranked[1]?.isBest).toBe(false);
  });

  it("marks all tied top cards as best", () => {
    const cards = [makeCard("A", { travel: 3 }), makeCard("B", { travel: 3 }), makeCard("C", { travel: 1 })];

    const ranked = rankCards(cards, "travel");

    expect(ranked.filter((c) => c.isBest).map((c) => c.nickname).sort()).toEqual(["A", "B"]);
  });

  it("returns an empty array for no cards", () => {
    expect(rankCards([], "general")).toEqual([]);
  });
});

describe("detectCategory", () => {
  it("maps known dining domains to dining", () => {
    expect(detectCategory("doordash.com")).toBe("dining");
  });

  it("maps known travel domains to travel", () => {
    expect(detectCategory("expedia.com")).toBe("travel");
  });

  it("falls back to general for unknown domains", () => {
    expect(detectCategory("some-random-site.example")).toBe("general");
  });
});
