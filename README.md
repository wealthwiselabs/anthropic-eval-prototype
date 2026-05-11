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

_To be filled in as later tasks land. v1 will note that **Save-as-test-set** is the only real state mutation; everything else (KPIs, clusters, traces, judge reasoning, runs) is seeded._

## Stack

Vite · React 19 · TypeScript · Tailwind v3 · React Router v7 · Zustand · Recharts · TanStack Table · Shiki · Lucide.

## Hosted URL

https://wealthwiselabs.github.io/anthropic-eval-prototype/
