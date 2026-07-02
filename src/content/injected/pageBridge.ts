/**
 * Runs in the page's main-world context (injected via <script src="pageBridge.js">
 * from the content script's isolated world). Needed because some frameworks
 * (React, Vue) track input state via internal fiber/proxy references that
 * only respond correctly to value changes dispatched from the same world
 * the framework's event listeners were registered in.
 */

const BRIDGE_EVENT = "coupon-finder-set-value";

interface SetValueDetail {
  selector: string;
  value: string;
}

window.addEventListener(BRIDGE_EVENT, ((event: CustomEvent<SetValueDetail>) => {
  const { selector, value } = event.detail;
  const input = document.querySelector<HTMLInputElement>(selector);
  if (!input) return;

  const nativeSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value"
  )?.set;

  nativeSetter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}) as EventListener);
