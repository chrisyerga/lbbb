import type { NarratorPreviewInputSnapshot } from './types'

export function isNarratorPreviewInputSnapshot(input: unknown): input is NarratorPreviewInputSnapshot {
  return (
    typeof input === 'object' &&
    input !== null &&
    'generationPlan' in input &&
    'promptVars' in input &&
    typeof (input as NarratorPreviewInputSnapshot).generationPlan === 'object'
  )
}

export function parsePreviewInputsForDisplay(inputSnapshot: unknown) {
  if (!isNarratorPreviewInputSnapshot(inputSnapshot)) {
    return null
  }

  const { generationPlan, promptVars, memoryDescription, petName, petSpecies } = inputSnapshot

  return {
    petName,
    petSpecies,
    memoryDescription,
    promptVars,
    generationPlan: {
      narratorSnapshot: generationPlan.narratorSnapshot,
      text: {
        systemPrompt: generationPlan.text.systemPrompt,
        streamUserPrompt: generationPlan.text.streamUserPrompt,
        metadataUserPrompt: generationPlan.text.metadataUserPrompt,
        model: generationPlan.text.model,
        parameters: generationPlan.text.parameters,
        wordTarget: generationPlan.text.wordTarget,
        strategy: generationPlan.text.strategy,
      },
    },
  }
}
