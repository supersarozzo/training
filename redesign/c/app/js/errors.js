// Storage errors that no screen caught (review finding F2, ARCHITECTURE section 6).
// Every save goes through model.js -> store.js. When the phone is full or blocks storage, store.js throws a
// StoreError. A tap handler does not catch it, so without this file the tap did nothing and said nothing.
// Pure: it takes the window (or any EventTarget) and a function that shows a text.
import { StoreError } from "./store.js";

// The plain text for a storage error, or null for any other error.
export function storeErrorText(e) {
  if (!(e instanceof StoreError)) return null;
  return `That was not saved. ${e.message}`;
}

// Listen for storage errors that reached the page. Other errors are left alone.
export function watchStoreErrors(win, show) {
  const handle = (event, err) => {
    const text = storeErrorText(err);
    if (!text) return;
    event.preventDefault();
    try { show(text); } catch { /* showing must never throw */ }
  };
  win.addEventListener("error", (event) => handle(event, event.error));
  win.addEventListener("unhandledrejection", (event) => handle(event, event.reason));
}
