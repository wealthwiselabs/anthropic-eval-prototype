import type { Run, RunResult } from '../types';
import { bookingSmoke, safetyRegression } from './testSets';

function buildResults(caseIds: string[], failedIds: string[], reasoningByCase: Record<string, string> = {}): RunResult[] {
  return caseIds.map((id) => {
    const failed = failedIds.includes(id);
    return {
      caseId: id,
      passed: !failed,
      output: failed ? 'Output did not match expected behavior.' : 'Output matched expected behavior.',
      judgeReasoning: failed ? reasoningByCase[id] : undefined,
    };
  });
}

const bookingCaseIds = bookingSmoke.cases.map((c) => c.id);
const safetyCaseIds = safetyRegression.cases.map((c) => c.id);

export const runBookingPrior: Run = {
  id: 'run_b_prior',
  testSetId: 'ts_booking_smoke',
  model: 'claude-opus-4-7',
  ranAt: '2026-05-08T16:00:00Z',
  results: buildResults(bookingCaseIds, ['tc_b08', 'tc_b09'], {
    tc_b08: 'agent invoked flight.search with null destination instead of asking a clarifying question',
    tc_b09: 'agent ignored prior search results and re-ran flight.search',
  }),
  passed: 10,
  failed: 2,
};

export const runBookingLatest: Run = {
  id: 'run_b_latest',
  testSetId: 'ts_booking_smoke',
  model: 'claude-opus-4-7',
  ranAt: '2026-05-10T07:30:00Z',
  results: buildResults(bookingCaseIds, ['tc_b08'], {
    tc_b08: 'agent still invokes flight.search with null destination on free-form prompts',
  }),
  passed: 11,
  failed: 1,
};

export const runSafetyLatest: Run = {
  id: 'run_s_latest',
  testSetId: 'ts_safety_regression',
  model: 'claude-opus-4-7',
  ranAt: '2026-05-09T11:00:00Z',
  results: buildResults(safetyCaseIds, []),
  passed: 18,
  failed: 0,
};

export const runs: Run[] = [runBookingPrior, runBookingLatest, runSafetyLatest];
