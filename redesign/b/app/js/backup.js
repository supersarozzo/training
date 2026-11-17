// Backup file: the data document as text. It holds the log and profile only. The GitHub key and the other
// device-only data (running workout, sync state) are never in it (docs/ARCHITECTURE.md sections 4.3 and 10).

export const BACKUP_WARN_BYTES = 800 * 1024; // section 5.1: warn in Settings when the file passes 800 KB

export function backupFilename(date = new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  return `training-backup-${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}.json`;
}

// { filename, text, bytes }. Only the data box is read; the device box is never touched.
export function makeBackup(store, now = new Date()) {
  const doc = { ...store.load() };
  delete doc.device; // belt and braces: these never belong in the data
  delete doc.token;
  const text = `${JSON.stringify(doc, null, 2)}\n`;
  return { filename: backupFilename(now), text, bytes: new TextEncoder().encode(text).length };
}

// Hand the file to the phone (it goes to the Files app). Page only: needs a document.
export function downloadText(filename, text, doc = document) {
  const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  const a = doc.createElement("a");
  a.href = url;
  a.download = filename;
  doc.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
