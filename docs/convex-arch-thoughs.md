# Chat with Codex via Pi about Convex architecture. Things were getting hairy specifically in the generation backend

 I looked through convex/ with an eye toward “thin public query/mutation functions” and the generation flow. My read: the backend is directionally sound, but generation has become a mixed orchestration/state/prompt/provider
 module, and a few read paths are starting to look like “page controllers” rather than bounded Convex data APIs.

 Current shape

 ### What’s good

 - Auth/ownership helpers are centralized:
     - convex/lib/requireUser.ts
     - convex/lib/requireAccount.ts
     - convex/lib/assets.ts
 - Most public mutations do the right basic things:
     - derive user from auth
     - validate ownership
     - write a small set of documents
 - Generation state is modeled durably:
     - generationJobs
     - generationEvents
     - generationCosts
     - generatedPosts
 - Prompt/narrator/art-style catalog being in Convex makes sense if admins edit it and if generation needs a reproducible snapshot.
 - The persistent streaming component is a reasonable fit for “show generated markdown live.”

 Main architectural concern

 The generation path is doing too many things in too many places:

 - convex/jobs.ts
     - creates jobs
     - resolves cast
     - resolves narrator bundle
     - builds prompt vars
     - builds/stores generationPlan
 - convex/lib/generationPlan.ts
     - loads DB docs
     - composes prompts
     - contains default prompt templates
     - builds stream prompts and image prompts
     - currently has lots of debug console.log
 - convex/memoryGenerationStream.ts
     - HTTP auth/CORS
     - persistent stream integration
     - OpenAI streaming call
     - metadata call
     - job state transitions
     - image action scheduling
     - image generation orchestration
 - convex/generation.ts
     - OpenAI text call
     - internal state mutations
     - legacy non-stream generation action
     - test/debug public actions
     - image storing/finalizing
     - cost estimation

 So there are at least three conceptual layers interleaved:

 1. Public API layer — what the app calls.
 2. Workflow orchestration layer — generation state machine.
 3. Pure generation/domain layer — prompt building, snapshots, parsing, provider adapters.

 That’s where the complexity is coming from.

 What I’d make the architectural model

 I’d use this model:

 ### 1. Public Convex functions should be thin “commands” and “read models”

 Public functions should mostly answer:

 - Who is calling?
 - Are they allowed?
 - What DB records are needed?
 - What durable command/read model should we produce?

 Examples:

 ```ts
   jobs.startMemoryGeneration
   memoryGeneration.attachStream
   jobs.getMineById
   pets.listMine
   memories.create
 ```

 These should not directly know much about OpenAI, prompt construction internals, or multi-step workflows.

 ### 2. Convex mutations should own authoritative state transitions

 Keep these on Convex because they’re transactional and are your source of truth:

 - create job
 - mark processing
 - append event
 - create/update draft
 - add generated asset
 - record costs
 - finalize job
 - fail job
 - moderation decisions
 - quotas/entitlements

 This is exactly the right kind of Convex backend responsibility.

 I’d put these in a dedicated internal module, e.g.

 ```txt
   convex/generationState.ts
 ```

 or

 ```txt
   convex/internal/generationState.ts
 ```

 with internal mutations like:

 ```ts
   createMemoryJobInternal
   markProcessing
   recordTextResult
   recordImageResult
   finalizeJob
   markFailed
   appendEvent
 ```

 These should be small, boring, and idempotent where practical.

 ### 3. Orchestration should be separated from DB mutations

 The “workflow runner” should not contain low-level DB patching logic. It should:

 - load job snapshot
 - call provider
 - stream chunks
 - call internal state mutations
 - schedule next phase
 - handle failure

 For example:

 ```txt
   convex/generationWorkflow.ts
   convex/generationStreaming.ts
   convex/generationImages.ts
 ```

 Or, if keeping fewer files:

 ```txt
   convex/generation/runTextStream.ts
   convex/generation/runImages.ts
   convex/generation/state.ts
   convex/generation/providers/openai.ts
   convex/generation/prompts.ts
 ```

 The important part is conceptual separation.

 ### 4. Prompt construction should be mostly pure

 Prompt composition currently lives in convex/lib/generationPlan.ts, but it both loads DB data and builds prompt strings.

 I’d split that into:

 ```txt
   convex/lib/generation/loadNarratorBundle.ts
   convex/lib/generation/buildGenerationSnapshot.ts
   convex/lib/generation/prompts.ts
   convex/lib/generation/imagePrompts.ts
   convex/lib/generation/types.ts
 ```

 Where:

 - DB-loading helpers can live in Convex.
 - String interpolation/prompt building can be pure.
 - OpenAI response parsing can be pure/provider-adapter code.

 This makes it much easier to test generation without Convex test setup.

 What belongs on Convex backend

 I’d keep these in Convex:

 ### Definitely Convex

 - Auth and authorization.
 - User/account/plan/quota enforcement.
 - Pet, memory, cast member, asset, narrator, prompt catalog data.
 - Moderation workflow.
 - Durable generation job state.
 - Generated post persistence.
 - Asset metadata and Convex storage integration.
 - Internal event/cost/audit logging.
 - Public/private visibility checks.
 - Prompt/narrator/art-style resolution if these are DB-administered and must be snapshot/auditable.

 ### Probably Convex, for now

 - Calling OpenAI from actions / HTTP actions.
 - Persistent streaming bridge.
 - Image storage after generation.

 This is fine while the workflow is simple enough. The rule I’d use:

 │ Convex actions are fine for orchestration until generation needs advanced retry policy, provider fanout, queue observability, long-running workers, or more Node-specific tooling.

 If/when it gets there, I’d move provider orchestration to an external worker, with Convex remaining the source of truth via internal HTTP/API calls.

 ### Not Convex / better elsewhere

 - UI state and multi-step wizard logic.
 - Display-only formatting that doesn’t need server authority.
 - Prompt evaluation/dev tooling.
 - Complex analytics dashboards if they require scans/aggregations over growing data.
 - Provider SDK wrappers that are reusable outside Convex, unless they rely on Convex runtime specifics.
 - Non-authoritative cost display logic, though authoritative cost records should remain in Convex.

 Specific issues I noticed

 ### 1. Generation has duplicate / legacy paths

 convex/generation.ts has:

 - runMemoryGeneration
 - finishGeneration
 - completeWithDraft
 - processJob
 - atest_openai_text

 But the comment says:

 ```ts
   /** Legacy batch path; memory compose uses HTTP stream + runMemoryGenerationImages. */
 ```

 I’d strongly consider deleting or isolating the legacy path. Having both the streaming path and batch path means every future change has to answer “which path does this affect?”

 Also, atest_openai_text and processJob are public actions. If those are still needed, I’d make them internal or move them to test/dev-only tooling.

 ### 2. Public API currently requires a multi-step client dance

 The client appears to do something like:

 1. memories.createDraft
 2. jobs.startMemoryGeneration
 3. memoryGenerationStream.attachStreamToJob
 4. drive the HTTP stream

 That may be fine UX-wise, but architecturally I’d prefer one public command:

 ```ts
   startMemoryGeneration({
     petId,
     memoryId,
     narratorId,
   })
 ```

 returning:

 ```ts
   {
     jobId,
     streamId,
   }
 ```

 Then the client can immediately start the stream. This reduces partial states like “job created but no stream attached.”

 ### 3. generationPlan may be over-snapshotting

 Storing a snapshot is good. It gives you auditability and reproducibility.

 But right now inputSnapshot includes:

 - raw description
 - pet name/species
 - narrator id
 - full generationPlan
 - cast snapshot
 - prompt vars

 Some of that is duplicated.

 I’d define one explicit persisted type like:

 ```ts
   type MemoryGenerationSnapshot = {
     input: {
       description: string
       petName: string
       petSpecies?: string
       cast: CastSnapshotEntry[]
     }
     narrator: NarratorSnapshot
     artStyle: ArtStyleSnapshot
     promptVersionId?: Id<'promptVersions'>
     prompts: {
       system: string
       bodyUser: string
       metadataUser: string
     }
     models: {
       text: string
       image: string
     }
     parameters: {
       temperature?: number
       maxTokens?: number
       wordTarget: number
       imageVariantCount: number
     }
   }
 ```

 That makes the job input contract clearer and removes “planner internals” from the DB record.

 ### 4. Some queries collect too much

 A few places use .collect() then sort/filter/count in memory. That’s okay for early stage, but it can surprise you later.

 Examples:

 - jobs.recentMine collects all owner jobs then sorts/slices.
 - memories.listByPet collects all memories then sorts.
 - adminModeration.queueList does ctx.db.query('assets').collect().
 - quota enforcement collects all jobs/posts for a user and filters by day/month.
 - pets.listMine pulls posts/assets per pet and counts in memory.

 For “thin” Convex functions, I’d prefer bounded indexed reads or denormalized counters.

 Likely schema additions:

 ```ts
   generationJobs.index('by_owner_and_created', ['ownerUserId', 'createdAt'])
   petMemories.index('by_pet_and_occurred_on', ['petId', 'occurredOn'])
   assets.index('by_moderation_status', ['moderationStatus'])
   generatedPosts.index('by_moderation_status', ['moderationStatus'])
   generatedPosts.index('by_owner_and_created', ['ownerUserId', 'createdAt'])
 ```

 You already have some useful indexes, but several query shapes don’t map to them directly.

 ### 5. Debug logs should come out of prompt planning

 convex/lib/generationPlan.ts has many console.logs dumping prompt inputs and prompts. Those are useful while developing, but I would not keep them in the main planner.

 If useful, replace with a controlled debug event or env-gated logging.

 Proposed target structure

 Something like this:

 ```txt
   convex/
     schema.ts

     jobs.ts                    # public job API: start, getMineById, recentMine
     memories.ts                # public memory API
     pets.ts                    # public pet API
     assets.ts                  # public asset API
     narrators.ts               # public narrator catalog reads

     generationState.ts         # internal mutations/queries for durable job state
     generationStream.ts        # HTTP stream bridge only
     generationWorkflow.ts      # internal actions: runText, runImages

     lib/
       auth/
         requireUser.ts
         requireAccount.ts

       generation/
         types.ts
         buildSnapshot.ts       # DB + pure builder boundary
         prompts.ts             # pure prompt construction
         imagePrompts.ts        # pure image prompt variants
         parseTextResult.ts
         pricing.ts
         providers/
           openaiText.ts
           openaiImage.ts

       cast/
         castContext.ts
         castSync.ts
 ```

 You don’t need to do the full directory move immediately. The important thing is to separate responsibilities.

 Suggested generation flow

 ### Public mutation

 jobs.startMemoryGeneration

 Responsible for:

 1. require user
 2. check quota
 3. load memory/pet/narrator/cast
 4. build immutable generation snapshot
 5. create stream id
 6. insert generation job
 7. insert queued event
 8. return { jobId, streamId }

 No OpenAI. No streaming. No image loop.

 ### HTTP action

 generationStream.streamMemoryGeneration

 Responsible for:

 1. authenticate request
 2. verify stream belongs to caller’s job
 3. call persistent text stream wrapper
 4. delegate actual streaming generation to workflow helper/action

 Minimal CORS/stream glue.

 ### Workflow action/helper

 generationWorkflow.runTextStream

 Responsible for:

 1. mark job processing
 2. call OpenAI streaming text
 3. append stream chunks
 4. call metadata provider
 5. call generationState.recordTextResult
 6. schedule runImages

 ### Image action

 generationWorkflow.runImages

 Responsible for:

 1. load job snapshot and draft
 2. build image prompts
 3. call image provider
 4. store blobs
 5. call generationState.recordImageResult
 6. finalize

 ### Internal state module

 generationState.ts

 Responsible for DB state only:

 - getJobInternal
 - markProcessing
 - recordTextResult
 - recordGeneratedImage
 - finalizeGeneration
 - markFailed
 - appendEvent

 No OpenAI, no prompt construction.

 How I’d phase the cleanup

 ### Phase 1: Remove obvious complexity

 - Remove or internalize:
     - atest_openai_text
     - processJob
 - Decide whether runMemoryGeneration legacy batch path is still needed.
     - If not, delete runMemoryGeneration, finishGeneration, completeWithDraft.
 - Remove debug logs from lib/generationPlan.ts.

 ### Phase 2: Extract provider code

 Move OpenAI-specific code out of generation.ts and memoryGenerationStream.ts:

 ```txt
   convex/lib/generation/providers/openaiText.ts
   convex/lib/generation/providers/openaiMetadata.ts
   convex/lib/generation/providers/openaiImage.ts
 ```

 generation.ts / stream modules should not know response JSON details.

 ### Phase 3: Create generationState.ts

 Move internal mutations there:

 - patchStreamStatus
 - emitGenerationEvent
 - upsertDraftFromText
 - appendDraftImage
 - finalizeGenerationJob
 - markProcessing
 - markFailed
 - storeGeneratedImage

 This immediately makes the orchestrators easier to read.

 ### Phase 4: Simplify job startup

 Fold attachStreamToJob into startMemoryGeneration if possible, so job creation returns a stream id.

 Current:

 ```ts
   startMemoryGeneration(...)
   attachStreamToJob(...)
 ```

 Preferred:

 ```ts
   const { jobId, streamId } = await startMemoryGeneration(...)
 ```

 ### Phase 5: Index/read-model cleanup

 Add indexes and adjust queries that currently collect/sort/filter unbounded data.

 My high-level recommendation

 I would not move everything out of Convex. Convex is the right place for the durable application model: jobs, posts, assets, moderation, quota, auth, catalog, and state transitions.

 But I would make Convex registered functions much thinner by drawing a hard line:

 - Queries/mutations: authorization + indexed DB reads/writes + small state changes.
 - Internal mutations: durable generation state transitions.
 - Actions/HTTP actions: external side effects and orchestration only.
 - Pure libs: prompt building, parsing, pricing, provider adapters.

 The biggest win would be consolidating generation around one path and splitting generation.ts / memoryGenerationStream.ts into “state,” “workflow,” “provider,” and “prompt” layers. That would keep the Convex backend
 authoritative without making it feel like the whole generation product is tangled inside a few large Convex function files.

