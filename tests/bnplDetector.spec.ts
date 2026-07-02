import { beforeEach, describe, expect, it } from "vitest";
import { detectBnplProviders } from "../src/content/bnplDetector";

describe("detectBnplProviders", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("detects a provider from a known script host", () => {
    document.body.innerHTML = `<script src="https://js.afterpay.com/afterpay.js"></script>`;
    expect(detectBnplProviders()).toContain("afterpay");
  });

  it("detects a provider from page text as a fallback", () => {
    document.body.innerHTML = `<div>Pay with Klarna at checkout</div>`;
    expect(detectBnplProviders()).toContain("klarna");
  });

  it("returns an empty array when nothing matches", () => {
    document.body.innerHTML = `<div>Regular checkout page</div>`;
    expect(detectBnplProviders()).toEqual([]);
  });
});
