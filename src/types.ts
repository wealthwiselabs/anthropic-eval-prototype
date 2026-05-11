export type JudgeDimension = 'tool-use' | 'safety' | 'faithfulness' | 'task-completion';

export type JudgeScore = {
  dimension: JudgeDimension;
  verdict: 'pass' | 'partial' | 'fail';
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
  dominantStatus: 'pass' | 'partial' | 'fail';
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
