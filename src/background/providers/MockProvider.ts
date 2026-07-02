import type { Coupon, CouponProvider } from "../../common/types";
import mockData from "./mockData/test-checkout.json";

const DATA = mockData as Record<string, Coupon[]>;

export class MockProvider implements CouponProvider {
  readonly id = "mock" as const;

  async getCoupons(domain: string): Promise<Coupon[]> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return DATA[domain] ?? [];
  }
}
