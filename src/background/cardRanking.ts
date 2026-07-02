import type { CreditCard, RankedCard, RewardCategory } from "../common/types";

export function rankCards(cards: CreditCard[], category: RewardCategory): RankedCard[] {
  const withRates = cards.map((card) => ({ ...card, rate: card.rates[category], isBest: false }));
  const sorted = withRates.sort((a, b) => b.rate - a.rate);
  const maxRate = sorted[0]?.rate ?? 0;

  return sorted.map((card) => ({ ...card, isBest: card.rate === maxRate && cards.length > 0 }));
}
