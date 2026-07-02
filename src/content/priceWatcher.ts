const TOTAL_SELECTOR = '[class*="total" i], [id*="total" i], [data-testid*="total" i]';
const CURRENCY_PATTERN = /[$€£]\s?\d[\d,]*\.?\d*/;

function parsePrice(text: string): number | null {
  const match = text.match(CURRENCY_PATTERN);
  if (!match) return null;
  const numeric = match[0].replace(/[^\d.]/g, "");
  const value = Number.parseFloat(numeric);
  return Number.isNaN(value) ? null : value;
}

function findTotalElement(): Element | null {
  const candidates = Array.from(document.querySelectorAll(TOTAL_SELECTOR));
  return candidates.find((el) => CURRENCY_PATTERN.test(el.textContent ?? "")) ?? null;
}

export function readCurrentPrice(): number | null {
  const el = findTotalElement();
  if (!el) return null;
  return parsePrice(el.textContent ?? "");
}

export function waitForPriceChange(
  baseline: number | null,
  timeoutMs: number
): Promise<number | null> {
  return new Promise((resolve) => {
    const el = findTotalElement();
    if (!el) {
      resolve(null);
      return;
    }

    let settled = false;
    const finish = (value: number | null) => {
      if (settled) return;
      settled = true;
      observer.disconnect();
      clearTimeout(timer);
      resolve(value);
    };

    const observer = new MutationObserver(() => {
      const price = parsePrice(el.textContent ?? "");
      if (price !== null && price !== baseline) {
        finish(price);
      }
    });

    observer.observe(el, { characterData: true, childList: true, subtree: true });

    const timer = setTimeout(() => {
      finish(parsePrice(el.textContent ?? ""));
    }, timeoutMs);
  });
}
