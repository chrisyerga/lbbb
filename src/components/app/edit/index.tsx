'use client'

import type { CSSProperties, ReactNode } from 'react'
import { useState } from 'react'
import { IconCheck, IconPencil } from '#/components/app/icons'
import { StickerBtn } from '#/components/landing/primitives/StickerBtn'
import { cn } from '#/lib/utils'

export type PickerOption = {
  value: string
  label: string
  color?: string
  node?: ReactNode
}

export function EditField({
  label,
  hint,
  required,
  children,
  span,
}: {
  label: string
  hint?: string
  required?: boolean
  children: ReactNode
  span?: number
}) {
  return (
    <label className="edit-field" style={{ gridColumn: span ? `span ${span}` : undefined }}>
      <span className="edit-field-label">
        <span>{label}</span>
        {required ? <span className="edit-required">*</span> : null}
        {hint ? <span className="edit-field-hint">{hint}</span> : null}
      </span>
      {children}
    </label>
  )
}

export function EditInput({
  value,
  onChange,
  placeholder,
  mono,
  prefix,
  locked,
}: {
  value: string
  onChange?: (value: string) => void
  placeholder?: string
  mono?: boolean
  prefix?: string
  locked?: boolean
}) {
  return (
    <div className={cn('edit-input-wrap', locked && 'is-locked')}>
      {prefix ? <span className="edit-input-prefix">{prefix}</span> : null}
      <input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        readOnly={locked}
        className={cn('edit-input', mono && 'is-mono')}
      />
      {locked ? <span className="edit-lock">locked</span> : null}
    </div>
  )
}

export function EditTextArea({
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="edit-textarea"
    />
  )
}

export function EditSelect({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (value: string) => void
  options: Array<PickerOption>
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="edit-select">
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

export function SegmentPicker({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (value: string) => void
  options: Array<PickerOption>
}) {
  return (
    <div className="edit-segment-picker">
      {options.map((option) => {
        const active = option.value === value
        const accent = option.color ?? 'var(--landing-primary)'
        return (
          <button
            key={option.value}
            type="button"
            className={active ? 'edit-pill is-active' : 'edit-pill'}
            style={{ '--pill-accent': accent } as CSSProperties}
            onClick={() => onChange(option.value)}
          >
            <span className="edit-pill-dot" />
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

export function ChipMultiSelect({
  values,
  onChange,
  options,
}: {
  values: Array<string>
  onChange: (values: Array<string>) => void
  options: Array<PickerOption>
}) {
  function toggle(value: string) {
    onChange(values.includes(value) ? values.filter((v) => v !== value) : [...values, value])
  }

  return (
    <div className="edit-segment-picker">
      {options.map((option) => {
        const active = values.includes(option.value)
        return (
          <button
            key={option.value}
            type="button"
            className={active ? 'edit-chip is-active' : 'edit-chip'}
            onClick={() => toggle(option.value)}
          >
            {option.node}
            {option.label}
            {active ? <span className="edit-chip-check">✓</span> : null}
          </button>
        )
      })}
    </div>
  )
}

export function TagInput({
  tags,
  onChange,
  placeholder,
}: {
  tags: Array<string>
  onChange: (tags: Array<string>) => void
  placeholder?: string
}) {
  const [input, setInput] = useState('')

  function addTag() {
    const value = input.trim().replace(/,$/, '')
    if (value && !tags.includes(value)) onChange([...tags, value])
    setInput('')
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag))
  }

  return (
    <div className="edit-tag-input">
      {tags.map((tag) => (
        <span key={tag} className="edit-tag">
          {tag}
          <button type="button" onClick={() => removeTag(tag)} aria-label={`Remove ${tag}`}>
            ×
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onBlur={addTag}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            addTag()
          }
          if (e.key === 'Backspace' && !input && tags.length) {
            removeTag(tags[tags.length - 1])
          }
        }}
        placeholder={tags.length ? 'add another...' : placeholder}
      />
    </div>
  )
}

export function PhotoSlot({
  img,
  monogram,
  accent,
  size = 140,
  label = 'photo',
}: {
  img?: string | null
  monogram: string
  accent?: string | null
  size?: number
  label?: string
}) {
  return (
    <div className="edit-photo-slot-wrap">
      <div className="edit-photo-slot" style={{ width: size, height: size, background: img ? '#fff' : (accent ?? '#F5E1B4') }}>
        {img ? <img src={img} alt="" /> : <span>{monogram.slice(0, 1).toUpperCase()}</span>}
        <div className="edit-photo-overlay">
          <IconPencil size={22} />
          <span>change</span>
        </div>
      </div>
      <span className="edit-photo-label">click or drop · {label}</span>
    </div>
  )
}

export function EditSection({
  n,
  title,
  helper,
  children,
}: {
  n: number
  title: string
  helper?: string
  children: ReactNode
}) {
  return (
    <section className="edit-section">
      <div className="edit-section-head">
        <span className="edit-section-num">0{n}</span>
        <span className="edit-section-title">{title}</span>
        {helper ? <span className="edit-section-helper">↳ {helper}</span> : null}
      </div>
      {children}
    </section>
  )
}

export type VoiceOption = {
  _id: string
  name: string
  tagline: string
  exampleExcerpt?: string
  avatarUrl?: string | null
}

export function VoicePicker({
  value,
  onChange,
  narrators,
}: {
  value: string | null
  onChange: (value: string) => void
  narrators: Array<VoiceOption>
}) {
  return (
    <div className="edit-voice-grid">
      {narrators.map((narrator) => {
        const active = narrator._id === value
        return (
          <button
            key={narrator._id}
            type="button"
            className={active ? 'edit-voice-card is-active' : 'edit-voice-card'}
            onClick={() => onChange(narrator._id)}
          >
            <span className="edit-voice-avatar">
              {narrator.avatarUrl ? <img src={narrator.avatarUrl} alt="" /> : narrator.name.slice(0, 1)}
            </span>
            <span className="edit-voice-copy">
              <span className="edit-voice-name">{narrator.name}</span>
              <span className="edit-voice-tagline">{narrator.tagline}</span>
              {narrator.exampleExcerpt ? <span className="edit-voice-example">"{narrator.exampleExcerpt}"</span> : null}
            </span>
            <span className="edit-radio">{active ? '✓' : ''}</span>
          </button>
        )
      })}
    </div>
  )
}

export type ArtStyleOption = {
  _id: string
  slug: string
  name: string
  description?: string
}

const ART_SWATCHES = ['#7AB6A0', '#F2A02E', '#D67BB0', '#5FA8E0', '#E08B5F', '#E0382E']

export function ArtStyleSwatches({
  value,
  onChange,
  styles,
}: {
  value: string | null
  onChange: (value: string) => void
  styles: Array<ArtStyleOption>
}) {
  return (
    <div className="edit-art-grid">
      {styles.map((style, index) => {
        const active = style._id === value
        const color = ART_SWATCHES[index % ART_SWATCHES.length]
        return (
          <button
            key={style._id}
            type="button"
            className={active ? 'edit-art-card is-active' : 'edit-art-card'}
            onClick={() => onChange(style._id)}
          >
            <span
              className="edit-art-swatch"
              style={{ background: `radial-gradient(circle at 30% 28%, ${color}, ${color}77 65%, #14100E)` }}
            />
            <span>{style.name}</span>
          </button>
        )
      })}
    </div>
  )
}

export function DangerZone({
  items,
}: {
  items: Array<{ label: string; helper: string; action: string; onClick?: () => void; disabled?: boolean }>
}) {
  return (
    <section className="edit-danger">
      <p className="edit-danger-kicker">↳ Danger zone</p>
      {items.map((item) => (
        <div key={item.label} className="edit-danger-row">
          <div>
            <p className="edit-danger-title">{item.label}</p>
            <p className="edit-danger-helper">{item.helper}</p>
          </div>
          <button type="button" onClick={item.onClick} disabled={item.disabled} className="edit-danger-button">
            {item.action}
          </button>
        </div>
      ))}
    </section>
  )
}

export function SaveBar({
  dirty,
  saving,
  entity = 'changes',
  onSave,
  onDiscard,
}: {
  dirty: boolean
  saving?: boolean
  entity?: string
  onSave: () => void
  onDiscard: () => void
}) {
  return (
    <div className="edit-save-bar">
      <div className="edit-save-status">
        <span className={dirty ? 'edit-save-dot is-dirty' : 'edit-save-dot'} />
        <span>{dirty ? `Unsaved ${entity}` : 'All changes saved'}</span>
      </div>
      <div className="edit-save-actions">
        {dirty ? (
          <button type="button" className="edit-discard-button" onClick={onDiscard} disabled={saving}>
            Discard
          </button>
        ) : null}
        <StickerBtn
          bg={dirty ? 'var(--landing-primary)' : '#fff'}
          color={dirty ? '#fff' : 'rgba(20,16,14,.55)'}
          size="md"
          onClick={onSave}
          disabled={!dirty || saving}
        >
          <IconCheck size={16} stroke={2.4} /> {saving ? 'Saving...' : 'Save changes'}
        </StickerBtn>
      </div>
    </div>
  )
}

export function EditTopHeader({
  breadcrumb,
  title,
  accentWord,
  photoNode,
  onBack,
}: {
  breadcrumb: string
  title: string
  accentWord: string
  photoNode?: ReactNode
  onBack: () => void
}) {
  return (
    <section className="edit-top-header">
      <button type="button" onClick={onBack} className="edit-back-button">
        ← {breadcrumb}
      </button>
      <div className="edit-top-title-row">
        {photoNode}
        <h1>
          {title} <span>{accentWord}</span>
        </h1>
      </div>
    </section>
  )
}
