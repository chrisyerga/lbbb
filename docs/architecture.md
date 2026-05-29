# Architecture

Lida Bida Boda Butt uses TanStack Start for the web surface and Convex for auth, data, storage, and the first-generation job runner.

## Request Flow

1. The browser talks to the TanStack Start app on DigitalOcean.
2. Authenticated UI calls Convex queries, mutations, and actions.
3. User submissions create `petMemories` and `generationJobs`.
4. Convex actions call OpenAI or OpenRouter-compatible APIs.
5. Provider usage writes `generationCosts` records before generated drafts are reviewed.
6. Approved posts become public under `/p/:petSlug/posts/:postSlug`.

## Move-To-Worker Boundary

Convex is the initial job runner. Move generation to a DigitalOcean worker when orchestration needs longer runtimes, heavier media processing, provider polling, or stricter isolation. The stable boundary is the `generationJobs` table plus provider-specific actions.

## Public Routes

Public blogs are pet-first:

```txt
/p/:petSlug
/p/:petSlug/about
/p/:petSlug/archive
/p/:petSlug/posts/:postSlug
```

Slugs should be stable once published. Store prior slugs in `slugHistory` before implementing redirects.
