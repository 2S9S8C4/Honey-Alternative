# Honey-Alternative
How the extension works
Coupons. The content script scans checkout pages for a coupon/promo input field and its "Apply" button using name/id/placeholder regex heuristics, and locates the page's total via a currency-regex + selector scan. When you click "Find Coupons," the background service worker fetches candidate codes for the current domain from a CouponProvider (currently MockProvider, bundled sample data), then serializes through them one at a time — set the field, click Apply, watch for a DOM mutation or price change via MutationObserver, record the result, move to the next code. Whichever produced the lowest price gets re-applied and left in the field; the popup reports the savings.

Cards. You add cards in the options page — nickname, network, issuer, and per-category reward rates, either from a built-in dataset of real cards (Amex Gold, Chase Sapphire, etc.) or entered manually. On any page, the popup guesses a spending category from a small domain→category lookup table (falls back to "General" for anything unlisted) and ranks your saved cards by reward rate for that category, marking the highest (ties included) as best.

BNPL. The content script scans the page for known Klarna/Afterpay/Affirm/PayPal Pay-in-4/Zip/Sezzle signatures — script/iframe hosts, class/data attributes, and a text fallback — and the popup lists whichever it finds.

Everything communicates through one typed message-passing contract (background ↔ content ↔ popup), and nothing except the coupon-trial loop and BNPL scan ever touches page DOM — popup and options only read/write storage.local and send messages.

Limitations
Coupon data is fake by default. MockProvider only knows about the bundled test-fixture domains. On a real site, it returns nothing until you wire in a real source — and as established, there's no good free one; the realistic path is affiliate-network approval, which this extension hasn't gone through.
Field/button detection is heuristic, not universal. Regex-based matching on names/ids/placeholders breaks on React-portal checkouts, Shadow DOM widgets, iframes, and especially cross-origin hosted checkouts (Stripe Checkout, etc.) that a content script can't reach at all.
The coupon-trial loop can misfire on real sites. It infers success purely from "did the price go down," with no verification against the actual page semantics — a coincidental price change (shipping calc, quantity update) could be misread as a working code, and repeated rapid-fire code attempts risk tripping a real retailer's rate-limiting/anti-bot defenses.
Category detection is a small hand-maintained list. Most real-world domains fall through to "General," so the card ranking is often uninformative outside the handful of seeded merchants.
Card reward rates are a static snapshot, not synced to real issuer terms — no rotating quarterly categories, no expiration handling, explicitly not financial advice.
BNPL detection only catches what's in the DOM at scan time. Lazy-loaded or async-mounted widgets that appear after the popup scans won't show up; there's no rescan/observer for this yet.
MV3 service worker lifecycle. The background worker can be killed and restarted by Chrome mid-flow; state is checkpointed to storage.local but a kill mid-coupon-trial could still leave a half-finished attempt on the page.
Never tested against a real retailer end-to-end — everything's been verified against the local fixture and one synthetic BNPL page via Playwright, not a live site with real traffic, real bot detection, or real checkout complexity.
