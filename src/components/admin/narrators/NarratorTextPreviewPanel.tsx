'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import type { FunctionReturnType } from 'convex/server'
import type { Id } from '#convex/_generated/dataModel'
import { api } from '#convex/_generated/api'
import { AdminBtnPrimary, AdminField, AdminTextarea } from '#/components/admin/form'
import { MonoLabel } from '#/components/admin/jobs/primitives'
import { PreviewInputBlock, PreviewInputRow, PreviewInputSection } from '#/components/admin/preview/PreviewInputPanels'
import { useNarratorTextPreviewStream } from '#/hooks/useNarratorTextPreviewStream'

const DEFAULT_STORY_PLACEHOLDER =
  'Rex chased a tennis ball through the sprinkler until everyone was soaked, then collapsed in a muddy heap on the porch.'

type PreviewResult = NonNullable<FunctionReturnType<typeof api.adminNarratorPreview.getTextPreview>>
type OutputTab = 'output' | 'inputs'

function PreviewInputsPanel({
  inputs,
  metadataPromptPreview,
}: {
  inputs: NonNullable<PreviewResult['inputs']>
  metadataPromptPreview: string | null
}) {
  const { promptVars, generationPlan } = inputs
  const { narratorSnapshot, text } = generationPlan

  return (
    <div className="admin-preview-inputs">
      <PreviewInputSection title="Test inputs">
        <PreviewInputRow label="Pet name" value={inputs.petName} />
        <PreviewInputRow label="Pet species" value={inputs.petSpecies} />
        <PreviewInputBlock label="Memory" value={inputs.memoryDescription} />
      </PreviewInputSection>

      <PreviewInputSection title="Prompt variables">
        <PreviewInputRow label="Pet (formatted)" value={promptVars.petName} />
        <PreviewInputBlock label="Memory" value={promptVars.memoryDescription} />
        <PreviewInputBlock label="Cast block" value={promptVars.castBlock || '(none)'} />
        <PreviewInputBlock label="Persona block" value={promptVars.personaBlock} />
        <PreviewInputBlock label="Mood block" value={promptVars.moodBlock || '(none)'} />
      </PreviewInputSection>

      <PreviewInputSection title="Narrator">
        <PreviewInputRow label="Name" value={narratorSnapshot.name} />
        <PreviewInputRow label="Slug" value={narratorSnapshot.slug} />
        <PreviewInputRow label="Word target" value={narratorSnapshot.wordTarget} />
      </PreviewInputSection>

      <PreviewInputSection title="Model config">
        <PreviewInputRow label="Model" value={text.model} />
        <PreviewInputRow label="Temperature" value={text.parameters.temperature} />
        <PreviewInputRow label="Max tokens" value={text.parameters.maxTokens} />
        <PreviewInputRow label="Word target" value={text.wordTarget} />
        <PreviewInputRow label="Strategy" value={text.strategy} />
      </PreviewInputSection>

      <PreviewInputSection title="Assembled prompts">
        <PreviewInputBlock label="System prompt" value={text.systemPrompt} />
        <PreviewInputBlock label="Stream user prompt" value={text.streamUserPrompt} />
        <PreviewInputBlock label="Metadata template" value={text.metadataUserPrompt} />
      </PreviewInputSection>

      {metadataPromptPreview ? (
        <PreviewInputSection title="Metadata pass">
          <PreviewInputBlock label="Metadata prompt (with body)" value={metadataPromptPreview} />
        </PreviewInputSection>
      ) : null}
    </div>
  )
}

export function NarratorTextPreviewPanel({
  narratorId,
  disabled,
  canRun,
  defaultStory,
}: {
  narratorId: Id<'narrators'> | null
  disabled: boolean
  canRun: boolean
  defaultStory?: string
}) {
  const startTextPreview = useMutation(api.adminNarratorPreview.startTextPreview)

  const [story, setStory] = useState(defaultStory ?? '')
  const [previewId, setPreviewId] = useState<Id<'narratorTextPreviews'> | null>(null)
  const [streamId, setStreamId] = useState<string | null>(null)
  const [streamDriver, setStreamDriver] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [outputTab, setOutputTab] = useState<OutputTab>('output')

  const preview = useQuery(api.adminNarratorPreview.getTextPreview, previewId ? { previewId } : 'skip')
  const stream = useNarratorTextPreviewStream({ streamId, driven: streamDriver })

  useEffect(() => {
    setStory(defaultStory ?? '')
    setPreviewId(null)
    setStreamId(null)
    setStreamDriver(false)
    setError(null)
    setOutputTab('output')
  }, [narratorId, defaultStory])

  useEffect(() => {
    if (preview?.error) {
      setError(preview.error)
    }
  }, [preview?.error])

  const isGenerating =
    busy ||
    preview?.streamStatus === 'streaming_text' ||
    (streamDriver && preview?.streamStatus !== 'text_done' && preview?.streamStatus !== 'failed')

  const bodyText =
    stream.text && (stream.status === 'streaming' || (stream.status === 'pending' && stream.text.length > 0))
      ? stream.text
      : preview?.streamBody || ''
  const showMetadata = preview?.streamStatus === 'text_done'
  const showResultPane = previewId !== null

  async function onGenerate() {
    if (!narratorId || !canRun || disabled || !story.trim()) return
    setError(null)
    setBusy(true)
    setPreviewId(null)
    setStreamId(null)
    setStreamDriver(false)
    setOutputTab('output')
    try {
      const result = await startTextPreview({
        narratorId,
        memoryDescription: story,
      })
      setPreviewId(result.previewId)
      setStreamId(result.streamId)
      setStreamDriver(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="admin-narrator-text-preview">
      <MonoLabel>Text preview</MonoLabel>
      {disabled ? (
        <p className="admin-readonly-note">Save narrator first to test generation.</p>
      ) : (
        <>
          <AdminField label="Sample story" helper="Uses saved narrator settings. Save before testing.">
            <AdminTextarea
              value={story}
              onChange={setStory}
              rows={4}
              placeholder={DEFAULT_STORY_PLACEHOLDER}
              disabled={!canRun || isGenerating}
            />
          </AdminField>
          <AdminBtnPrimary onClick={() => void onGenerate()} disabled={!canRun || isGenerating || story.trim().length < 10}>
            {isGenerating ? 'Generating…' : 'Generate'}
          </AdminBtnPrimary>
        </>
      )}

      {error ? <p className="admin-preview-error">{error}</p> : null}

      {showResultPane ? (
        <div className="admin-preview-output">
          <div className="admin-editor-tabs admin-preview-output-tabs">
            <button
              type="button"
              className={outputTab === 'output' ? 'admin-editor-tab is-active' : 'admin-editor-tab'}
              onClick={() => setOutputTab('output')}
            >
              Output
            </button>
            <button
              type="button"
              className={outputTab === 'inputs' ? 'admin-editor-tab is-active' : 'admin-editor-tab'}
              onClick={() => setOutputTab('inputs')}
            >
              Inputs
            </button>
          </div>

          {outputTab === 'output' ? (
            <>
              {showMetadata && preview?.title ? <h4 className="admin-output-title">{preview.title}</h4> : null}
              {showMetadata && preview?.excerpt ? (
                <p className="admin-output-body" style={{ opacity: 0.75, marginBottom: 10 }}>
                  {preview.excerpt}
                </p>
              ) : null}
              <p className="admin-output-body">{bodyText || 'Waiting for generated text…'}</p>
              {showMetadata && preview?.tags && preview.tags.length > 0 ? (
                <div className="admin-preview-tags">
                  {preview.tags.map((tag) => (
                    <span key={tag} className="admin-trait-pill is-compact">
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </>
          ) : preview?.inputs ? (
            <PreviewInputsPanel inputs={preview.inputs} metadataPromptPreview={preview.metadataPromptPreview} />
          ) : (
            <p className="admin-readonly-note">Input snapshot unavailable.</p>
          )}
        </div>
      ) : null}
    </section>
  )
}
