import browser from "webextension-polyfill";
import type { BestResult, CreditCard, ProviderConfig, SiteSettings } from "../common/types";

const DEFAULT_PROVIDER_CONFIG: ProviderConfig = { providerId: "mock" };
const DEFAULT_SITE_SETTINGS: SiteSettings = { enabled: true, excludedDomains: [] };
const DEFAULT_CARDS: CreditCard[] = [];

interface StorageShape {
  providerConfig: ProviderConfig;
  siteSettings: SiteSettings;
  results: Record<string, BestResult>;
  cards: CreditCard[];
}

export async function getProviderConfig(): Promise<ProviderConfig> {
  const stored = await browser.storage.local.get("providerConfig");
  return (stored.providerConfig as ProviderConfig | undefined) ?? DEFAULT_PROVIDER_CONFIG;
}

export async function setProviderConfig(config: ProviderConfig): Promise<void> {
  await browser.storage.local.set({ providerConfig: config });
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const stored = await browser.storage.local.get("siteSettings");
  return (stored.siteSettings as SiteSettings | undefined) ?? DEFAULT_SITE_SETTINGS;
}

export async function setSiteSettings(settings: SiteSettings): Promise<void> {
  await browser.storage.local.set({ siteSettings: settings });
}

export async function saveResult(result: BestResult): Promise<void> {
  const stored = await browser.storage.local.get("results");
  const results = (stored.results as StorageShape["results"] | undefined) ?? {};
  results[result.domain] = result;
  await browser.storage.local.set({ results });
}

export async function getResult(domain: string): Promise<BestResult | undefined> {
  const stored = await browser.storage.local.get("results");
  const results = (stored.results as StorageShape["results"] | undefined) ?? {};
  return results[domain];
}

export async function getAllResults(): Promise<BestResult[]> {
  const stored = await browser.storage.local.get("results");
  const results = (stored.results as StorageShape["results"] | undefined) ?? {};
  return Object.values(results);
}

export async function getCards(): Promise<CreditCard[]> {
  const stored = await browser.storage.local.get("cards");
  return (stored.cards as CreditCard[] | undefined) ?? DEFAULT_CARDS;
}

export async function setCards(cards: CreditCard[]): Promise<void> {
  await browser.storage.local.set({ cards });
}
