# ALRIP Architecture & System Design

---

## System Architecture Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        UI["Dashboard UI<br/>React 19 + Next.js 16"]
        RiskGauge["Risk Gauge & Alert Panel"]
        TransactionForm["Transaction Form<br/>+ Balance Cards"]
    end

    subgraph "Frontend Logic"
        Forecast["Liquidity Forecast Engine<br/>lib/liquidity-forecast.ts<br/>15-min rolling window"]
        Debounce["Debounce & Auto-trigger<br/>1.5 seconds"]
    end

    subgraph "Backend & API Layer"
        API["Analyze API Route<br/>/api/analyze"]
        OpenAI["OpenAI GPT-4o<br/>AI Analysis"]
        Auth["Better Auth Handler<br/>/api/auth/[...all]"]
        ServerActions["Server Actions<br/>app/actions/analysis.ts"]
    end

    subgraph "Data Persistence"
        Neon["Neon PostgreSQL"]
        Tables["user | session | account<br/>verification | analysis_results"]
    end

    UI --> Forecast
    Forecast --> Debounce
    Debounce --> API
    API -->|forecast evidence| OpenAI
    ServerActions -->|saveAnalysisResult| Neon
    Auth -->|Better Auth tables| Neon
    RiskGauge -.->|displays| Forecast
    TransactionForm --> Forecast

    Neon --> Tables
```

---

## Request Flow: Analyze Endpoint

```mermaid
sequenceDiagram
    participant Client as Browser Client
    participant Forecast as Forecast Engine
    participant API as /api/analyze
    participant OpenAI as GPT-4o
    participant Neon as Neon DB

    Client->>Forecast: Transaction/balance change detected
    Forecast->>Forecast: Calculate depletion rate<br/>per minute
    Forecast->>Forecast: Estimate cash exhaustion<br/>in minutes
    Forecast->>Forecast: Identify dominant provider<br/>& % contribution
    Client->>API: POST /api/analyze<br/>(balances, transactions, forecast)
    API->>OpenAI: Send forecast evidence<br/>+ transaction data<br/>+ safety rules
    OpenAI-->>API: Return AnalysisResult<br/>(alert_type, severity,<br/>message_bn, confidence_score)
    API->>API: Preserve forecast metadata<br/>(projected_exhaustion_at,<br/>dominant_provider_share)
    API-->>Client: Return full AnalysisResult
    Client->>Client: Display in Alert Panel<br/>+ Update Risk Gauge
    Note over Client: If user is signed in,<br/>fire-and-forget save
    Client->>Neon: saveAnalysisResult(userId)<br/>with forecast evidence
```

---

## Authentication & Session Flow

```mermaid
graph LR
    A["User at /sign-in<br/>or /sign-up"] -->|email + password| B["authClient.signIn.email<br/>or signUp.email"]
    B -->|POST /api/auth/signin<br/>or /api/auth/signup| C["Better Auth Handler"]
    C -->|Verify password<br/>hash with argon2| D["Neon: Check account<br/>or create new user"]
    D -->|Session valid| E["Neon: Insert into<br/>session table"]
    E -->|Set-Cookie<br/>session token| F["Browser stores<br/>session token"]
    F -->|useSession hook<br/>on mount| G["Protected Dashboard<br/>/page.tsx"]
    G -->|Session data<br/>available| H["User-scoped<br/>operations"]
    H -->|Sign Out| I["signOut()"]
    I -->|POST /api/auth/signout| C
    C -->|Delete from session| E
```

---

## Data Model & ER Diagram

```mermaid
erDiagram
    USER ||--o{ SESSION : has
    USER ||--o{ ACCOUNT : "email+password"
    USER ||--o{ VERIFICATION : "email verify"
    USER ||--o{ ANALYSIS_RESULTS : owns
    
    USER {
        text id PK "UUID or custom"
        text name
        text email UK
        boolean emailVerified
        text image
        timestamp createdAt
        timestamp updatedAt
    }
    
    SESSION {
        text id PK
        timestamp expiresAt
        text token UK
        timestamp createdAt
        text ipAddress
        text userAgent
        text userId FK
    }
    
    ACCOUNT {
        text id PK
        text accountId
        text providerId
        text userId FK
        text password "hashed"
        timestamp createdAt
    }
    
    VERIFICATION {
        text id PK
        text identifier
        text value
        timestamp expiresAt
    }
    
    ANALYSIS_RESULTS {
        serial id PK
        text userId FK
        text alertType "Liquidity/Anomaly/Normal"
        text severity "High/Medium/Low"
        integer confidenceScore "0-100"
        text messageBn "Bengali message"
        text evidence "English evidence"
        text recommendedAction
        integer physicalCash
        integer bkashBalance
        integer nagadBalance
        integer rocketBalance
        jsonb transactions "full tx array"
        integer projected_exhaustion_minutes
        text projected_exhaustion_at
        text dominant_provider "bKash/Nagad/Rocket"
        integer dominant_provider_share "0-100"
        timestamp createdAt
    }
```

---

## Liquidity Forecast Algorithm

### Input
- **Current balances**: Physical Cash, bKash, Nagad, Rocket
- **Recent transactions**: Last 15 minutes of successful transactions with timestamps

### Processing

1. **Filter successful transactions** from the last 15 minutes (900 seconds)
   ```
   successful_txs = transactions.filter(
     tx => tx.status === 'Success' && 
           now - tx.timestamp <= 15 * 60 * 1000
   )
   ```

2. **Calculate per-provider cash drain**
   ```
   for each provider in [bKash, Nagad, Rocket]:
     provider_drain = sum of 'Cash Out' amounts from that provider
   ```

3. **Calculate depletion rate** (BDT per minute)
   ```
   total_drain = sum of all provider drains
   time_window_minutes = 15
   rate_per_minute = total_drain / time_window_minutes
   ```

4. **Project exhaustion time**
   ```
   if rate_per_minute > 0:
     minutes_to_exhaustion = physicalCash / rate_per_minute
     exhaustion_time = now + (minutes_to_exhaustion * 60 seconds)
   else:
     minutes_to_exhaustion = Infinity (no drain detected)
   ```

5. **Identify dominant provider**
   ```
   dominant_provider = provider with highest Cash Out amount
   dominant_share = (provider_drain / total_drain) * 100
   ```

6. **Determine severity**
   ```
   if minutes_to_exhaustion < 30:
     severity = "High"
   elif minutes_to_exhaustion < 60:
     severity = "Medium"
   else:
     severity = "Low"
   ```

### Output

```typescript
{
  alert_type: "Liquidity",
  severity: "High" | "Medium" | "Low",
  confidence_score: 90, // high confidence, deterministic calculation
  message_bn: "...", // from AI if available
  evidence: "...",
  recommended_action: "...",
  projected_exhaustion_minutes: 5,
  projected_exhaustion_at: "2024-01-01T12:35:00Z",
  dominant_provider: "bKash",
  dominant_provider_share: 85,
  forecast_rate_per_minute: 5000,
  source: "live_forecast"
}
```

---

## File Structure

```
liquidity-risk-analysis/
├── app/
│   ├── layout.tsx                    # Root layout with fonts & global theme
│   ├── page.tsx                      # Main dashboard (1000+ lines with all logic)
│   ├── globals.css                   # Tailwind v4, design tokens, dark theme
│   ├── api/
│   │   ├── analyze/
│   │   │   └── route.ts              # POST /api/analyze (OpenAI proxy)
│   │   └── auth/
│   │       └── [...all]/
│   │           └── route.ts          # Better Auth handler
│   ├── actions/
│   │   └── analysis.ts               # Server actions for DB persistence
│   ├── sign-in/
│   │   └── page.tsx                  # Sign-in page
│   └── sign-up/
│       └── page.tsx                  # Sign-up page
├── components/
│   ├── balance-cards.tsx             # Editable balance display
│   ├── transaction-form.tsx          # Add/edit/delete transactions
│   ├── transaction-table.tsx         # Transaction history table (if separate)
│   ├── risk-gauge.tsx                # SVG gauge chart
│   ├── alert-panel.tsx               # Alert display with forecast metrics
│   ├── history-drawer.tsx            # Browse past analyses
│   ├── api-key-modal.tsx             # (Removed, no longer needed)
│   └── auth-form.tsx                 # Shared sign-in/sign-up form
├── lib/
│   ├── types.ts                      # TypeScript interfaces
│   ├── auth.ts                       # Better Auth server config
│   ├── auth-client.ts                # Better Auth React client
│   ├── db/
│   │   ├── index.ts                  # Drizzle + Pool setup
│   │   └── schema.ts                 # Drizzle ORM table definitions
│   └── liquidity-forecast.ts         # Forecast engine (deterministic)
├── .env.example                      # Safe template for env vars
├── README.md                         # Project overview
├── ARCHITECTURE.md                   # This file
├── package.json                      # Dependencies
├── tsconfig.json                     # TypeScript config
├── next.config.js                    # Next.js config (Turbopack default)
└── tailwind.config.ts                # Tailwind v4 theme config
```

---

## Key Components

### Forecast Engine (`lib/liquidity-forecast.ts`)

- **Deterministic** — no randomness, reproducible results
- **Fast** — O(n) where n = number of transactions
- **Flexible** — accepts arbitrary time windows (default 15 minutes)
- **Severity-aware** — maps exhaustion time to High/Medium/Low severity

### API Route (`app/api/analyze/route.ts`)

- **Server-side API key** — `OPENAI_API_KEY` never exposed to client
- **Forecast evidence** — passes deterministic forecast to GPT-4o as context
- **Safety prompt** — enforces strict Bengali language rules
- **Metadata preservation** — keeps forecast output in response for UI display

### Server Actions (`app/actions/analysis.ts`)

- **User-scoped queries** — every operation includes `userId` filter
- **No RLS** — manual per-query scoping via `getUserId()` helper
- **Fire-and-forget** — saves don't block UI
- **Error handling** — gracefully handles DB/auth failures

### Dashboard (`app/page.tsx`)

- **Live forecast** — auto-updates every 1.5 seconds (debounced)
- **Transaction tracking** — automatic balance updates
- **History management** — localStorage fallback + Neon persistence
- **Session awareness** — displays user info, handles sign-out

---

## Deployment & Environment

### Vercel Deployment

- **Zero-config** — v0 defaults to Vercel
- **Auto-SSL** — HTTPS enforced
- **Edge functions** — API routes run on edge for low latency
- **Environment variables** — set via Vercel dashboard

### Neon Database

- **Serverless PostgreSQL** — auto-scales, always available
- **Automatic backups** — daily backups retained 7 days
- **Connection pooling** — PgBouncer enabled
- **RLS not used** — manual per-query scoping instead

---

## API Contracts

### POST /api/analyze

**Request:**
```typescript
{
  balances: {
    physicalCash: number,
    bkashBalance: number,
    nagadBalance: number,
    rocketBalance: number
  },
  transactions: Array<{
    provider: "bKash" | "Nagad" | "Rocket",
    type: "Cash Out" | "Cash In" | "Send Money",
    amount: number,
    status: "Success" | "Pending" | "Failed",
    timestamp?: number
  }>,
  forecast?: AnalysisResult  // optional, for context
}
```

**Response:**
```typescript
{
  alert_type: "Liquidity" | "Anomaly" | "Normal",
  severity: "High" | "Medium" | "Low",
  confidence_score: number,  // 0-100
  message_bn: string,        // Bengali explanation
  evidence: string,          // English rationale
  recommended_action: string,
  projected_exhaustion_minutes?: number,
  projected_exhaustion_at?: string,
  dominant_provider?: string,
  dominant_provider_share?: number,
  source: "live_forecast" | "ai_analysis"
}
```

### Server Actions

- `saveAnalysisResult(input, result)` — saves analysis + forecast to `analysis_results` table
- `getAnalysisHistory()` — retrieves user's past analyses from `analysis_results` table

---

## Performance Considerations

- **Forecast calculation** — O(n) per balance/transaction change, debounced 1.5s to avoid thrashing
- **API calls** — debounced; one call every 1.5s max
- **Database queries** — indexed on `userId` + `createdAt` for history retrieval
- **LocalStorage** — limited to 20 entries to avoid bloat
- **React re-renders** — memoized components prevent unnecessary updates

---

## Future Enhancements

- [ ] Multi-language support (Bengali + English UI options)
- [ ] Email alerts when high-severity forecast is triggered
- [ ] Webhook integrations for external monitoring systems
- [ ] Analytics dashboard (trending patterns, agent performance)
- [ ] API rate limiting per user
- [ ] Scheduled batch analyses for retrospective reports
- [ ] Mobile app for field officers

---

## Testing

- **Type-safety** — `pnpm tsc --noEmit` validates all TypeScript
- **Manual browser testing** — verify forecast + AI analysis in real time
- **Production simulation** — `pnpm build && pnpm start` locally

---

## Security Notes

1. **No localStorage for secrets** — only analysis history
2. **Server-side OpenAI key** — never in client bundles
3. **Better Auth sessions** — httpOnly cookies + CSRF protection
4. **SQL injection prevention** — Drizzle parameterized queries
5. **CORS headers** — API routes specify appropriate origins
6. **Rate limiting** — (future enhancement) limit requests per user

