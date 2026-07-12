# ALRIP — Agent Liquidity & Risk Intelligence Platform

A **real-time liquidity forecasting and anomaly detection system** for multi-provider MFS (Mobile Financial Service) transactions in Bangladesh. Built with Next.js 16, Neon PostgreSQL, Better Auth, and OpenAI GPT-4o.

---

## 🎯 Overview

**ALRIP** analyzes field-agent transaction data across **bKash**, **Nagad**, and **Rocket** to:

- **Forecast physical cash exhaustion** in real-time using a deterministic 15-minute rolling window
- **Identify liquidity risks** before they become operational crises
- **Detect unusual activity patterns** without using stigmatizing language like "Fraud" or "Scam"
- **Secure multi-user access** with Better Auth email+password authentication
- **Persist all analysis results** to Neon PostgreSQL, scoped per authenticated user

All AI analysis follows **strict Bengali language safety rules** — no automatic blocking, no financial action recommendations, only human-review suggestions.

---

## 🏗️ Architecture

See **[ARCHITECTURE.md](./ARCHITECTURE.md)** for detailed system diagrams, data models, and request flows.

---

## 🚀 Features

### Live Liquidity Forecast

- **Automatic calculation** every 1.5 seconds when balances or transactions change
- **15-minute rolling window** of successful transactions
- **Depletion rate** in BDT per minute based on Cash Out activity
- **Projected exhaustion** in minutes and estimated wall-clock time
- **Provider attribution** — identifies which provider is driving the cash drain

### AI-Powered Analysis

- **OpenAI GPT-4o** integration with server-side API key (no user exposure)
- **Strict safety rules** enforced in system prompt (no "Fraud"/"Scam", confidence scores, Bengali messaging)
- **Forecast evidence** passed to AI for quantitative analysis context

### Multi-User Authentication & Persistence

- **Better Auth** with email + password authentication
- **User-scoped analysis history** — each user sees only their own results
- **Neon PostgreSQL** with per-user `userId` scoping on every query
- **LocalStorage fallback** — offline history for unsigned-in users

### Transaction & Balance Tracking

- **Automatic balance updates** when transactions are added/edited/deleted
- **Success-status filtering** — only "Success" transactions affect projections
- **Timestamps on transactions** — enables 15-minute rolling window calculations
- **Provider-specific e-money** — separate balance cards for bKash, Nagad, Rocket

---

## 📋 Environment Variables

Create a `.env.development.local` file (or set in Vercel) with:

```
OPENAI_API_KEY=sk-...
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=...
```

See `.env.example` for a template.

---

## 🛠️ Setup & Installation

### Prerequisites

- **Node.js 18+** & **pnpm**
- **Neon PostgreSQL** account
- **OpenAI API key**

### Local Development

```bash
git clone https://github.com/Fahim05022003/liquidity-risk-analysis.git
cd liquidity-risk-analysis

pnpm install

# Copy and edit .env.example to .env.development.local
cp .env.example .env.development.local

# Start dev server
pnpm dev

# Open http://localhost:3000
```

### Type-Check & Lint

```bash
pnpm tsc --noEmit
pnpm build
```

---

## 📊 Usage

1. **Balance Cards** — Edit balances inline
2. **Transaction Form** — Add/edit transactions (provider, type, amount, status)
3. **Live Forecast** — Real-time alert showing projected cash exhaustion
4. **Risk Gauge** — Visual severity indicator (green/orange/red)
5. **Alert Panel** — Bengali explanation, evidence, and action
6. **Analyze Now** — Trigger OpenAI deep analysis
7. **History Drawer** — Browse past 20 analyses
8. **Sign-In** — Email + password for persistent, user-scoped storage

---

## 🔒 Security & Safety

### No User API Keys

- `OPENAI_API_KEY` is **server-side only**
- All AI calls proxied through `/api/analyze` with server credentials

### Strict AI Safety Rules

- NEVER use "Fraud", "Scam" language
- NO automatic blocking or financial action recommendations
- ALWAYS provide `confidence_score` (0-100) with reasoning
- Response MUST be valid JSON with all required keys
- `message_bn` in CLEAR BENGALI language

### Data Protection

- Better Auth manages password hashing & sessions
- Neon PostgreSQL stores data with encryption at rest
- Per-user scoping in all server actions
- HTTPS only in production

---

## 📦 Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript |
| **Styling** | Tailwind CSS v4, shadcn/ui |
| **Backend** | Next.js API routes, Server Actions |
| **Database** | Neon PostgreSQL, Drizzle ORM |
| **Auth** | Better Auth |
| **AI** | OpenAI GPT-4o |
| **Hosting** | Vercel |

---

## 🚢 Deployment

### Deploy to Vercel

```bash
git push origin v0/gazifahim78-2416-7d8ed7d7

# On vercel.com: add environment variables:
# - OPENAI_API_KEY
# - DATABASE_URL
# - BETTER_AUTH_SECRET
```

### Production Checklist

- [ ] Environment variables set
- [ ] `DATABASE_URL` points to production Neon
- [ ] `BETTER_AUTH_SECRET` is strong (≥32 chars)
- [ ] `OPENAI_API_KEY` has sufficient quota
- [ ] Database backups configured

---

## 📞 Support

For issues or questions, please open a GitHub issue.

---

**Built for field agents managing liquidity across Bangladesh's MFS ecosystem.**
