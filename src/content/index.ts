import browser from "webextension-polyfill";
import { isMessage, type Message } from "../common/messages";
import { detectBnplProviders } from "./bnplDetector";
import { detectCouponForm, type DetectedForm } from "./fieldDetector";
import { tryCoupon } from "./trialEngine";

let cachedForm: DetectedForm | null = null;

function getForm(): DetectedForm | null {
  if (!cachedForm || !document.contains(cachedForm.input)) {
    cachedForm = detectCouponForm();
  }
  return cachedForm;
}

browser.runtime.onMessage.addListener((raw: unknown) => {
  if (!isMessage(raw)) return undefined;
  const message = raw as Message;

  if (message.type === "TRY_COUPON") {
    const form = getForm();
    if (!form) {
      return Promise.resolve({
        code: message.coupon.code,
        priceBefore: null,
        priceAfter: null,
        success: false,
        error: "no-coupon-field-found",
      });
    }
    return tryCoupon(form, message.coupon);
  }

  if (message.type === "SCAN_BNPL") {
    return Promise.resolve({
      type: "BNPL_DETECTED",
      providers: detectBnplProviders(),
    });
  }

  return undefined;
});
