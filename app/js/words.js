// Counts in words (0.7.5): "1 set", "2 sets", "1 rep", "12 reps". Rosario saw "1 sets" on a Plan card.
// Every screen that puts a count before "set(s)" or "rep(s)" uses these (tests/v075-screens.test.mjs W4 checks it).
export const setWord = (n) => (n === 1 ? "set" : "sets");
export const repWord = (n) => (n === 1 ? "rep" : "reps");
export const nSets = (n) => `${n} ${setWord(n)}`;
export const nReps = (n) => `${n} ${repWord(n)}`;
