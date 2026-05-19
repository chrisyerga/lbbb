# TODO

## Images & storage

- [ ] **Resize images before or after upload** — Convex storage keeps a single full-size blob per file; list avatars and grids currently rely on CSS `object-cover`, which still downloads the original. Evaluate client-side resize (canvas / compression library) vs server-side thumbnails (Convex action + Sharp) vs CDN transforms.
- [ ] **Long-term storage strategy** — Schema supports Convex `_storage` and DO Spaces (`bucket`/`key`/`cdnUrl`). Decide where pet photos and memory attachments should live at scale (cost, CDN, moderation pipeline, public blog delivery) and whether to migrate or dual-write.
