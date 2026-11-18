// Barcodes on food packs, pure (no page, no storage, no network). The check digit is tested before any lookup
// (DESIGN 15.8): a misread then costs no Open Food Facts call.
// EAN-13, EAN-8, UPC-A (12 digits, kept in its 13-digit form with a leading 0) and a 14-digit GTIN that starts with 0.

export const BARCODE_WORDS = {
  digits: "A barcode has numbers only.",
  length: "A barcode has 8, 12 or 13 digits. Check the digits under the bars.",
  check: "That barcode does not look right. The last digit does not match the others. Scan again or check the digits. No lookup was made.",
  misread: "That read looks wrong. Hold the phone still and try again.",
};

// The last digit of a GTIN (8, 12, 13 or 14 digits) checks the others: weights 3, 1, 3, 1 ... from the right.
export function checkDigitOk(code) {
  if (typeof code !== "string" || !/^\d{8}$|^\d{12,14}$/.test(code)) return false;
  const d = [...code].map(Number);
  const check = d.pop();
  let sum = 0;
  for (let i = d.length - 1, w = 3; i >= 0; i--, w = 4 - w) sum += d[i] * w;
  return (10 - (sum % 10)) % 10 === check;
}

// Typed or read text -> { ok: true, code } or { ok: false, reason: "digits" | "length" | "check" }.
export function normalizeBarcode(text) {
  const s = String(text ?? "").replace(/[\s-]/g, "");
  if (s.length === 0) return { ok: false, reason: "length" };
  if (!/^\d+$/.test(s)) return { ok: false, reason: "digits" };
  if (![8, 12, 13, 14].includes(s.length)) return { ok: false, reason: "length" };
  if (!checkDigitOk(s)) return { ok: false, reason: "check" };
  if (s.length === 12) return { ok: true, code: `0${s}` };
  if (s.length === 14) return s.startsWith("0") ? { ok: true, code: s.slice(1) } : { ok: false, reason: "length" };
  return { ok: true, code: s };
}

// A saved barcode food: the barcode is in the id, so a scan on two phones makes ONE record (research 9.3).
export const foodIdFor = (code) => `fb-${code}`;
