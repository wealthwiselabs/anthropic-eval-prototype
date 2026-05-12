import type { Project } from '../types';

const rates = [0.91, 0.89, 0.92, 0.88, 0.90, 0.91, 0.89, 0.92, 0.90, 0.88, 0.89, 0.84, 0.82, 0.83];

const passRateHistory = rates.map((rate, i) => {
  const d = new Date('2026-05-10T00:00:00Z');
  d.setUTCDate(d.getUTCDate() - (13 - i));
  return { day: d.toISOString().slice(0, 10), rate };
});

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
};

export const projects: Project[] = [travelAgent];
