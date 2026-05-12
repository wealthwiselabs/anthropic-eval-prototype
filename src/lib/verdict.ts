import type { Session, Trace } from '../types';

// AND-of-judges aggregation: a trace passes only if every judge returned pass.
// Centralized here so views, tables, and KPIs can't drift on the rule.
export function traceVerdict(trace: Trace): 'pass' | 'fail' {
  return trace.scores.every((s) => s.verdict === 'pass') ? 'pass' : 'fail';
}

// Session passes only if (a) every trace passes its per-turn judges AND
// (b) every session-scoped judge (e.g. task-completion) passes. Splitting the
// AND across both scopes keeps per-turn correctness and session-level outcome
// independently visible while still rolling up to a single verdict.
export function sessionVerdict(session: Session): 'pass' | 'fail' {
  const turnsAllPass = session.traces.every((t) => traceVerdict(t) === 'pass');
  const sessionScoresAllPass = session.sessionScores.every((s) => s.verdict === 'pass');
  return turnsAllPass && sessionScoresAllPass ? 'pass' : 'fail';
}
