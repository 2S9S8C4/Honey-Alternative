import type { CreditCard, RewardCategory } from "./types";

export const CATEGORIES: RewardCategory[] = [
  "dining",
  "travel",
  "groceries",
  "gas",
  "general",
];

export const CATEGORY_LABELS: Record<RewardCategory, string> = {
  dining: "Dining",
  travel: "Travel",
  groceries: "Groceries",
  gas: "Gas",
  general: "General",
};

type BuiltInCard = Omit<CreditCard, "id" | "isCustom">;

export const BUILT_IN_CARDS: BuiltInCard[] = [
  {
    nickname: "Chase Sapphire Preferred",
    network: "Visa",
    issuer: "Chase",
    rates: { dining: 3, travel: 2, groceries: 1, gas: 1, general: 1 },
  },
  {
    nickname: "Chase Sapphire Reserve",
    network: "Visa",
    issuer: "Chase",
    rates: { dining: 3, travel: 3, groceries: 1, gas: 1, general: 1 },
  },
  {
    nickname: "Amex Gold",
    network: "Amex",
    issuer: "American Express",
    rates: { dining: 4, travel: 3, groceries: 4, gas: 1, general: 1 },
  },
  {
    nickname: "Amex Platinum",
    network: "Amex",
    issuer: "American Express",
    rates: { dining: 1, travel: 5, groceries: 1, gas: 1, general: 1 },
  },
  {
    nickname: "Citi Double Cash",
    network: "Mastercard",
    issuer: "Citi",
    rates: { dining: 2, travel: 2, groceries: 2, gas: 2, general: 2 },
  },
  {
    nickname: "Discover It",
    network: "Discover",
    issuer: "Discover",
    rates: { dining: 2, travel: 1, groceries: 1, gas: 2, general: 1 },
  },
  {
    nickname: "Capital One Venture",
    network: "Mastercard",
    issuer: "Capital One",
    rates: { dining: 2, travel: 2, groceries: 2, gas: 2, general: 2 },
  },
  {
    nickname: "Generic Flat Cashback",
    network: "Visa",
    issuer: "Generic",
    rates: { dining: 1.5, travel: 1.5, groceries: 1.5, gas: 1.5, general: 1.5 },
  },
];
