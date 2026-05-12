// Deep-link helper for the Agent Builder (M1) prototype.
//
// On localhost, route to the local M1 dev server (Vite auto-picks 5174 when
// 5173 is taken by this prototype). On any other host, use the deployed
// GitHub Pages URL. Override with `VITE_M1_BASE_URL` env var if needed.

const HOSTED_M1 = 'https://wealthwiselabs.github.io/anthropic-agent-builder-prototype';
const LOCAL_M1 = 'http://localhost:5174';

function resolveBase(): string {
  const envOverride = import.meta.env.VITE_M1_BASE_URL as string | undefined;
  if (envOverride) return envOverride.replace(/\/$/, '');
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return LOCAL_M1;
  }
  return HOSTED_M1;
}

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
  return `${resolveBase()}/builder?${search.toString()}`;
}
