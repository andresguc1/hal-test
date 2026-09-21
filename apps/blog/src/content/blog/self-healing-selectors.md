---
title: "Self-Healing Selectors: When to Trust the Machine"
description:
  "HAL-TEST can heal broken selectors automatically during a run. Here is the
  decision policy we use, and why the deterministic gate comes before the LLM."
pubDate: 2026-09-21
tags: ["self-healing", "selectors", "architecture"]
author: "HAL-TEST Team"
---

Selectors break. The DOM changes, a class name gets hashed, an A/B test flips the
markup — and suddenly the test that passed yesterday fails at 2 a.m. Self-healing
is the promise that the framework notices and recovers. But _when_ the framework
recovers matters as much as _how_.

## A deterministic gate first

Before any model is involved, HAL-TEST scores the broken selector against the live
DOM. If a candidate can be ranked with high confidence from the page itself, we
heal deterministically:

1. **Detect** the failed locator at runtime.
2. **Rank** semantic candidates (role, text, stable attributes) against the current DOM.
3. **Gate** — only candidates above a confidence threshold proceed.
4. **Heal or suggest**, depending on the policy you pick:
   `AUTO`, `SUGGEST`, or `HUMAN_REVIEW`.

## The LLM only gets the leftovers

The model is a second opinion, not the default path. Routing every failure to an
LLM is slow, expensive, and nondeterministic — three things you don't want in CI.
The deterministic ranker keeps the happy path fast; the LLM covers the long tail
of genuinely ambiguous rewrites.

> The healing decision is a _policy_ decision, not just an accuracy one. `SUGGEST`
> keeps a human in the loop for critical flows; `AUTO` is for low-risk smoke suites.

## When not to heal

Healing is a band-aid for locator brittleness, not a license to stop writing good
selectors. Prefer `data-testid` and role-based queries from day one. If a flow
heals more than a couple of times, that is a signal to fix the page, not the test.
