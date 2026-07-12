'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { Activity, Eye, EyeOff } from 'lucide-react'

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const isSignUp = mode === 'sign-up'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = isSignUp
      ? await authClient.signUp.email({ email, password, name })
      : await authClient.signIn.email({ email, password })

    setLoading(false)

    if (error) {
      setError(error.message ?? 'Something went wrong')
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 font-sans">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary">
            <Activity size={20} />
          </span>
          <div>
            <p className="text-base font-bold text-foreground leading-none">ALRIP</p>
            <p className="text-[11px] text-muted-foreground leading-none mt-0.5">
              Liquidity &amp; Risk Intelligence
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xl shadow-black/20">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-foreground text-balance">
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isSignUp
                ? 'Sign up to save your analysis history to the cloud.'
                : 'Sign in to access your saved analysis history.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {isSignUp && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="name" className="text-xs font-medium text-foreground">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                  placeholder="Md. Rahim Uddin"
                  className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs font-medium text-foreground">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="agent@example.com"
                className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-xs font-medium text-foreground">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  placeholder="Minimum 8 characters"
                  className="w-full rounded-lg border border-border bg-input px-3 py-2 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-lg border border-[color:var(--severity-high)]/40 bg-[color:var(--severity-high)]/5 px-3 py-2 text-xs text-[color:var(--severity-high)]"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20 active:scale-95 mt-1"
            >
              {loading
                ? 'Please wait...'
                : isSignUp
                  ? 'Create Account'
                  : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-sm text-muted-foreground text-center mt-5">
          {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          <Link
            href={isSignUp ? '/sign-in' : '/sign-up'}
            className="text-primary font-medium hover:underline underline-offset-4"
          >
            {isSignUp ? 'Sign in' : 'Sign up'}
          </Link>
        </p>
      </div>
    </main>
  )
}
