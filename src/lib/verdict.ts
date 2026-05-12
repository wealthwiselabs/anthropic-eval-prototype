import type { Session, Trace } from '../types';

// AND-of-judges aggregation: a trace passes only if every judge returned pass.
// Centralized here so views, tables, and KPIs can't drift on the rule.
export function traceVerdict(trace: Trace): 'pass' | 'fail' {
  return trace.scores.every((s) => s.verdict === 'pass') ? 'pass' : 'fail';
}

// Session passes only if every trace in it passed. Mirrors the trace-level rule
// one layer up so session-table status and per-trace pills agree by construction.
export function sessionVerdict(session: Session): 'pass' | 'fail' {
  return session.traces.every((t) => traceVerdict(t) === 'pass') ? 'pass' : 'fail';
}
