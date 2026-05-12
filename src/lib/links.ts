// Deep-link helper for the Agent Builder (M1) prototype.
//
// The M1 prototype lives at a separate hosted URL and accepts query params
// to pre-load templates and surface eval-context callouts. For local dev,
// override M1_BASE_URL to point at your local M1 dev server (typically
// http://localhost:5174 when both prototypes run concurrently).

const M1_BASE_URL = 'https://wealthwiselabs.github.io/anthropic-agent-builder-prototype';

export function agentBuilderUrl(params: {
  suggestion: string;
  cluster: string;
  template: string;
  prefill: string;
  project?: string;
}): string {
  const search = new URLSearchParams({
    template: params.template,
    prefill: params.prefill,
    from: 'eval',
    suggestion: params.suggestion,
    cluster: params.cluster,
    ...(params.project ? { project: params.project } : {}),
  });
  return `${M1_BASE_URL}/builder?${search.toString()}`;
}
