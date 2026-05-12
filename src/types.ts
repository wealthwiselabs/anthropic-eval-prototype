export type JudgeDimension = 'tool-use' | 'safety' | 'groundedness' | 'task-completion';

export type JudgeScore = {
  dimension: JudgeDimension;
  verdict: 'pass' | 'fail';
  reasoning?: string;
};

export type Trace = {
  id: string;
  timestamp: string;
  inputPreview: string;
  outputPreview: string;
  toolCalls?: { name: string; args: Record<string, unknown> }[];
  scores: JudgeScore[];
  latencyMs: number;
  tokensIn: number;
  tokensOut: number;
};

export type Session = {
  id: string;
  startedAt: string;
  turns: number;
  userIdHash: string;
  traces: Trace[];
  // Session-scoped judge verdicts (e.g. task-completion). Per-turn judges live
  // on Trace.scores; this array is for outcomes that only make sense across
  // the whole conversation.
  sessionScores: JudgeScore[];
  dominantStatus: 'pass' | 'fail';
};

export type FailureCluster = {
  id: string;
  title: string;
  dimension: JudgeDimension;
  count: number;
  trend7d: 'up-spike' | 'up-steady' | 'flat' | 'down';
  description: string;
  exampleTraceIds: string[];
};

export type TestCase = {
  id: string;
  inputSnippet: string;
  expectedBehavior: string;
  tags: string[];
};

export type TestSet = {
  id: string;
  name: string;
  caseCount: number;
  cases: TestCase[];
  createdAt: string;
  lastRunSummary?: { passed: number; failed: number; runAt: string } | null;
  source: 'seeded' | 'from-cluster';
  sourceClusterId?: string;
};

export type RunResult = {
  caseId: string;
  passed: boolean;
  output: string;
  judgeReasoning?: string;
};

export type Run = {
  id: string;
  testSetId: string;
  model: string;
  ranAt: string;
  results: RunResult[];
  passed: number;
  failed: number;
};

export type Judge = {
  id: string;
  name: string;
  version: string;
  dimension: JudgeDimension;
  description: string;
  source: 'anthropic-default' | 'goal-specific' | 'custom';
  // Whether the judge scores each API call/trace or the full session as a unit.
  // Per-turn judges (tool-use, safety, groundedness) score every trace; the
  // per-session judge (task-completion) scores the whole conversation outcome.
  scope: 'turn' | 'session';
};

export type Project = {
  id: string;
  name: string;
  type: 'managed' | 'self-hosted';
  passRate14d: number;
  passRateHistory: { day: string; rate: number }[];
  tracesSampled14d: number;
  evalCostMTD: number;
  clusterCount: number;
};
