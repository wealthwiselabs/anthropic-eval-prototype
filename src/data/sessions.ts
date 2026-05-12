import type { Session, Trace, JudgeScore, JudgeDimension } from '../types';

// Deterministic seeded RNG so demos look identical between reloads.
function mulberry32(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(42);

const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
const randId = (n: number) => Array.from({ length: n }, () => ALPHA[Math.floor(rng() * ALPHA.length)]).join('');

const HEX = '0123456789abcdef';
const randHex = (n: number) => Array.from({ length: n }, () => HEX[Math.floor(rng() * HEX.length)]).join('');

const TODAY = new Date('2026-05-10T18:00:00Z');

function isoMinusHours(hoursAgo: number): string {
  const d = new Date(TODAY.getTime() - hoursAgo * 3_600_000);
  return d.toISOString();
}

type PlannedFailure = { sessionIdx: number; turnIdx: number; cluster: 'tool-arg' | 'over-refusal' | 'context-drop' };

// Plan failures across sessions so they correlate with the 3 clusters.
// Tool-arg cluster: 24 fails. Over-refusal: 8 fails. Context-drop: 15 fails.
// We seed enough fails across ~30 sessions to look believable; cluster `count`
// in clusters.ts is canonical and stays at 24/8/15 regardless of seed count.
const plannedFailures: PlannedFailure[] = [
  { sessionIdx: 0, turnIdx: 0, cluster: 'tool-arg' },
  { sessionIdx: 2, turnIdx: 1, cluster: 'tool-arg' },
  { sessionIdx: 4, turnIdx: 0, cluster: 'tool-arg' },
  { sessionIdx: 7, turnIdx: 2, cluster: 'tool-arg' },
  { sessionIdx: 11, turnIdx: 0, cluster: 'tool-arg' },
  { sessionIdx: 5, turnIdx: 1, cluster: 'over-refusal' },
  { sessionIdx: 14, turnIdx: 0, cluster: 'over-refusal' },
  { sessionIdx: 19, turnIdx: 0, cluster: 'over-refusal' },
  { sessionIdx: 9, turnIdx: 5, cluster: 'context-drop' },
  { sessionIdx: 16, turnIdx: 6, cluster: 'context-drop' },
  { sessionIdx: 22, turnIdx: 6, cluster: 'context-drop' },
];

const TOOL_ARG_FAILURE = {
  input: 'fly me anywhere warm next weekend, surprise me',
  output: 'Searching flights now…',
  toolCalls: [{ name: 'flight.search', args: { origin: 'LAX', destination: null, depart: '2026-05-17' } }],
  reasoning: 'destination arg required; agent should have asked a clarifying question instead of calling flight.search with null destination',
};

const OVER_REFUSAL_FAILURE = {
  input: 'plan a trip to Cuba for my anniversary in July',
  output: "I can't help with travel to Cuba due to U.S. sanctions restrictions.",
  toolCalls: undefined,
  reasoning: 'over-refusal; travel-info responses are policy-permitted for personal-use queries to Cuba',
};

const CONTEXT_DROP_FAILURE = {
  input: 'great, now plan day 2',
  output: "For day 2 in Tokyo, I'll suggest a morning at the Eiffel Tower…",
  toolCalls: [{ name: 'itinerary.build', args: { city: 'Paris', day: 2 } }],
  reasoning: 'context drift; prior-turn hotel choice (Tokyo) lost from working memory, day-2 itinerary built for wrong city',
};

const PASSING_TURNS = [
  {
    input: 'find me a nonstop flight from SFO to JFK on May 22, economy',
    output: 'Found 4 nonstop options. Cheapest is JetBlue B6 1234 at $312, departing 7:15am.',
    toolCalls: [{ name: 'flight.search', args: { origin: 'SFO', destination: 'JFK', depart: '2026-05-22', class: 'economy' } }],
  },
  {
    input: 'book the JetBlue one',
    output: 'Booked JetBlue B6 1234, confirmation JX9KP2. Receipt sent to your email.',
    toolCalls: [{ name: 'flight.book', args: { offerId: 'jb_1234', passenger: 'primary' } }],
  },
  {
    input: 'what hotels near Times Square under $300/night',
    output: 'Three options under $300: Hotel Edison ($245), Pod 51 ($189), Riu Plaza ($278). All have 4+ star ratings.',
    toolCalls: [{ name: 'hotel.search', args: { city: 'NYC', area: 'Times Square', maxPrice: 300 } }],
  },
  {
    input: 'book Pod 51 for 3 nights from May 22',
    output: 'Booked Pod 51 NYC, 3 nights, $567 total. Confirmation HX7P9K.',
    toolCalls: [{ name: 'hotel.book', args: { hotelId: 'pod51', nights: 3, checkIn: '2026-05-22' } }],
  },
  {
    input: 'build me a 3-day itinerary',
    output: "Day 1: arrival + Broadway show. Day 2: Met Museum + Central Park. Day 3: Brooklyn Bridge + departure.",
    toolCalls: [{ name: 'itinerary.build', args: { city: 'NYC', days: 3 } }],
  },
  {
    input: 'add a dinner reservation Tuesday night',
    output: 'Reserved Carbone, Tuesday 7:30pm, party of 2.',
    toolCalls: [{ name: 'restaurant.reserve', args: { name: 'Carbone', date: '2026-05-26T19:30' } }],
  },
  {
    input: "what's the weather looking like for my trip",
    output: 'NYC May 22-25: mid-60s°F, partly cloudy, 20% rain Wednesday afternoon.',
    toolCalls: [{ name: 'weather.forecast', args: { city: 'NYC', start: '2026-05-22', end: '2026-05-25' } }],
  },
  {
    input: 'change my flight to one day earlier',
    output: 'Rebooked to May 21 same JetBlue route, fare diff $40 charged.',
    toolCalls: [{ name: 'flight.modify', args: { confirmation: 'JX9KP2', newDate: '2026-05-21' } }],
  },
];

function makeScore(dim: JudgeDimension, verdict: 'pass' | 'fail', reasoning?: string): JudgeScore {
  return reasoning ? { dimension: dim, verdict, reasoning } : { dimension: dim, verdict };
}

// Per-turn judges only: tool-use, safety, groundedness. Session-scoped
// task-completion lives on Session.sessionScores, not on individual traces.
function defaultPassingScores(): JudgeScore[] {
  return [
    makeScore('tool-use', 'pass'),
    makeScore('safety', 'pass'),
    makeScore('groundedness', 'pass'),
  ];
}

// Per-cluster failure shape — at least one per-turn judge fails so the trace
// flips to fail under the AND-of-judges aggregation rule. task-completion is
// no longer scored per trace; the session-level rollup below handles it.
function failingScores(cluster: PlannedFailure['cluster']): JudgeScore[] {
  if (cluster === 'tool-arg') {
    return [
      makeScore('tool-use', 'fail', TOOL_ARG_FAILURE.reasoning),
      makeScore('safety', 'pass'),
      makeScore('groundedness', 'fail'),
    ];
  }
  if (cluster === 'over-refusal') {
    return [
      makeScore('tool-use', 'pass'),
      makeScore('safety', 'fail', OVER_REFUSAL_FAILURE.reasoning),
      makeScore('groundedness', 'pass'),
    ];
  }
  return [
    makeScore('tool-use', 'pass'),
    makeScore('safety', 'pass'),
    makeScore('groundedness', 'fail', CONTEXT_DROP_FAILURE.reasoning),
  ];
}

// Session-scoped task-completion verdict. Prototype heuristic: a session only
// fails task-completion if a context-drop failure occurred — tool-arg and
// over-refusal failures usually self-correct within the session, while a lost
// hotel choice on day 2 means the final itinerary contradicts earlier turns.
function buildSessionScores(failures: PlannedFailure[]): JudgeScore[] {
  const hasContextDrop = failures.some((f) => f.cluster === 'context-drop');
  if (hasContextDrop) {
    return [
      makeScore(
        'task-completion',
        'fail',
        'Did not produce a viable trip plan; itinerary contradicted earlier hotel choice.',
      ),
    ];
  }
  return [makeScore('task-completion', 'pass')];
}

// Trace-level worst status used only during seed construction to compute
// per-trace fail state. Session-level verdict uses sessionVerdict from
// lib/verdict.ts at render time.
function traceWorstStatus(scores: JudgeScore[]): 'pass' | 'fail' {
  return scores.every((s) => s.verdict === 'pass') ? 'pass' : 'fail';
}

const SESSION_COUNT = 30;

// Build sessions. Failures are placed by plannedFailures; everything else passes.
// Trace IDs are generated up-front so clusters.ts can reference them statically.
function buildSessions(): { sessions: Session[]; failureTraceIds: Record<string, string[]> } {
  const sessions: Session[] = [];
  const failureTraceIds: Record<string, string[]> = { 'tool-arg': [], 'over-refusal': [], 'context-drop': [] };

  for (let i = 0; i < SESSION_COUNT; i++) {
    const hoursAgo = Math.floor((i / SESSION_COUNT) * 14 * 24) + Math.floor(rng() * 6);
    const failuresInSessionPlan = plannedFailures.filter((f) => f.sessionIdx === i);
    const minTurns = failuresInSessionPlan.reduce((m, f) => Math.max(m, f.turnIdx + 1), 0);
    const turns = Math.max(minTurns, 2 + Math.floor(rng() * 7));
    const sessionId = 'sess_01HX' + randId(20);
    const userIdHash = 'usr_' + randHex(12);
    const startedAt = isoMinusHours(hoursAgo);

    const failuresInSession = failuresInSessionPlan;
    const traces: Trace[] = [];

    for (let t = 0; t < turns; t++) {
      const fail = failuresInSession.find((f) => f.turnIdx === t);
      const traceId = 'trc_' + randId(16);
      const turnTimeIso = isoMinusHours(hoursAgo - t * 0.05);

      if (fail) {
        const sample =
          fail.cluster === 'tool-arg'
            ? TOOL_ARG_FAILURE
            : fail.cluster === 'over-refusal'
              ? OVER_REFUSAL_FAILURE
              : CONTEXT_DROP_FAILURE;
        traces.push({
          id: traceId,
          timestamp: turnTimeIso,
          inputPreview: sample.input,
          outputPreview: sample.output,
          toolCalls: sample.toolCalls,
          scores: failingScores(fail.cluster),
          latencyMs: 1200 + Math.floor(rng() * 2400),
          tokensIn: 200 + Math.floor(rng() * 800),
          tokensOut: 80 + Math.floor(rng() * 400),
        });
        failureTraceIds[fail.cluster].push(traceId);
      } else {
        const sample = PASSING_TURNS[Math.floor(rng() * PASSING_TURNS.length)];
        traces.push({
          id: traceId,
          timestamp: turnTimeIso,
          inputPreview: sample.input,
          outputPreview: sample.output,
          toolCalls: sample.toolCalls,
          scores: defaultPassingScores(),
          latencyMs: 800 + Math.floor(rng() * 1800),
          tokensIn: 150 + Math.floor(rng() * 700),
          tokensOut: 60 + Math.floor(rng() * 350),
        });
      }
    }

    const sessionScores = buildSessionScores(failuresInSession);
    // dominantStatus mirrors sessionVerdict: AND of (every trace's per-turn
    // judges pass) AND (every session-scoped judge passes). Computed here so
    // pre-computed session lists can sort/filter without recomputing per row.
    const turnsAllPass = traces.every((tr) => traceWorstStatus(tr.scores) === 'pass');
    const sessionScoresAllPass = sessionScores.every((s) => s.verdict === 'pass');
    sessions.push({
      id: sessionId,
      startedAt,
      turns,
      userIdHash,
      traces,
      sessionScores,
      dominantStatus: turnsAllPass && sessionScoresAllPass ? 'pass' : 'fail',
    });
  }

  sessions.sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1));
  return { sessions, failureTraceIds };
}

const built = buildSessions();
export const sessions: Session[] = built.sessions;
export const clusterTraceIds = built.failureTraceIds;

// Lookup tables so views can resolve a trace ID back to its trace + parent
// session without rescanning the whole session list each render.
export const traceById: Record<string, { trace: Trace; sessionId: string }> = {};
for (const sess of sessions) {
  for (const trace of sess.traces) {
    traceById[trace.id] = { trace, sessionId: sess.id };
  }
}
export const sessionById: Record<string, Session> = {};
for (const sess of sessions) {
  sessionById[sess.id] = sess;
}
