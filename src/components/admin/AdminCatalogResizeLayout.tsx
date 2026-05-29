'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

const STORAGE_KEY = 'admin-catalog-editor-width'
const DEFAULT_WIDTH = 480
const MIN_EDITOR_WIDTH = 320
const MIN_PREVIEW_WIDTH = 280
const HANDLE_WIDTH = 6

function readStoredWidth(storageKey: string) {
  if (typeof window === 'undefined') return DEFAULT_WIDTH
  const stored = window.localStorage.getItem(storageKey)
  if (!stored) return DEFAULT_WIDTH
  const parsed = Number(stored)
  return Number.isFinite(parsed) ? parsed : DEFAULT_WIDTH
}

function clampWidth(width: number, maxWidth: number) {
  return Math.min(Math.max(width, MIN_EDITOR_WIDTH), maxWidth)
}

export function AdminCatalogResizeLayout({
  list,
  editor,
  preview,
  storageKey = STORAGE_KEY,
}: {
  list: ReactNode
  editor: ReactNode
  preview: ReactNode
  storageKey?: string
}) {
  const layoutRef = useRef<HTMLDivElement>(null)
  const [editorWidth, setEditorWidth] = useState(() => readStoredWidth(storageKey))
  const [isResizing, setIsResizing] = useState(false)
  const dragRef = useRef<{ startX: number; startWidth: number; maxWidth: number } | null>(null)

  const getMaxEditorWidth = useCallback(() => {
    const layout = layoutRef.current
    if (!layout) return 900
    const listEl = layout.firstElementChild as HTMLElement | null
    const listWidth = listEl?.getBoundingClientRect().width ?? 360
    const layoutWidth = layout.getBoundingClientRect().width
    return Math.max(MIN_EDITOR_WIDTH, layoutWidth - listWidth - MIN_PREVIEW_WIDTH - HANDLE_WIDTH)
  }, [])

  useEffect(() => {
    window.localStorage.setItem(storageKey, String(editorWidth))
  }, [editorWidth, storageKey])

  useEffect(() => {
    setEditorWidth((width) => clampWidth(width, getMaxEditorWidth()))
  }, [getMaxEditorWidth])

  useEffect(() => {
    const onResize = () => {
      setEditorWidth((width) => clampWidth(width, getMaxEditorWidth()))
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [getMaxEditorWidth])

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault()
      dragRef.current = {
        startX: event.clientX,
        startWidth: editorWidth,
        maxWidth: getMaxEditorWidth(),
      }
      setIsResizing(true)
      event.currentTarget.setPointerCapture(event.pointerId)
    },
    [editorWidth, getMaxEditorWidth],
  )

  const onPointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return
    const delta = event.clientX - dragRef.current.startX
    setEditorWidth(clampWidth(dragRef.current.startWidth + delta, dragRef.current.maxWidth))
  }, [])

  const endResize = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return
    dragRef.current = null
    setIsResizing(false)
    event.currentTarget.releasePointerCapture(event.pointerId)
  }, [])

  return (
    <div ref={layoutRef} className={`admin-catalog-layout${isResizing ? ' is-resizing' : ''}`}>
      {list}
      <main className="admin-editor-panel admin-editor-panel-resizable" style={{ width: editorWidth }}>
        {editor}
      </main>
      <div
        className="admin-catalog-resize-handle"
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize editor panel"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endResize}
        onPointerCancel={endResize}
      />
      <aside className="admin-preview-rail admin-preview-rail-flex">{preview}</aside>
    </div>
  )
}
