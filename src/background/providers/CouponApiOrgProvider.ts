import { ProviderError, type Coupon, type CouponProvider } from "../../common/types";

interface CouponApiOrgOffer {
  code?: string;
  offer_id?: string;
  title?: string;
  description?: string;
}

interface CouponApiOrgResponse {
  coupons?: CouponApiOrgOffer[];
}

/**
 * Integrates with couponapi.org, which aggregates coupon/deal feeds from
 * multiple affiliate networks behind an API key. Requires the caller to
 * have signed up for a key and stored it via the options page.
 */
export class CouponApiOrgProvider implements CouponProvider {
  readonly id = "couponapi.org" as const;

  constructor(private readonly apiKey: string | undefined) {}

  async getCoupons(domain: string): Promise<Coupon[]> {
    if (!this.apiKey) {
      throw new ProviderError(
        "No CouponAPI.org API key configured. Add one in the extension options page.",
        this.id
      );
    }

    const url = new URL("https://couponapi.org/api/");
    url.searchParams.set("domain", domain);
    url.searchParams.set("keywords", domain);
    url.searchParams.set("s", this.apiKey);

    let response: Response;
    try {
      response = await fetch(url.toString());
    } catch (err) {
      throw new ProviderError(
        `Failed to reach CouponAPI.org: ${(err as Error).message}`,
        this.id
      );
    }

    if (!response.ok) {
      throw new ProviderError(
        `CouponAPI.org request failed with status ${response.status}`,
        this.id
      );
    }

    const data = (await response.json()) as CouponApiOrgResponse;
    const offers = data.coupons ?? [];

    return offers
      .filter((offer): offer is CouponApiOrgOffer & { code: string } => Boolean(offer.code))
      .map((offer) => ({
        code: offer.code,
        source: "couponapi.org",
        description: offer.title ?? offer.description,
      }));
  }
}
