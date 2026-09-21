---
title: "Welcome to the HAL-TEST Blog"
description:
  "Where we break down browser automation, self-healing selectors, and the visual
  testing ideas behind HAL-TEST."
pubDate: 2026-09-21
tags: ["announcement", "automation"]
author: "HAL-TEST Team"
---

_This is the seed post for the new HAL-TEST engineering blog. Replace it with the
first real article._

## Why a blog?

HAL-TEST is a visual automation framework that bridges the gap between manual QA
and technical automation. This blog is where we share how it works under the hood:

- How the node-based flow editor translates to real Playwright execution
- When self-healing selectors actually help (and when they shouldn't)
- Performance tricks for running large automation suites
- Postmortems and lessons from real browser automation in production

## Writing is workflow

Every post lives as Markdown in the `apps/blog/src/content/blog/` directory of the
[monorepo](https://github.com/andresguc1/hal-test). On every push that touches the
blog, a GitHub Actions workflow builds the site with Astro and publishes it to
GitHub Pages. No servers, no databases — just Git.

```bash
pnpm --filter @halt-test/blog dev      # local preview on :4321
pnpm --filter @halt-test/blog build    # static build into apps/blog/dist
```

## Next steps

Follow along as we dive into the internals of HAL-TEST. If you build something
with it, [join the community Slack](https://join.slack.com/t/haltest-talk/shared_invite/zt-3tzii9nxh-vgdIcI5A8bg~GCG8QF6MuA)
and show us what you made.
