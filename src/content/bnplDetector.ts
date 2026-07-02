import type { BnplProvider } from "../common/types";

interface BnplSignature {
  provider: BnplProvider;
  hostPattern: RegExp;
  textPattern: RegExp;
}

const SIGNATURES: BnplSignature[] = [
  { provider: "klarna", hostPattern: /klarna\.com/i, textPattern: /klarna/i },
  {
    provider: "afterpay",
    hostPattern: /(js\.afterpay\.com|static\.afterpay\.com)/i,
    textPattern: /afterpay/i,
  },
  {
    provider: "affirm",
    hostPattern: /(cdn1\.affirm\.com|cdn\.affirm\.com)/i,
    textPattern: /affirm/i,
  },
  {
    provider: "paypal-pay-in-4",
    hostPattern: /paypalobjects\.com/i,
    textPattern: /pay in 4/i,
  },
  { provider: "zip", hostPattern: /zip\.co/i, textPattern: /\bzip\b.*pay/i },
  { provider: "sezzle", hostPattern: /sezzle\.com/i, textPattern: /sezzle/i },
];

function matchesHost(signature: BnplSignature): boolean {
  const sources = Array.from(document.querySelectorAll<HTMLScriptElement | HTMLIFrameElement>(
    "script[src], iframe[src]"
  )).map((el) => el.getAttribute("src") ?? "");
  return sources.some((src) => signature.hostPattern.test(src));
}

function matchesAttribute(signature: BnplSignature): boolean {
  const name = signature.provider.replace(/-/g, "");
  const selector = `[class*="${name}" i], [data-testid*="${name}" i], [id*="${name}" i]`;
  return document.querySelector(selector) !== null;
}

function matchesText(signature: BnplSignature): boolean {
  return signature.textPattern.test(document.body?.textContent ?? "");
}

export function detectBnplProviders(): BnplProvider[] {
  const found = new Set<BnplProvider>();

  for (const signature of SIGNATURES) {
    if (matchesHost(signature) || matchesAttribute(signature) || matchesText(signature)) {
      found.add(signature.provider);
    }
  }

  return Array.from(found);
}
