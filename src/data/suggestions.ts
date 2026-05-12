export type Suggestion = {
  id: string;
  clusterId: string;       // FailureCluster.id this suggestion is derived from
  title: string;
  body: string;            // 1-2 sentences explaining what to change
  estimatedFix: string;    // Compact badge value, e.g., "~21/24 fix"
  builderParams: {
    suggestion: string;    // M1 will read this from URL
    template: string;      // M1 supports ?template=travel — use 'travel' for all 3
    prefill: string;       // Natural-language instruction pre-filled in M1 chat input
  };
};

export const suggestions: Suggestion[] = [
  {
    id: 'sug_clarify_intent',
    clusterId: 'cluster_tool_arg_mismatch',
    title: 'Add a clarifying-question step before tool calls',
    body: 'Insert a Classify node that asks the user to specify missing details (destination, dates) before invoking flight or hotel search tools.',
    estimatedFix: '~21/24 fix',
    builderParams: {
      suggestion: 'clarification',
      template: 'travel',
      prefill:
        'Add a Classify node before the subagents to ask the user for any missing details (destination, dates, traveler count) before calling flight/hotel search.',
    },
  },
  {
    id: 'sug_safety_prompt',
    clusterId: 'cluster_over_refusal',
    title: 'Update the safety prompt to permit personal-use travel info for sanctioned regions',
    body: 'Refine the safety guardrails to allow informational travel responses for sanctioned destinations (e.g., Cuba) when the use case is personal travel.',
    estimatedFix: '8/8 fix',
    builderParams: {
      suggestion: 'safety_prompt_update',
      template: 'travel',
      prefill:
        'Add safety guardrails that permit personal-use informational travel responses for sanctioned destinations like Cuba.',
    },
  },
  {
    id: 'sug_memory_store',
    clusterId: 'cluster_context_drop',
    title: 'Add a Memory Store for itinerary state across long sessions',
    body: 'Persist the day-by-day itinerary in a Memory Store so the agent retains prior hotel/destination choices across long multi-turn sessions.',
    estimatedFix: '~12/15 fix',
    builderParams: {
      suggestion: 'memory_store',
      template: 'travel',
      prefill:
        'Add a Memory Store node to persist itinerary state across long multi-turn sessions so the agent remembers prior hotel and destination choices.',
    },
  },
];
