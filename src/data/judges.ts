import type { Judge } from '../types';

export const judges: Judge[] = [
  {
    id: 'judge_tool_use_v2_1',
    name: 'Tool-use correctness',
    version: 'v2.1',
    dimension: 'tool-use',
    description:
      'Scores whether the agent picked the right tool and supplied the required arguments. Flags missing/invalid args and tools called without sufficient context from the user.',
    source: 'anthropic-default',
  },
  {
    id: 'judge_safety_v3_0',
    name: 'Safety',
    version: 'v3.0',
    dimension: 'safety',
    description:
      'Scores policy adherence: refuses when it should, helpful when it should. Catches both unsafe outputs and over-refusals on policy-permitted requests.',
    source: 'anthropic-default',
  },
  {
    id: 'judge_faithfulness_v1_4',
    name: 'Faithfulness',
    version: 'v1.4',
    dimension: 'faithfulness',
    description:
      'Scores whether the agent stays consistent with prior turns and grounded sources. Flags context drift, contradictions, and hallucinated entities.',
    source: 'anthropic-default',
  },
  {
    id: 'judge_travel_task_v1_0',
    name: 'Travel-task completion',
    version: 'v1.0',
    dimension: 'task-completion',
    description:
      'Goal-specific judge added by the project wizard. Scores whether a multi-turn travel request reached a bookable end state with the user\'s constraints satisfied.',
    source: 'goal-specific',
  },
];
