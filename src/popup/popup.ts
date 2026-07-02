import browser from "webextension-polyfill";
import { CATEGORY_LABELS } from "../common/cardData";
import { getRootDomain } from "../common/domain";
import type { Message } from "../common/messages";
import type { BnplProvider, RankedCard, RewardCategory, RunState } from "../common/types";

const findBtn = document.getElementById("find-btn") as HTMLButtonElement;
const statusEl = document.getElementById("status") as HTMLElement;
const resultEl = document.getElementById("result") as HTMLElement;
const resultCodeEl = document.getElementById("result-code") as HTMLElement;
const resultSavingsEl = document.getElementById("result-savings") as HTMLElement;
const enabledToggle = document.getElementById("enabled-toggle") as HTMLInputElement;

function renderState(state: RunState): void {
  resultEl.classList.add("hidden");

  switch (state.status) {
    case "idle":
      statusEl.textContent = "Idle";
      findBtn.disabled = false;
      break;
    case "fetching":
      statusEl.textContent = `Fetching coupons for ${state.domain}...`;
      findBtn.disabled = true;
      break;
    case "trying":
      statusEl.textContent = `Trying ${state.currentCode} (${state.attempt}/${state.total})...`;
      findBtn.disabled = true;
      break;
    case "done":
      findBtn.disabled = false;
      if (state.result) {
        statusEl.textContent = `Best deal found for ${state.domain}`;
        resultEl.classList.remove("hidden");
        resultCodeEl.textContent = state.result.code;
        resultSavingsEl.textContent = `${state.result.savingsPct.toFixed(1)}% ($${state.result.savingsAmount.toFixed(2)})`;
      } else {
        statusEl.textContent = `No working coupons found for ${state.domain}`;
      }
      break;
    case "error":
      findBtn.disabled = false;
      statusEl.textContent = `Error: ${state.message}`;
      break;
  }
}

async function refreshState(): Promise<void> {
  const response = (await browser.runtime.sendMessage({ type: "GET_STATE" } satisfies Message)) as
    | { type: "STATE"; state: RunState }
    | undefined;
  if (response?.state) renderState(response.state);
}

async function findCoupons(): Promise<void> {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url) return;

  const domain = getRootDomain(tab.url);
  findBtn.disabled = true;
  statusEl.textContent = `Fetching coupons for ${domain}...`;

  const response = (await browser.runtime.sendMessage({
    type: "FIND_COUPONS",
    domain,
  } satisfies Message)) as { type: "STATE"; state: RunState } | undefined;

  if (response?.state) renderState(response.state);
}

enabledToggle.addEventListener("change", () => {
  void browser.runtime.sendMessage({
    type: "TOGGLE_ENABLED",
    enabled: enabledToggle.checked,
  } satisfies Message);
});

findBtn.addEventListener("click", () => void findCoupons());

void refreshState();

// --- Tab switching ---

const tabButtons = document.querySelectorAll<HTMLButtonElement>("[data-tab-target]");
const panels = document.querySelectorAll<HTMLElement>("[data-tab]");

function showTab(name: string): void {
  panels.forEach((panel) => panel.classList.toggle("hidden", panel.dataset.tab !== name));
  tabButtons.forEach((btn) => btn.classList.toggle("active", btn.dataset.tabTarget === name));
}

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.tabTarget;
    if (target) showTab(target);
  });
});

// --- Cards panel ---

const BNPL_LABELS: Record<BnplProvider, string> = {
  klarna: "Klarna",
  afterpay: "Afterpay",
  affirm: "Affirm",
  "paypal-pay-in-4": "PayPal Pay in 4",
  zip: "Zip",
  sezzle: "Sezzle",
};

const cardCategoryEl = document.getElementById("card-category") as HTMLElement;
const cardRankingListEl = document.getElementById("card-ranking-list") as HTMLElement;
const noCardsMessageEl = document.getElementById("no-cards-message") as HTMLElement;
const bnplListEl = document.getElementById("bnpl-list") as HTMLElement;
const bnplStatusEl = document.getElementById("bnpl-status") as HTMLElement;

function renderCardRanking(category: RewardCategory, ranked: RankedCard[]): void {
  cardCategoryEl.textContent = CATEGORY_LABELS[category];
  cardRankingListEl.innerHTML = "";
  noCardsMessageEl.classList.toggle("hidden", ranked.length > 0);

  ranked.forEach((card) => {
    const item = document.createElement("li");
    item.classList.toggle("best", card.isBest);
    item.textContent = `${card.nickname} — ${card.rate}x${card.isBest ? " (best match)" : ""}`;
    cardRankingListEl.appendChild(item);
  });
}

async function loadCardRanking(): Promise<void> {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url) return;

  const domain = getRootDomain(tab.url);
  const response = (await browser.runtime.sendMessage({
    type: "GET_CARD_RANKING",
    domain,
  } satisfies Message)) as { type: "CARD_RANKING"; category: RewardCategory; ranked: RankedCard[] } | undefined;

  if (response) renderCardRanking(response.category, response.ranked);
}

// --- BNPL panel ---

function renderBnplProviders(providers: BnplProvider[]): void {
  bnplListEl.innerHTML = "";
  if (providers.length === 0) {
    bnplStatusEl.textContent = "None detected on this page.";
    return;
  }

  bnplStatusEl.textContent = "";
  providers.forEach((provider) => {
    const item = document.createElement("li");
    item.textContent = BNPL_LABELS[provider];
    bnplListEl.appendChild(item);
  });
}

async function loadBnplStatus(): Promise<void> {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  try {
    const response = (await browser.tabs.sendMessage(tab.id, {
      type: "SCAN_BNPL",
    } satisfies Message)) as { type: "BNPL_DETECTED"; providers: BnplProvider[] } | undefined;

    if (response) renderBnplProviders(response.providers);
    else bnplStatusEl.textContent = "Couldn't scan this page.";
  } catch {
    bnplStatusEl.textContent = "Couldn't scan this page.";
  }
}

void loadCardRanking();
void loadBnplStatus();
