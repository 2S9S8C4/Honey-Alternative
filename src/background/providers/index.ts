import type { CouponProvider, ProviderConfig } from "../../common/types";
import { CouponApiOrgProvider } from "./CouponApiOrgProvider";
import { MockProvider } from "./MockProvider";

export function createProvider(config: ProviderConfig): CouponProvider {
  switch (config.providerId) {
    case "couponapi.org":
      return new CouponApiOrgProvider(config.apiKey);
    case "mock":
    default:
      return new MockProvider();
  }
}
