import { beforeEach, describe, expect, it } from "vitest";
import { detectCouponForm } from "../src/content/fieldDetector";
import { readCurrentPrice } from "../src/content/priceWatcher";

describe("detectCouponForm", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("finds a coupon input and its nearby apply button", () => {
    document.body.innerHTML = `
      <form>
        <input type="text" id="promo-code" placeholder="Coupon code" />
        <button type="button">Apply</button>
      </form>
    `;

    const form = detectCouponForm();
    expect(form).not.toBeNull();
    expect(form?.input.id).toBe("promo-code");
    expect(form?.button.textContent).toBe("Apply");
  });

  it("returns null when no coupon-like field exists", () => {
    document.body.innerHTML = `<form><input type="text" id="email" /></form>`;
    expect(detectCouponForm()).toBeNull();
  });
});

describe("readCurrentPrice", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("parses a currency value from a total element", () => {
    document.body.innerHTML = `<div id="cart-total">Total: $84.50</div>`;
    expect(readCurrentPrice()).toBe(84.5);
  });

  it("returns null when no total element is present", () => {
    document.body.innerHTML = `<div>Nothing here</div>`;
    expect(readCurrentPrice()).toBeNull();
  });
});
