# Cost Tracking

Every billable provider interaction should write a `generationCosts` row.

Tracked fields include user, pet, job, provider, model, operation, token usage, image count, image size, image quality, estimated cost, actual cost where available, provider request ID, and raw sanitized provider metadata.

Initial operations:

```txt
blog_text
blog_title
image_prompt
image_generation
moderation
regeneration
style_variation
```

Costs are queryable directly from raw events first. Add daily rollups only after the raw table becomes too expensive to aggregate interactively.
