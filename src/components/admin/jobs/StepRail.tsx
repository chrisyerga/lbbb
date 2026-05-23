import type { Doc } from '#convex/_generated/dataModel'
import { STEPS, deriveStepState } from '#/lib/adminJobsUi'

export function StepRail({
  job,
  hasTextCost,
  imageCostCount,
  hasDraft,
  eventTypes,
}: {
  job: Doc<'generationJobs'>
  hasTextCost: boolean
  imageCostCount: number
  hasDraft: boolean
  eventTypes: Array<string>
}) {
  const { done, current } = deriveStepState({
    status: job.status,
    operation: job.operation,
    hasTextCost,
    imageCostCount,
    hasDraft,
    eventTypes,
  })

  return (
    <div className="admin-step-rail">
      {STEPS.map((step, i) => {
        const isDone = done.has(step.id)
        const isCurrent = current === step.id
        return (
          <div key={step.id} style={{ display: 'flex', alignItems: 'center' }}>
            {i > 0 ? <span className="admin-step-connector" /> : null}
            <div
              className={[
                'admin-step',
                isDone ? 'is-done' : '',
                isCurrent ? 'is-current' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <span className="admin-step-dot" />
              <span className="admin-step-label">{step.label}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
