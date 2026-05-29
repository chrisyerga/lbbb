export function estimateTextCostUsd(inputTokens = 0, outputTokens = 0) {
  return Number(((inputTokens / 1_000_000) * 0.25 + (outputTokens / 1_000_000) * 2).toFixed(6))
}

export function estimateImageCostUsd() {
  return Number(process.env.OPENAI_IMAGE_COST_USD ?? '0.04')
}
