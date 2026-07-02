import type { Coupon, TrialResult } from "../common/types";
import type { DetectedForm } from "./fieldDetector";
import { readCurrentPrice, waitForPriceChange } from "./priceWatcher";

const BRIDGE_EVENT = "coupon-finder-set-value";
const TRIAL_TIMEOUT_MS = 5000;

let bridgeInjected = false;

function ensureBridgeInjected(): void {
  if (bridgeInjected) return;
  const script = document.createElement("script");
  script.src = chrome.runtime.getURL("pageBridge.js");
  script.onload = () => script.remove();
  (document.head ?? document.documentElement).appendChild(script);
  bridgeInjected = true;
}

function ensureSelectable(input: HTMLInputElement): string {
  if (!input.id) {
    input.id = `coupon-finder-input-${Math.random().toString(36).slice(2)}`;
  }
  return `#${input.id}`;
}

function setValueViaBridge(input: HTMLInputElement, value: string): void {
  ensureBridgeInjected();
  const selector = ensureSelectable(input);
  window.dispatchEvent(
    new CustomEvent(BRIDGE_EVENT, { detail: { selector, value } })
  );
}

function setValueDirectly(input: HTMLInputElement, value: string): void {
  const nativeSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value"
  )?.set;
  nativeSetter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function clearInput(input: HTMLInputElement): void {
  setValueDirectly(input, "");
}

export async function tryCoupon(form: DetectedForm, coupon: Coupon): Promise<TrialResult> {
  const priceBefore = readCurrentPrice();

  clearInput(form.input);
  setValueDirectly(form.input, coupon.code);
  setValueViaBridge(form.input, coupon.code);

  form.button.click();

  const priceAfter = await waitForPriceChange(priceBefore, TRIAL_TIMEOUT_MS);

  const success =
    priceAfter !== null && priceBefore !== null ? priceAfter <= priceBefore : false;

  return {
    code: coupon.code,
    priceBefore,
    priceAfter,
    success,
  };
}
