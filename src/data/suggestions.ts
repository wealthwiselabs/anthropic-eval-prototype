export type Suggestion = {
  id: string;
  clusterId: string;       // FailureCluster.id this suggestion is derived from
  title: string;
  body: string;            // 1-2 sentences explaining what to change
  impactNote: string;      // short rationale, e.g., "Would resolve ~21 of 24 failing traces"
  builderParams: {
    suggestion: string;    // M1 will read this from URL
    template: string;      // M1 supports ?template=travel — use 'travel' for all 3
  };
};

export const suggestions: Suggestion[] = [
  {
    id: 'sug_clarify_intent',
    clusterId: 'cluster_tool_arg_mismatch',
    title: 'Add a clarifying-question step before tool calls',
    body: 'Insert a Classify node that asks the user to specify missing details (destination, dates) before invoking flight or hotel search tools.',
    impactNote: 'Targets the tool-arg-mismatch cluster (24 failing traces, 14d). Estimated fix: ~21/24.',
    builderParams: { suggestion: 'clarification', template: 'travel' },
  },
  {
    id: 'sug_safety_prompt',
    clusterId: 'cluster_over_refusal',
    title: 'Update the safety prompt to permit personal-use travel info for sanctioned regions',
    body: 'Refine the safety guardrails to allow informational travel responses for sanctioned destinations (e.g., Cuba) when the use case is personal travel.',
    impactNote: 'Targets the over-refusal cluster (8 failing traces). Estimated fix: 8/8.',
    builderParams: { suggestion: 'safety_prompt_update', template: 'travel' },
  },
  {
    id: 'sug_memory_store',
    clusterId: 'cluster_context_drop',
    title: 'Add a Memory Store for itinerary state across long sessions',
    body: 'Persist the day-by-day itinerary in a Memory Store so the agent retains prior hotel/destination choices across long multi-turn sessions.',
    impactNote: 'Targets the context-drop cluster (15 failing traces). Estimated fix: ~12/15.',
    builderParams: { suggestion: 'memory_store', template: 'travel' },
  },
];
