import type { Project } from '../types';

const rates = [0.91, 0.89, 0.92, 0.88, 0.90, 0.91, 0.89, 0.92, 0.90, 0.88, 0.89, 0.84, 0.82, 0.83];

function dayOffset(i: number) {
  const d = new Date('2026-05-10T00:00:00Z');
  d.setUTCDate(d.getUTCDate() - (13 - i));
  return d.toISOString().slice(0, 10);
}

const passRateHistory = rates.map((rate, i) => ({ day: dayOffset(i), rate }));

// Latency p95 over 14 days. Range 2200-2600 ms with mild upward drift in the
// last 3 days — mirrors the tool-arg-mismatch cluster causing retries.
const latencyP95Series = [2280, 2240, 2320, 2210, 2350, 2290, 2260, 2330, 2280, 2310, 2270, 2420, 2510, 2580];
const latencyP95History = latencyP95Series.map((value, i) => ({ day: dayOffset(i), value }));

// Session cost p95 over 14 days. Range ~$0.038-$0.045, small upward drift.
const sessionCostP95Series = [0.038, 0.039, 0.038, 0.04, 0.039, 0.038, 0.04, 0.039, 0.041, 0.04, 0.039, 0.042, 0.043, 0.045];
const sessionCostP95History = sessionCostP95Series.map((value, i) => ({ day: dayOffset(i), value }));

export const travelAgent: Project = {
  id: 'travel-agent',
  name: 'travel-agent',
  type: 'managed',
  sessionPassRate14d: 0.87,
  passRateHistory,
  tracesSampled14d: 12431,
  sessions14d: 2847,
  evalCostMTD: 4.2,
  clusterCount: 3,
  latencyP95Ms14d: 2400,
  latencyP90Ms14d: 1800,
  latencyP80Ms14d: 1200,
  latencyP95History,
  sessionCostP95: 0.042,
  sessionCostP90: 0.028,
  sessionCostP80: 0.018,
  sessionCostP95History,
};

export const projects: Project[] = [travelAgent];
