import { create } from 'zustand';
import type { TestSet, Run, Project } from '../types';
import { testSets as seededTestSets } from '../data/testSets';
import { runs as seededRuns } from '../data/runs';
import { travelAgent } from '../data/projects';

// Single global store. Holds the only mutable state in the prototype:
// - testSets: seeded list + any test sets the user creates via the modal
// - runs: seeded prior runs + any "Run test set" results
// - toast: shared notification slot used by Save-as-test-set (and future flows)
// - eval settings: ingestion toggle, agent type, retention — drive the Settings
//   page and the onboarding-wizard handoff

export type AgentType = 'support' | 'code' | 'rag' | 'travel' | 'other';
export type RetentionDays = 30 | 90 | 180;

type ToastState = {
  id: number;
  message: string;
  actionLabel?: string;
  actionTo?: string;
} | null;

type Store = {
  testSets: TestSet[];
  runs: Run[];
  // Projects list is mutable so the Connect modal can append empty-state
  // projects without touching the seed file. Seeded from data/projects.ts.
  projects: Project[];
  toast: ToastState;
  // Eval settings split into org-level and project-level. Project-level fields
  // (evalEnabled, retentionDays) represent per-project overrides; org-level
  // fields (orgEvalEnabled, orgDefaultRetentionDays) are the catalog/default
  // surfaces. Prototype starts ON with data populated so reviewers see the
  // dashboard light up immediately.
  evalEnabled: boolean;
  agentType: AgentType | null;
  retentionDays: RetentionDays;
  orgEvalEnabled: boolean;
  orgDefaultRetentionDays: RetentionDays;
  addTestSet: (testSet: TestSet) => void;
  addRun: (run: Run) => void;
  addProject: (project: Project) => void;
  showToast: (message: string, action?: { label: string; to: string }) => void;
  dismissToast: () => void;
  setEvalEnabled: (enabled: boolean) => void;
  setAgentType: (type: AgentType) => void;
  setRetentionDays: (days: RetentionDays) => void;
  setOrgEvalEnabled: (enabled: boolean) => void;
  setOrgDefaultRetentionDays: (days: RetentionDays) => void;
};

export const useStore = create<Store>((set) => ({
  testSets: seededTestSets,
  runs: seededRuns,
  projects: [travelAgent],
  toast: null,
  evalEnabled: true,
  agentType: 'travel',
  retentionDays: 30,
  orgEvalEnabled: true,
  orgDefaultRetentionDays: 30,
  addTestSet: (testSet) => set((s) => ({ testSets: [testSet, ...s.testSets] })),
  addRun: (run) => set((s) => ({ runs: [run, ...s.runs] })),
  addProject: (project) => set((s) => ({ projects: [...s.projects, project] })),
  showToast: (message, action) =>
    set({
      toast: {
        id: Date.now(),
        message,
        actionLabel: action?.label,
        actionTo: action?.to,
      },
    }),
  dismissToast: () => set({ toast: null }),
  setEvalEnabled: (enabled) => set({ evalEnabled: enabled }),
  setAgentType: (type) => set({ agentType: type }),
  setRetentionDays: (days) => set({ retentionDays: days }),
  setOrgEvalEnabled: (enabled) => set({ orgEvalEnabled: enabled }),
  setOrgDefaultRetentionDays: (days) => set({ orgDefaultRetentionDays: days }),
}));
