// Today's blocks with minutes, with the walk minutes taken from the same engine call as the walk screen
// (JUDGING.md 3.6 item 1, Rosario's answer 60 a: display fix only, the engine's walk rules do not change).
// The plan's fixed walk minutes (sessionMinutes) said 30 while walkSuggestion() says 20 until a walk with an effort
// score is saved. Pure: data in, data out.
import { sessionLayout, missedRule } from "./engine/schedule.js";
import { walkSuggestion, finishedSessions } from "./engine/workout.js";
import { days } from "./plan/plan-v2.js";

export function dayLayout(doc, { planDay, week, today, kind = "full" }) {
  const lastFinished = finishedSessions(doc.sessions).find((s) => s.date < today);
  const missed = missedRule(lastFinished ? lastFinished.date : null, today);
  const walk = walkSuggestion(doc, { week, legDay: days[planDay].leg, missed, kind });
  const layout = sessionLayout(kind, week).map((b) => (b.id === "walk" ? { ...b, minutes: walk.minutes } : b));
  return { layout, minutes: layout.reduce((n, b) => n + b.minutes, 0), walk };
}

// The walk of a workout already started: the same call as the workout screen (ui/flow.js buildCtx: the last workout
// finished before its date, its week, its day and its kind), so Today's walk tile shows what the running workout shows
// (0.7.1, checker round 3). null for a day the plan does not know.
export function sessionWalk(doc, session) {
  if (!days[session.plan_day]) return null;
  return dayLayout(doc, { planDay: session.plan_day, week: session.week, today: session.date, kind: session.kind ?? "full" }).walk;
}
