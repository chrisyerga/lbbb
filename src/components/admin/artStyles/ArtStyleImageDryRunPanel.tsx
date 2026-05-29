'use client'

import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import type { FunctionReturnType } from 'convex/server'
import type { Id } from '#convex/_generated/dataModel'
import { api } from '#convex/_generated/api'
import { AdminBtnPrimary, AdminField, AdminInput, AdminSelect, AdminTextarea } from '#/components/admin/form'
import { MonoLabel } from '#/components/admin/jobs/primitives'
import { PreviewInputBlock, PreviewInputRow, PreviewInputSection } from '#/components/admin/preview/PreviewInputPanels'

const DEFAULT_SCENE_PLACEHOLDER =
  'Rex chased a tennis ball through the sprinkler until everyone was soaked, then collapsed in a muddy heap on the porch.'

type DryRunResult = FunctionReturnType<typeof api.adminArtStylePreview.dryRunImagePrompts>
type ResultTab = 'prompts' | 'inputs'

function DryRunInputsPanel({ result }: { result: DryRunResult }) {
  const matchedCast = result.castSnapshot.filter((entry) => entry.matchedInMemory)

  return (
    <div className="admin-preview-inputs">
      <PreviewInputSection title="Test inputs">
        <PreviewInputRow label="Pet" value={result.testInputs.petName} />
        <PreviewInputRow label="Pet species" value={result.testInputs.petSpecies} />
        <PreviewInputBlock label="Sample scene" value={result.testInputs.memoryDescription} />
        <PreviewInputBlock label="Scene prompt" value={result.testInputs.imagePrompt ?? '(none)'} />
        <PreviewInputRow label="Title" value={result.testInputs.title} />
        <PreviewInputRow label="Excerpt" value={result.testInputs.excerpt} />
      </PreviewInputSection>

      <PreviewInputSection title="Art style">
        <PreviewInputRow label="Name" value={result.artStyle.name} />
        <PreviewInputRow label="Slug" value={result.artStyle.slug} />
        <PreviewInputRow label="Status" value={result.artStyle.status} />
        <PreviewInputBlock label="Image prompt suffix" value={result.artStyle.imagePromptSuffix} />
      </PreviewInputSection>

      {result.narrator ? (
        <PreviewInputSection title="Narrator override">
          <PreviewInputRow label="Name" value={result.narrator.name} />
          <PreviewInputRow label="Slug" value={result.narrator.slug} />
          <PreviewInputBlock label="Image prompt suffix" value={result.narrator.imagePromptSuffix ?? '(none)'} />
          <PreviewInputRow label="Image model" value={result.narrator.imageModel} />
        </PreviewInputSection>
      ) : null}

      <PreviewInputSection title="Cast snapshot">
        {matchedCast.length === 0 ? (
          <PreviewInputRow label="Matched cast" value={null} />
        ) : (
          matchedCast.map((entry) => (
            <PreviewInputBlock
              key={entry.castMemberId}
              label={`${entry.name} (${entry.kind})`}
              value={entry.visualDescription}
            />
          ))
        )}
        <PreviewInputBlock label="Cast visual suffix" value={result.castVisualSuffix || '(none)'} />
      </PreviewInputSection>

      <PreviewInputSection title="Prompt assembly">
        <PreviewInputBlock label="Base image prompt" value={result.baseImagePrompt} />
        <PreviewInputBlock label="Merged style suffix" value={result.promptSuffix || '(none)'} />
        <PreviewInputBlock label="Styled base (before variants)" value={result.styledBasePrompt} />
      </PreviewInputSection>

      <PreviewInputSection title="Model config">
        <PreviewInputRow label="Image model" value={result.imageModel} />
        <PreviewInputRow label="Variant count" value={result.variantCount} />
      </PreviewInputSection>
    </div>
  )
}

export function ArtStyleImageDryRunPanel({
  artStyleId,
  disabled,
  canRun,
}: {
  artStyleId: Id<'artStyles'> | null
  disabled: boolean
  canRun: boolean
}) {
  const dryRunImagePrompts = useMutation(api.adminArtStylePreview.dryRunImagePrompts)

  const [petSearch, setPetSearch] = useState('')
  const [selectedPetId, setSelectedPetId] = useState<Id<'pets'> | ''>('')
  const [scene, setScene] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [imagePrompt, setImagePrompt] = useState('')
  const [title, setTitle] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [selectedNarratorId, setSelectedNarratorId] = useState<Id<'narrators'> | ''>('')
  const [result, setResult] = useState<DryRunResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resultTab, setResultTab] = useState<ResultTab>('prompts')

  const pets = useQuery(api.adminPets.listForStaff, { search: petSearch || undefined, limit: 50 })
  const narrators = useQuery(api.adminNarrators.listAll)

  const narratorOptions = useMemo(() => {
    if (!narrators) return []
    const eligible = narrators.filter((n) => n.status !== 'archived')
    if (!artStyleId) return eligible
    const matching = eligible.filter((n) => n.defaultArtStyleId === artStyleId)
    return matching.length > 0 ? matching : eligible
  }, [narrators, artStyleId])

  useEffect(() => {
    setSelectedPetId('')
    setScene('')
    setImagePrompt('')
    setTitle('')
    setExcerpt('')
    setSelectedNarratorId('')
    setResult(null)
    setError(null)
    setResultTab('prompts')
    setShowAdvanced(false)
  }, [artStyleId])

  useEffect(() => {
    if (!pets?.length || selectedPetId) return
    setSelectedPetId(pets[0]._id)
  }, [pets, selectedPetId])

  const canDryRun =
    canRun && !disabled && Boolean(artStyleId) && Boolean(selectedPetId) && scene.trim().length >= 10 && !busy

  async function onDryRun() {
    if (!artStyleId || !selectedPetId || !canDryRun) return
    setError(null)
    setBusy(true)
    setResultTab('prompts')
    try {
      const dryRunResult = await dryRunImagePrompts({
        artStyleId,
        petId: selectedPetId,
        memoryDescription: scene,
        imagePrompt: imagePrompt.trim() || undefined,
        title: title.trim() || undefined,
        excerpt: excerpt.trim() || undefined,
        narratorId: selectedNarratorId || undefined,
      })
      setResult(dryRunResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Dry run failed')
      setResult(null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="admin-art-style-dry-run">
      <MonoLabel>Image dry run</MonoLabel>
      {disabled ? (
        <p className="admin-readonly-note">Save art style first to dry run image prompts.</p>
      ) : (
        <>
          <AdminField label="Pet" helper="Uses saved art style settings. Save before dry run.">
            <AdminInput
              value={petSearch}
              placeholder="Search pets…"
              disabled={!canRun}
              onChange={setPetSearch}
            />
            <AdminSelect
              value={selectedPetId}
              disabled={!canRun || !pets?.length}
              options={(pets ?? []).map((pet) => ({
                value: pet._id,
                label: pet.species ? `${pet.name} (${pet.species})` : pet.name,
              }))}
              onChange={(value) => setSelectedPetId(value)}
            />
          </AdminField>

          <AdminField label="Sample scene">
            <AdminTextarea
              value={scene}
              onChange={setScene}
              rows={4}
              placeholder={DEFAULT_SCENE_PLACEHOLDER}
              disabled={!canRun || busy}
            />
          </AdminField>

          <AdminField label="Narrator (optional)" helper="Adds narrator image suffix and model when selected.">
            <AdminSelect
              value={selectedNarratorId}
              disabled={!canRun || busy}
              options={[
                { value: '', label: 'None — art style only' },
                ...narratorOptions.map((n) => ({ value: n._id, label: n.name })),
              ]}
              onChange={(value) => setSelectedNarratorId(value)}
            />
          </AdminField>

          <button
            type="button"
            className="admin-btn-secondary admin-dry-run-advanced-toggle"
            disabled={!canRun || busy}
            onClick={() => setShowAdvanced((open) => !open)}
          >
            {showAdvanced ? 'Hide advanced' : 'Advanced'}
          </button>

          {showAdvanced ? (
            <div className="admin-dry-run-advanced">
              <AdminField label="Scene prompt" helper="Simulates LLM imagePrompt metadata output.">
                <AdminTextarea
                  rows={3}
                  value={imagePrompt}
                  disabled={!canRun || busy}
                  onChange={setImagePrompt}
                />
              </AdminField>
              <AdminField label="Title">
                <AdminInput value={title} disabled={!canRun || busy} onChange={setTitle} />
              </AdminField>
              <AdminField label="Excerpt">
                <AdminTextarea rows={2} value={excerpt} disabled={!canRun || busy} onChange={setExcerpt} />
              </AdminField>
            </div>
          ) : null}

          <AdminBtnPrimary onClick={() => void onDryRun()} disabled={!canDryRun}>
            {busy ? 'Preparing…' : 'Dry Run'}
          </AdminBtnPrimary>
        </>
      )}

      {error ? <p className="admin-preview-error">{error}</p> : null}

      {result ? (
        <div className="admin-preview-output">
          <div className="admin-editor-tabs admin-preview-output-tabs">
            <button
              type="button"
              className={resultTab === 'prompts' ? 'admin-editor-tab is-active' : 'admin-editor-tab'}
              onClick={() => setResultTab('prompts')}
            >
              Prompts
            </button>
            <button
              type="button"
              className={resultTab === 'inputs' ? 'admin-editor-tab is-active' : 'admin-editor-tab'}
              onClick={() => setResultTab('inputs')}
            >
              Inputs
            </button>
          </div>

          {resultTab === 'prompts' ? (
            <ol className="admin-preview-prompt-list">
              {result.imagePrompts.map((prompt, index) => (
                <li key={index} className="admin-preview-prompt-item">
                  <span className="admin-preview-input-label">Variant {index + 1}</span>
                  <pre className="admin-preview-input-block">{prompt}</pre>
                </li>
              ))}
            </ol>
          ) : (
            <DryRunInputsPanel result={result} />
          )}
        </div>
      ) : null}
    </section>
  )
}
