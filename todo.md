# TODO

## Build

- [ ] **Presubmit checks** -- Catching too many typecheck and eslint errors in Github actions. We need to run these before submit

## Generation Queue UI

- [ ] Monitor jobs and events

## Convex Debugger

- [ ] Set breakpoints and inspect variables/properties in backend

## Costs

- [ ] Actual costs are missing from the cost tracking. Somehow not picking these up from the API

## Model Settings

 - [ ] Hacky constants for gpt-image-2 and text models in the code
 - [ ] Code is pulling from .env vars in Convex. This is weird and hard-coded. Needs to be params as part of the generation job

## Routing

 - [ ] Need to understand Tanstack router better. Pages weren't rendering because they needed something called an <Outlet /> ??

## Images & storage

- [ ] **Resize images before or after upload** — Convex storage keeps a single full-size blob per file; list avatars and grids currently rely on CSS `object-cover`, which still downloads the original. Evaluate client-side resize (canvas / compression library) vs server-side thumbnails (Convex action + Sharp) vs CDN transforms.
- [ ] **Long-term storage strategy** — Schema supports Convex `_storage` and DO Spaces (`bucket`/`key`/`cdnUrl`). Decide where pet photos and memory attachments should live at scale (cost, CDN, moderation pipeline, public blog delivery) and whether to migrate or dual-write.
