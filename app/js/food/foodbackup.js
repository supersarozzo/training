// The food backup file: the food box as text, in its own file (the workout backup stays as it is).
// It never holds the GitHub key or other device data. Restore is foodmodel.restore (check, then merge).

export function foodBackupFilename(date = new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  return `training-food-backup-${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}.json`;
}

// { filename, text, bytes }. Only the food box is read; the device box is never touched.
export function makeFoodBackup(foodStore, now = new Date()) {
  const doc = { ...foodStore.load() };
  delete doc.device; // belt and braces: these never belong in the data
  delete doc.token;
  const text = `${JSON.stringify(doc, null, 2)}\n`;
  return { filename: foodBackupFilename(now), text, bytes: new TextEncoder().encode(text).length };
}
