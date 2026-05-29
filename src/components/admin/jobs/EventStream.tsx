'use client'

import { useEffect, useRef, useState } from 'react'
import type { Doc } from '#convex/_generated/dataModel'
import { EVENT_COLOR, isoTime } from '#/lib/adminJobsUi'
import { MonoLabel } from './primitives'

export function EventStream({ events, isLive }: { events: Array<Doc<'generationEvents'>>; isLive: boolean }) {
  const tailRef = useRef<HTMLDivElement>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    tailRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [events.length, events.at(-1)?._id])

  return (
    <div className="admin-event-stream">
      <div className="admin-terminal-chrome">
        <span className="admin-terminal-dot red" />
        <span className="admin-terminal-dot yellow" />
        <span className="admin-terminal-dot green" />
        <MonoLabel>events</MonoLabel>
        {isLive ? <span className="admin-streaming-badge">streaming</span> : null}
      </div>
      <div className="admin-event-rows">
        {events.length === 0 ? (
          <p className="admin-empty-state">No events yet.</p>
        ) : (
          events.map((event) => (
            <div key={event._id}>
              <div className="admin-event-row">
                <span className="admin-event-time">{isoTime(event.createdAt)}</span>
                <span
                  style={{
                    color: EVENT_COLOR[event.type] ?? 'var(--admin-ink-3)',
                  }}
                >
                  {event.type}
                </span>
                <span className="admin-event-msg">{event.message}</span>
                {event.metadata ? (
                  <button
                    type="button"
                    className="admin-event-meta-btn"
                    onClick={() => setExpanded(expanded === event._id ? null : event._id)}
                  >
                    {expanded === event._id ? 'hide' : 'meta'}
                  </button>
                ) : null}
              </div>
              {expanded === event._id && event.metadata ? (
                <pre className="admin-event-meta">{JSON.stringify(event.metadata, null, 2)}</pre>
              ) : null}
            </div>
          ))
        )}
        <div ref={tailRef} />
      </div>
    </div>
  )
}
