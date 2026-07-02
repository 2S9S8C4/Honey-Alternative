import type { RewardCategory } from "./types";

export const DOMAIN_CATEGORY_MAP: Record<string, RewardCategory> = {
  "doordash.com": "dining",
  "ubereats.com": "dining",
  "grubhub.com": "dining",
  "seamless.com": "dining",
  "opentable.com": "dining",

  "expedia.com": "travel",
  "delta.com": "travel",
  "united.com": "travel",
  "airbnb.com": "travel",
  "booking.com": "travel",
  "marriott.com": "travel",
  "hilton.com": "travel",

  "instacart.com": "groceries",
  "walmart.com": "groceries",
  "kroger.com": "groceries",
  "wholefoodsmarket.com": "groceries",
  "target.com": "groceries",

  "shell.com": "gas",
  "chevron.com": "gas",
  "exxon.com": "gas",
  "bp.com": "gas",
};

export function detectCategory(domain: string): RewardCategory {
  return DOMAIN_CATEGORY_MAP[domain] ?? "general";
}
