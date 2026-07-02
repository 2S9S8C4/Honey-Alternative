import browser from "webextension-polyfill";
import { BUILT_IN_CARDS, CATEGORIES, CATEGORY_LABELS } from "../common/cardData";
import type { CardNetwork, CreditCard, ProviderConfig, ProviderId, SiteSettings } from "../common/types";

const providerRadios = document.querySelectorAll<HTMLInputElement>('input[name="provider"]');
const apiKeyField = document.getElementById("api-key-field") as HTMLElement;
const apiKeyInput = document.getElementById("api-key") as HTMLInputElement;
const excludedDomainsInput = document.getElementById("excluded-domains") as HTMLTextAreaElement;
const saveBtn = document.getElementById("save-btn") as HTMLButtonElement;
const saveStatus = document.getElementById("save-status") as HTMLElement;

function getSelectedProvider(): ProviderId {
  return (
    Array.from(providerRadios).find((radio) => radio.checked)?.value as ProviderId | undefined
  ) ?? "mock";
}

function updateApiKeyVisibility(): void {
  apiKeyField.classList.toggle("hidden", getSelectedProvider() !== "couponapi.org");
}

async function loadSettings(): Promise<void> {
  const stored = await browser.storage.local.get(["providerConfig", "siteSettings"]);
  const providerConfig = stored.providerConfig as ProviderConfig | undefined;
  const siteSettings = stored.siteSettings as SiteSettings | undefined;

  if (providerConfig) {
    const radio = Array.from(providerRadios).find((r) => r.value === providerConfig.providerId);
    if (radio) radio.checked = true;
    apiKeyInput.value = providerConfig.apiKey ?? "";
  }

  if (siteSettings) {
    excludedDomainsInput.value = siteSettings.excludedDomains.join("\n");
  }

  updateApiKeyVisibility();
}

async function saveSettings(): Promise<void> {
  const providerConfig: ProviderConfig = {
    providerId: getSelectedProvider(),
    apiKey: apiKeyInput.value.trim() || undefined,
  };

  const excludedDomains = excludedDomainsInput.value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const existing = (await browser.storage.local.get("siteSettings")).siteSettings as
    | SiteSettings
    | undefined;

  const siteSettings: SiteSettings = {
    enabled: existing?.enabled ?? true,
    excludedDomains,
  };

  await browser.storage.local.set({ providerConfig, siteSettings });
  saveStatus.textContent = "Saved.";
  setTimeout(() => (saveStatus.textContent = ""), 2000);
}

providerRadios.forEach((radio) => radio.addEventListener("change", updateApiKeyVisibility));
saveBtn.addEventListener("click", () => void saveSettings());

void loadSettings();

// --- Card management ---

const builtinCardSelect = document.getElementById("builtin-card-select") as HTMLSelectElement;
const addBuiltinCardBtn = document.getElementById("add-builtin-card-btn") as HTMLButtonElement;
const customNicknameInput = document.getElementById("custom-nickname") as HTMLInputElement;
const customNetworkSelect = document.getElementById("custom-network") as HTMLSelectElement;
const customIssuerInput = document.getElementById("custom-issuer") as HTMLInputElement;
const customRateFields = document.getElementById("custom-rate-fields") as HTMLElement;
const addCustomCardBtn = document.getElementById("add-custom-card-btn") as HTMLButtonElement;
const savedCardsList = document.getElementById("saved-cards-list") as HTMLElement;

function populateBuiltinCardSelect(): void {
  builtinCardSelect.innerHTML = "";
  BUILT_IN_CARDS.forEach((card, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = `${card.nickname} (${card.issuer})`;
    builtinCardSelect.appendChild(option);
  });
}

function populateCustomRateFields(): void {
  customRateFields.innerHTML = "";
  CATEGORIES.forEach((category) => {
    const row = document.createElement("div");
    row.className = "rate-field";

    const label = document.createElement("label");
    label.textContent = `${CATEGORY_LABELS[category]} rate`;
    label.htmlFor = `custom-rate-${category}`;

    const input = document.createElement("input");
    input.type = "number";
    input.step = "0.1";
    input.min = "0";
    input.value = "1";
    input.id = `custom-rate-${category}`;
    input.dataset.category = category;

    row.append(label, input);
    customRateFields.appendChild(row);
  });
}

async function getCards(): Promise<CreditCard[]> {
  const stored = await browser.storage.local.get("cards");
  return (stored.cards as CreditCard[] | undefined) ?? [];
}

async function setCards(cards: CreditCard[]): Promise<void> {
  await browser.storage.local.set({ cards });
}

function renderCardsList(cards: CreditCard[]): void {
  savedCardsList.innerHTML = "";
  cards.forEach((card) => {
    const item = document.createElement("li");

    const label = document.createElement("span");
    label.textContent = `${card.nickname} (${card.network}, ${card.issuer})${card.isCustom ? " — custom" : ""}`;

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.textContent = "Remove";
    deleteBtn.addEventListener("click", () => void removeCard(card.id));

    item.append(label, deleteBtn);
    savedCardsList.appendChild(item);
  });
}

async function refreshCardsList(): Promise<void> {
  renderCardsList(await getCards());
}

async function removeCard(id: string): Promise<void> {
  const cards = await getCards();
  await setCards(cards.filter((card) => card.id !== id));
  await refreshCardsList();
}

async function addBuiltinCard(): Promise<void> {
  const index = Number(builtinCardSelect.value);
  const template = BUILT_IN_CARDS[index];
  if (!template) return;

  const card: CreditCard = { ...template, id: crypto.randomUUID(), isCustom: false };
  const cards = await getCards();
  await setCards([...cards, card]);
  await refreshCardsList();
}

async function addCustomCard(): Promise<void> {
  const nickname = customNicknameInput.value.trim();
  if (!nickname) return;

  const rates = {} as CreditCard["rates"];
  customRateFields.querySelectorAll<HTMLInputElement>("input[data-category]").forEach((input) => {
    const category = input.dataset.category as keyof CreditCard["rates"];
    rates[category] = Number.parseFloat(input.value) || 0;
  });

  const card: CreditCard = {
    id: crypto.randomUUID(),
    nickname,
    network: customNetworkSelect.value as CardNetwork,
    issuer: customIssuerInput.value.trim() || "Custom",
    rates,
    isCustom: true,
  };

  const cards = await getCards();
  await setCards([...cards, card]);

  customNicknameInput.value = "";
  customIssuerInput.value = "";
  populateCustomRateFields();

  await refreshCardsList();
}

populateBuiltinCardSelect();
populateCustomRateFields();
addBuiltinCardBtn.addEventListener("click", () => void addBuiltinCard());
addCustomCardBtn.addEventListener("click", () => void addCustomCard());
void refreshCardsList();
