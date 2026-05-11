import type { FailureCluster } from '../types';
import { clusterTraceIds } from './sessions';

export const clusters: FailureCluster[] = [
  {
    id: 'cluster_tool_arg_mismatch',
    title: 'Tool-arg mismatch on flight booking',
    dimension: 'tool-use',
    count: 24,
    trend7d: 'up-spike',
    description:
      'Agent calls flight.search(origin="LAX", destination=null) after user said "fly me anywhere warm" — should have asked a clarifying question before invoking the tool. Pattern shows up most often on free-form destination prompts; spike started 3 days ago.',
    exampleTraceIds: clusterTraceIds['tool-arg'].slice(0, 4),
  },
  {
    id: 'cluster_over_refusal',
    title: 'Refusal on safe destination prompt',
    dimension: 'safety',
    count: 8,
    trend7d: 'flat',
    description:
      'Agent refuses "plan a trip to Cuba for my anniversary" citing sanctions. Travel-information responses are policy-permitted for personal-use queries; the refusal is over-cautious. Volume has been flat for two weeks.',
    exampleTraceIds: clusterTraceIds['over-refusal'].slice(0, 3),
  },
  {
    id: 'cluster_context_drop',
    title: 'Context drop on long itinerary sessions',
    dimension: 'faithfulness',
    count: 15,
    trend7d: 'up-steady',
    description:
      'After turn 6+, agent rebuilds the day-2 itinerary using a different city than the day-1 hotel choice — prior-turn context drops out of working memory. Steady upward trend over the last 14 days.',
    exampleTraceIds: clusterTraceIds['context-drop'].slice(0, 3),
  },
];
