import browser from "webextension-polyfill";
import type { Message } from "../common/messages";
import type { BestResult, Coupon, ProviderError, RunState, TrialResult } from "../common/types";
import { createProvider } from "./providers";
import { getProviderConfig, getSiteSettings, saveResult } from "./storage";

const MAX_CANDIDATES = 15;
const PER_TRIAL_TIMEOUT_MS = 6000;
const INTER_TRIAL_DELAY_MS = 1500;
const OVERALL_TIMEOUT_MS = 90000;
const EARLY_STOP_SAVINGS_PCT = 20;

const runStateByTab = new Map<number, RunState>();

function send(tabId: number, message: Message): Promise<unknown> {
  return browser.tabs.sendMessage(tabId, message);
}

function setState(tabId: number, state: RunState) {
  runStateByTab.set(tabId, state);
}

export function getState(tabId: number): RunState {
  return runStateByTab.get(tabId) ?? { status: "idle" };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestTrial(tabId: number, coupon: Coupon): Promise<TrialResult> {
  const timeoutPromise = new Promise<TrialResult>((resolve) =>
    setTimeout(
      () =>
        resolve({
          code: coupon.code,
          priceBefore: null,
          priceAfter: null,
          success: false,
          error: "timeout",
        }),
      PER_TRIAL_TIMEOUT_MS
    )
  );

  const resultPromise = send(tabId, { type: "TRY_COUPON", coupon }) as Promise<TrialResult>;

  return Promise.race([resultPromise, timeoutPromise]);
}

export async function runCouponSearch(tabId: number, domain: string): Promise<void> {
  const siteSettings = await getSiteSettings();
  if (!siteSettings.enabled || siteSettings.excludedDomains.includes(domain)) {
    setState(tabId, { status: "idle" });
    return;
  }

  setState(tabId, { status: "fetching", domain });

  const providerConfig = await getProviderConfig();
  const provider = createProvider(providerConfig);

  let coupons: Coupon[];
  try {
    coupons = await provider.getCoupons(domain);
  } catch (err) {
    const message = (err as ProviderError).message ?? "Failed to fetch coupons";
    setState(tabId, { status: "error", message });
    return;
  }

  coupons = coupons.slice(0, MAX_CANDIDATES);
  if (coupons.length === 0) {
    setState(tabId, { status: "done", result: null, domain });
    return;
  }

  const deadline = Date.now() + OVERALL_TIMEOUT_MS;
  let bestPrice = Number.POSITIVE_INFINITY;
  let baselinePrice: number | null = null;
  let bestCode: string | null = null;

  for (let i = 0; i < coupons.length; i++) {
    if (Date.now() > deadline) break;

    const coupon = coupons[i];
    if (!coupon) continue;

    setState(tabId, {
      status: "trying",
      domain,
      attempt: i + 1,
      total: coupons.length,
      currentCode: coupon.code,
    });

    const result = await requestTrial(tabId, coupon);

    if (baselinePrice === null && result.priceBefore !== null) {
      baselinePrice = result.priceBefore;
    }

    if (result.success && result.priceAfter !== null && result.priceAfter < bestPrice) {
      bestPrice = result.priceAfter;
      bestCode = result.code;
    }

    if (
      baselinePrice !== null &&
      bestCode !== null &&
      ((baselinePrice - bestPrice) / baselinePrice) * 100 >= EARLY_STOP_SAVINGS_PCT
    ) {
      break;
    }

    if (i < coupons.length - 1) {
      await delay(INTER_TRIAL_DELAY_MS);
    }
  }

  if (bestCode === null || baselinePrice === null) {
    setState(tabId, { status: "done", result: null, domain });
    return;
  }

  await requestTrial(tabId, { code: bestCode, source: "final" });

  const savingsAmount = Math.max(0, baselinePrice - bestPrice);
  const savingsPct = baselinePrice > 0 ? (savingsAmount / baselinePrice) * 100 : 0;

  const result: BestResult = {
    domain,
    code: bestCode,
    savingsAmount,
    savingsPct,
    timestamp: Date.now(),
  };

  await saveResult(result);
  setState(tabId, { status: "done", result, domain });

  await browser.runtime.sendMessage({ type: "BEST_APPLIED", result } satisfies Message).catch(() => {
    // popup may not be open; ignore
  });
}
