import { create } from 'zustand';
import type { TestSet, Run } from '../types';
import { testSets as seededTestSets } from '../data/testSets';
import { runs as seededRuns } from '../data/runs';

// Single global store. Holds the only mutable state in the prototype:
// - testSets: seeded list + any test sets the user creates via the modal
// - runs: seeded prior runs + any "Run test set" results
// - toast: shared notification slot used by Save-as-test-set (and future flows)

type ToastState = {
  id: number;
  message: string;
  actionLabel?: string;
  actionTo?: string;
} | null;

type Store = {
  testSets: TestSet[];
  runs: Run[];
  toast: ToastState;
  addTestSet: (testSet: TestSet) => void;
  addRun: (run: Run) => void;
  showToast: (message: string, action?: { label: string; to: string }) => void;
  dismissToast: () => void;
};

export const useStore = create<Store>((set) => ({
  testSets: seededTestSets,
  runs: seededRuns,
  toast: null,
  addTestSet: (testSet) => set((s) => ({ testSets: [testSet, ...s.testSets] })),
  addRun: (run) => set((s) => ({ runs: [run, ...s.runs] })),
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
}));
