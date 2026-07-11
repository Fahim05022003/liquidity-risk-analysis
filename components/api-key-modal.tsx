'use client'

import { useState } from 'react'
import { KeyRound, X, Eye, EyeOff, ShieldCheck } from 'lucide-react'

interface ApiKeyModalProps {
  open: boolean
  currentKey: string
  onSave: (key: string) => void
  onClose: () => void
}

export function ApiKeyModal({ open, currentKey, onSave, onClose }: ApiKeyModalProps) {
  const [value, setValue] = useState(currentKey)
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')

  function handleSave() {
    const trimmed = value.trim()
    if (!trimmed.startsWith('sk-')) {
      setError('OpenAI API keys must start with "sk-".')
      return
    }
    if (trimmed.length < 40) {
      setError('The key looks too short. Please check it.')
      return
    }
    setError('')
    onSave(trimmed)
    onClose()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') onClose()
    if (e.key === 'Enter') handleSave()
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Set OpenAI API Key"
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 text-primary">
              <KeyRound size={18} />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">OpenAI API Key</p>
              <p className="text-xs text-muted-foreground">এনক্রিপ্ট করা হয় না — শুধু এই ব্রাউজারে সংরক্ষিত</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-7 h-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 flex gap-2">
            <ShieldCheck size={14} className="text-primary mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your key is stored only in your browser&apos;s localStorage and is sent directly to the server for each analysis request. It is never logged or stored server-side.
            </p>
          </div>

          <div>
            <label htmlFor="apikey-input" className="block text-xs font-medium text-muted-foreground mb-1.5">
              API Key
            </label>
            <div className="relative">
              <input
                id="apikey-input"
                type={show ? 'text' : 'password'}
                value={value}
                onChange={(e) => { setValue(e.target.value); setError('') }}
                placeholder="sk-..."
                autoComplete="off"
                className="w-full rounded-lg border border-border bg-muted px-3 py-2.5 pr-10 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={show ? 'Hide key' : 'Show key'}
              >
                {show ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {error && <p className="mt-1.5 text-xs text-[color:var(--severity-high)]">{error}</p>}
          </div>

          <p className="text-[11px] text-muted-foreground/60">
            Get your key from{' '}
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              platform.openai.com/api-keys
            </a>
          </p>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-muted-foreground bg-muted hover:bg-muted/80 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Save Key
          </button>
        </div>
      </div>
    </div>
  )
}
