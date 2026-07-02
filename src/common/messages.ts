import type {
  BestResult,
  BnplProvider,
  Coupon,
  RankedCard,
  RewardCategory,
  RunState,
  TrialResult,
} from "./types";

export type Message =
  | { type: "FIND_COUPONS"; domain: string }
  | { type: "COUPONS_READY"; coupons: Coupon[] }
  | { type: "TRY_COUPON"; coupon: Coupon }
  | { type: "TRIAL_RESULT"; result: TrialResult }
  | { type: "BEST_APPLIED"; result: BestResult }
  | { type: "GET_STATE" }
  | { type: "STATE"; state: RunState }
  | { type: "TOGGLE_ENABLED"; enabled: boolean }
  | { type: "NO_FIELD_FOUND" }
  | { type: "GET_CARD_RANKING"; domain: string }
  | { type: "CARD_RANKING"; category: RewardCategory; ranked: RankedCard[] }
  | { type: "SCAN_BNPL" }
  | { type: "BNPL_DETECTED"; providers: BnplProvider[] };

export function isMessage(value: unknown): value is Message {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    typeof (value as { type: unknown }).type === "string"
  );
}
