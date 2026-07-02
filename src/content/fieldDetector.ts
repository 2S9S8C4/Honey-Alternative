const COUPON_FIELD_PATTERN = /coupon|promo|discount|voucher|gift.?card/i;
const APPLY_BUTTON_PATTERN = /apply|redeem|submit/i;

export interface DetectedForm {
  input: HTMLInputElement;
  button: HTMLButtonElement | HTMLInputElement;
}

function matchesCouponField(el: HTMLInputElement): boolean {
  const haystack = [el.name, el.id, el.placeholder, el.getAttribute("aria-label")]
    .filter(Boolean)
    .join(" ");
  return COUPON_FIELD_PATTERN.test(haystack);
}

function matchesApplyButton(el: Element): boolean {
  const text = el.textContent ?? "";
  const value = el instanceof HTMLInputElement ? el.value : "";
  return APPLY_BUTTON_PATTERN.test(text) || APPLY_BUTTON_PATTERN.test(value);
}

function findNearbyButton(input: HTMLInputElement): HTMLButtonElement | HTMLInputElement | null {
  const form = input.closest("form");
  const scope: ParentNode = form ?? input.closest("div,section") ?? document;

  const candidates = Array.from(
    scope.querySelectorAll<HTMLButtonElement | HTMLInputElement>(
      'button, input[type="submit"], input[type="button"]'
    )
  );

  return candidates.find(matchesApplyButton) ?? candidates[0] ?? null;
}

export function detectCouponForm(): DetectedForm | null {
  const inputs = Array.from(document.querySelectorAll<HTMLInputElement>('input[type="text"], input:not([type])'));
  const couponInput = inputs.find(matchesCouponField);
  if (!couponInput) return null;

  const button = findNearbyButton(couponInput);
  if (!button) return null;

  return { input: couponInput, button };
}
