import browser from "webextension-polyfill";
import { detectCategory } from "../common/categoryLookup";
import { isMessage, type Message } from "../common/messages";
import { rankCards } from "./cardRanking";
import { getState, runCouponSearch } from "./couponOrchestrator";
import { getCards, getSiteSettings, setSiteSettings } from "./storage";

browser.runtime.onMessage.addListener((raw: unknown) => {
  if (!isMessage(raw)) return undefined;
  const message = raw as Message;

  switch (message.type) {
    case "FIND_COUPONS": {
      return getActiveTabId().then(async (tabId) => {
        if (tabId === undefined) return { type: "STATE", state: { status: "idle" } };
        await runCouponSearch(tabId, message.domain);
        return { type: "STATE", state: getState(tabId) };
      });
    }
    case "GET_STATE": {
      return getActiveTabId().then((tabId) => ({
        type: "STATE",
        state: tabId === undefined ? { status: "idle" } : getState(tabId),
      }));
    }
    case "TOGGLE_ENABLED": {
      return getSiteSettings().then((settings) =>
        setSiteSettings({ ...settings, enabled: message.enabled })
      );
    }
    case "GET_CARD_RANKING": {
      const category = detectCategory(message.domain);
      return getCards().then((cards) => ({
        type: "CARD_RANKING",
        category,
        ranked: rankCards(cards, category),
      }));
    }
    default:
      return undefined;
  }
});

async function getActiveTabId(): Promise<number | undefined> {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  return tab?.id;
}
