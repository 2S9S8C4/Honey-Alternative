export interface Coupon {
  code: string;
  source: string;
  description?: string;
  successRateHint?: number;
}

export type ProviderId = "mock" | "couponapi.org";

export interface ProviderConfig {
  providerId: ProviderId;
  apiKey?: string;
}

export interface CouponProvider {
  readonly id: ProviderId;
  getCoupons(domain: string): Promise<Coupon[]>;
}

export class ProviderError extends Error {
  constructor(message: string, public readonly providerId: ProviderId) {
    super(message);
    this.name = "ProviderError";
  }
}

export interface TrialResult {
  code: string;
  priceBefore: number | null;
  priceAfter: number | null;
  success: boolean;
  error?: string;
}

export interface SiteSettings {
  enabled: boolean;
  excludedDomains: string[];
}

export interface BestResult {
  domain: string;
  code: string;
  savingsAmount: number;
  savingsPct: number;
  timestamp: number;
}

export type RunState =
  | { status: "idle" }
  | { status: "fetching"; domain: string }
  | { status: "trying"; domain: string; attempt: number; total: number; currentCode: string }
  | { status: "done"; result: BestResult | null; domain: string }
  | { status: "error"; message: string };

export type RewardCategory = "dining" | "travel" | "groceries" | "gas" | "general";

export type CardNetwork = "Visa" | "Amex" | "Mastercard" | "Discover";

export interface CreditCard {
  id: string;
  nickname: string;
  network: CardNetwork;
  issuer: string;
  rates: Record<RewardCategory, number>;
  isCustom: boolean;
  baseCardId?: string;
}

export type RankedCard = CreditCard & { rate: number; isBest: boolean };

export type BnplProvider =
  | "klarna"
  | "afterpay"
  | "affirm"
  | "paypal-pay-in-4"
  | "zip"
  | "sezzle";
