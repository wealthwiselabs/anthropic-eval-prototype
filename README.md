# Anthropic Eval Prototype

A click-through prototype for the **First-Party Eval** product (idea B1 in the Anthropic Growth PM take-home). The prototype demonstrates a single Console surface where developers flip one toggle to turn prod traffic into a continuously-judged stream, see failure clusters before users complain, and graduate those clusters into reusable test sets with CI hooks — working identically for Managed Agents and self-hosted SDK users.

> Prototype for Anthropic Growth PM take-home — not affiliated with Anthropic.

## Run locally

```bash
npm install
npm run dev    # http://localhost:5173
npm run build  # static bundle in dist/
```

## What's real vs. mocked

**Real, stateful in the client (Zustand, in-memory only — refresh resets):**
- **Save cluster as test set.** The modal on a cluster detail creates a new test set in the store and routes you to its detail page.
- **Run test set.** Deterministic 21/24 result computed from a seeded RNG keyed by the test set ID, plus a real `Run` written to the store.
- **Compare to previous run.** Diff view computed from the actual stored runs.
- **Settings toggle + onboarding wizard.** The 3-step wizard writes `evalEnabled` and `agentType` to the store; the toggle reflects that state.
- **Retention selector.** Writes `retentionDays` to the store.

**Seeded, read-only (looks live, isn't):**
- KPIs, sparkline, cost figures, sampling chart
- All 30 sessions, traces, tool calls, judge scores, and reasoning quotes
- The 3 failure clusters and their representative traces
- The 2 pre-seeded test sets and their prior runs (used for diff baseline)
- The 4 judges on the Judges page (no judge prompts are editable in v1)
- The CI page YAML snippet, CLI snippet, and PR-comment screenshot
- The CI tokens table on Settings

**Inert with "Mocked in this prototype" tooltip:**
- Workspace switcher, credits, avatar
- "+ New project," "+ Add custom judge," "Generate token," "Revoke"
- "Clone to customize" on every judge card
- "Mute cluster" and "Export as JSON" on cluster detail
- Any nav row outside the Evals subtree

## Stack

Vite · React 19 · TypeScript · Tailwind v3 · React Router v7 · Zustand · Recharts · TanStack Table · Shiki · Lucide.

## Hosted URL

https://wealthwiselabs.github.io/anthropic-eval-prototype/
