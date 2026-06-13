# ReviewPilot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build ReviewPilot from scratch — an AI review monitoring and auto-response SaaS for local businesses — to a chargeable MVP.

**Architecture:** Next.js 14 App Router monorepo. API routes handle all backend logic. Business logic is isolated in `lib/` modules (Google API, LLM, alerts, Stripe) for testability. Prisma + Neon handles persistence. Clerk handles auth. Frontend uses Tailwind + shadcn/ui.

**Tech Stack:** Next.js 14, TypeScript, Prisma + Neon (Postgres), Clerk, Stripe, Anthropic SDK (Claude Haiku), Google Business Profile REST API, Resend, Tailwind CSS, shadcn/ui, Jest + ts-jest

---

## File Map

| File | Responsibility |
|------|---------------|
| `prisma/schema.prisma` | DB schema: User, Business, Review, Response, Subscription |
| `lib/db.ts` | Prisma client singleton |
| `lib/google.ts` | GBP OAuth + review fetch + response publish |
| `lib/llm.ts` | Anthropic client + response generation + tone extraction |
| `lib/alerts.ts` | 1-star review email alert via Resend |
| `lib/stripe.ts` | Stripe client + plan config |
| `lib/auth.ts` | Get or create DB user from Clerk session |
| `middleware.ts` | Clerk route protection |
| `app/api/google/connect/route.ts` | Initiate Google OAuth |
| `app/api/google/callback/route.ts` | Handle OAuth callback, store tokens |
| `app/api/reviews/route.ts` | GET reviews for authenticated business |
| `app/api/responses/route.ts` | GET draft responses |
| `app/api/responses/[id]/approve/route.ts` | Mark response approved (with optional text edit) |
| `app/api/responses/[id]/publish/route.ts` | Publish response to Google |
| `app/api/cron/sync/route.ts` | Hourly: fetch new reviews, generate responses, send alerts |
| `app/api/billing/checkout/route.ts` | Create Stripe checkout session |
| `app/api/webhooks/stripe/route.ts` | Handle subscription events |
| `app/(auth)/sign-in/[[...sign-in]]/page.tsx` | Clerk sign-in page |
| `app/(auth)/sign-up/[[...sign-up]]/page.tsx` | Clerk sign-up page |
| `app/(dashboard)/layout.tsx` | Dashboard shell with nav |
| `app/(dashboard)/reviews/page.tsx` | Review list UI |
| `app/(dashboard)/responses/page.tsx` | Response approval queue |
| `app/(dashboard)/settings/page.tsx` | Google connect + alert email + pricing |
| `app/page.tsx` | Public landing page |
| `components/ReviewCard.tsx` | Single review display with response status |
| `components/ResponseEditor.tsx` | Editable response with approve/publish actions |
| `__tests__/lib/google.test.ts` | Unit tests for Google API helpers |
| `__tests__/lib/llm.test.ts` | Unit tests for response generation |
| `__tests__/lib/alerts.test.ts` | Unit tests for alert logic |

---

## Task 1: Project Bootstrap

**Files:**
- Create: project root (`package.json`, `tsconfig.json`, `.env.local`, `.env.example`, `jest.config.ts`)

- [ ] **Step 1: Create Next.js project**

```bash
npx create-next-app@latest reviewpilot --typescript --tailwind --eslint --app --src-dir=no --import-alias="@/*"
cd reviewpilot
```

- [ ] **Step 2: Install dependencies**

```bash
npm install @clerk/nextjs @prisma/client prisma @anthropic-ai/sdk resend stripe
npm install recharts lucide-react class-variance-authority clsx tailwind-merge
npm install -D jest @types/jest ts-jest @testing-library/react @testing-library/jest-dom
npx shadcn-ui@latest init
```

When shadcn prompts: style=Default, base color=Slate, CSS variables=yes.

```bash
npx shadcn-ui@latest add button card badge input textarea table tabs
```

- [ ] **Step 3: Configure Jest**

Create `jest.config.ts`:
```typescript
import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
  testMatch: ['**/__tests__/**/*.test.ts'],
}

export default config
```

- [ ] **Step 4: Create .env.example**

Create `.env.example`:
```
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/reviews
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/reviews

# Database (Neon)
DATABASE_URL=

# Google Business Profile
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google/callback

# Anthropic
ANTHROPIC_API_KEY=

# Resend
RESEND_API_KEY=
ALERT_FROM_EMAIL=alerts@reviewpilot.app

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_PRICE_SOLO=
STRIPE_PRICE_BUSINESS=
STRIPE_PRICE_AGENCY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=
```

Copy to `.env.local` and fill in values.

- [ ] **Step 5: Commit**

```bash
git init && git add . && git commit -m "feat: bootstrap Next.js project"
```

---

## Task 2: Database Schema

**Files:**
- Create: `prisma/schema.prisma`, `lib/db.ts`

- [ ] **Step 1: Initialize Prisma**

```bash
npx prisma init --datasource-provider postgresql
```

- [ ] **Step 2: Write schema**

Replace `prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String        @id @default(cuid())
  clerkId      String        @unique
  email        String
  businesses   Business[]
  subscription Subscription?
  createdAt    DateTime      @default(now())
}

model Business {
  id               String    @id @default(cuid())
  userId           String
  user             User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  name             String
  googleLocationId String?
  googleAccountId  String?
  accessToken      String?
  refreshToken     String?
  tokenExpiresAt   DateTime?
  toneExamples     String?
  autoPublish      Boolean   @default(false)
  alertEmail       String?
  reviews          Review[]
  createdAt        DateTime  @default(now())
}

model Review {
  id             String    @id @default(cuid())
  businessId     String
  business       Business  @relation(fields: [businessId], references: [id], onDelete: Cascade)
  googleReviewId String    @unique
  authorName     String
  rating         Int
  text           String?
  publishedAt    DateTime
  response       Response?
  alertSent      Boolean   @default(false)
  createdAt      DateTime  @default(now())
}

model Response {
  id          String    @id @default(cuid())
  reviewId    String    @unique
  review      Review    @relation(fields: [reviewId], references: [id], onDelete: Cascade)
  text        String
  status      String    @default("draft")
  publishedAt DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model Subscription {
  id               String   @id @default(cuid())
  userId           String   @unique
  user             User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  stripeCustomerId String   @unique
  stripePriceId    String
  stripeSubId      String   @unique
  status           String
  plan             String
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}
```

- [ ] **Step 3: Push schema to Neon**

```bash
npx prisma db push
```

Expected: `Your database is now in sync with your Prisma schema.`

- [ ] **Step 4: Create Prisma singleton**

Create `lib/db.ts`:
```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
export const db = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
```

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma lib/db.ts && git commit -m "feat: add Prisma schema and db singleton"
```

---

## Task 3: Clerk Authentication

**Files:**
- Create: `middleware.ts`, `lib/auth.ts`, `app/(auth)/sign-in/[[...sign-in]]/page.tsx`, `app/(auth)/sign-up/[[...sign-up]]/page.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Wrap app in ClerkProvider**

Edit `app/layout.tsx`:
```typescript
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
```

- [ ] **Step 2: Add middleware**

Create `middleware.ts` at project root:
```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks/(.*)',
  '/api/cron/(.*)',
])

export default clerkMiddleware((auth, req) => {
  if (!isPublicRoute(req)) auth().protect()
})

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}
```

- [ ] **Step 3: Create auth pages**

Create `app/(auth)/sign-in/[[...sign-in]]/page.tsx`:
```typescript
import { SignIn } from '@clerk/nextjs'
export default function SignInPage() {
  return <div className="min-h-screen flex items-center justify-center"><SignIn /></div>
}
```

Create `app/(auth)/sign-up/[[...sign-up]]/page.tsx`:
```typescript
import { SignUp } from '@clerk/nextjs'
export default function SignUpPage() {
  return <div className="min-h-screen flex items-center justify-center"><SignUp /></div>
}
```

- [ ] **Step 4: Create DB user helper**

Create `lib/auth.ts`:
```typescript
import { auth, currentUser } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

export async function getDbUser() {
  const { userId } = auth()
  if (!userId) return null

  let user = await db.user.findUnique({ where: { clerkId: userId } })
  if (!user) {
    const clerkUser = await currentUser()
    if (!clerkUser) return null
    user = await db.user.create({
      data: {
        clerkId: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress ?? '',
      },
    })
  }
  return user
}
```

- [ ] **Step 5: Verify auth redirects**

```bash
npm run dev
```

Visit `http://localhost:3000/reviews` — should redirect to `/sign-in`. Create an account and confirm redirect to `/reviews` (404 is fine, page doesn't exist yet).

- [ ] **Step 6: Commit**

```bash
git add middleware.ts lib/auth.ts app/(auth) app/layout.tsx
git commit -m "feat: add Clerk auth with middleware and auth pages"
```

---

## Task 4: Google API Client

**Files:**
- Create: `lib/google.ts`, `__tests__/lib/google.test.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/lib/google.test.ts`:
```typescript
import { buildAuthUrl, exchangeCodeForTokens, fetchReviews } from '@/lib/google'

describe('buildAuthUrl', () => {
  it('returns a Google OAuth URL containing state and scope', () => {
    process.env.GOOGLE_CLIENT_ID = 'client_id'
    process.env.GOOGLE_REDIRECT_URI = 'http://localhost:3000/api/google/callback'
    const url = buildAuthUrl('test-state')
    expect(url).toContain('accounts.google.com/o/oauth2/v2/auth')
    expect(url).toContain('test-state')
    expect(url).toContain('business.manage')
  })
})

describe('exchangeCodeForTokens', () => {
  it('returns tokens on success', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'acc', refresh_token: 'ref', expires_in: 3600 }),
    })
    const result = await exchangeCodeForTokens('code')
    expect(result.accessToken).toBe('acc')
    expect(result.refreshToken).toBe('ref')
    expect(result.expiresAt).toBeInstanceOf(Date)
  })

  it('throws on failure', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({}) })
    await expect(exchangeCodeForTokens('bad')).rejects.toThrow('Token exchange failed')
  })
})

describe('fetchReviews', () => {
  it('maps Google star ratings to integers', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        reviews: [{
          reviewId: 'r1',
          reviewer: { displayName: 'Alice' },
          starRating: 'FIVE',
          comment: 'Great!',
          createTime: '2024-01-01T00:00:00Z',
        }],
      }),
    })
    const reviews = await fetchReviews('acc', 'loc', 'Bearer token')
    expect(reviews[0].rating).toBe(5)
    expect(reviews[0].authorName).toBe('Alice')
    expect(reviews[0].googleReviewId).toBe('r1')
  })
})
```

- [ ] **Step 2: Run to confirm failure**

```bash
npx jest __tests__/lib/google.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/google'`

- [ ] **Step 3: Implement Google client**

Create `lib/google.ts`:
```typescript
const STAR_TO_INT: Record<string, number> = {
  ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5,
}

export function buildAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/business.manage',
    access_type: 'offline',
    prompt: 'consent',
    state,
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}

export async function exchangeCodeForTokens(code: string) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
      grant_type: 'authorization_code',
    }),
  })
  if (!res.ok) throw new Error('Token exchange failed')
  const data = await res.json()
  return {
    accessToken: data.access_token as string,
    refreshToken: data.refresh_token as string,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  }
}

export async function refreshAccessToken(refreshToken: string) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: 'refresh_token',
    }),
  })
  if (!res.ok) throw new Error('Token refresh failed')
  const data = await res.json()
  return {
    accessToken: data.access_token as string,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  }
}

export type RawReview = {
  googleReviewId: string
  authorName: string
  rating: number
  text: string | null
  publishedAt: Date
}

export async function fetchReviews(
  accountId: string,
  locationId: string,
  bearerToken: string
): Promise<RawReview[]> {
  const res = await fetch(
    `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/reviews`,
    { headers: { Authorization: bearerToken } }
  )
  if (!res.ok) throw new Error('Failed to fetch reviews')
  const data = await res.json()
  return (data.reviews ?? []).map((r: any) => ({
    googleReviewId: r.reviewId,
    authorName: r.reviewer?.displayName ?? 'Anonymous',
    rating: STAR_TO_INT[r.starRating] ?? 0,
    text: r.comment ?? null,
    publishedAt: new Date(r.createTime),
  }))
}

export async function publishResponse(
  accountId: string,
  locationId: string,
  reviewId: string,
  comment: string,
  bearerToken: string
): Promise<void> {
  const res = await fetch(
    `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/reviews/${reviewId}/reply`,
    {
      method: 'PUT',
      headers: { Authorization: bearerToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment }),
    }
  )
  if (!res.ok) throw new Error('Failed to publish response')
}
```

- [ ] **Step 4: Run tests — confirm pass**

```bash
npx jest __tests__/lib/google.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/google.ts __tests__/lib/google.test.ts
git commit -m "feat: add Google Business Profile API client with tests"
```

---

## Task 5: Google OAuth Routes

**Files:**
- Create: `app/api/google/connect/route.ts`, `app/api/google/callback/route.ts`

- [ ] **Step 1: Create connect route**

Create `app/api/google/connect/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import { getDbUser } from '@/lib/auth'
import { buildAuthUrl } from '@/lib/google'

export async function GET() {
  const user = await getDbUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const state = Buffer.from(JSON.stringify({ userId: user.id })).toString('base64')
  return NextResponse.redirect(buildAuthUrl(state))
}
```

- [ ] **Step 2: Create callback route**

Create `app/api/google/callback/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForTokens } from '@/lib/google'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  if (!code || !state) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=google_denied`)
  }

  const { userId } = JSON.parse(Buffer.from(state, 'base64').toString())
  const tokens = await exchangeCodeForTokens(code)

  const existing = await db.business.findFirst({ where: { userId } })
  if (existing) {
    await db.business.update({
      where: { id: existing.id },
      data: { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, tokenExpiresAt: tokens.expiresAt },
    })
  } else {
    await db.business.create({
      data: {
        userId,
        name: 'My Business',
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenExpiresAt: tokens.expiresAt,
      },
    })
  }

  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?success=connected`)
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/google/
git commit -m "feat: add Google OAuth connect and callback routes"
```

---

## Task 6: LLM Response Generator

**Files:**
- Create: `lib/llm.ts`, `__tests__/lib/llm.test.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/lib/llm.test.ts`:
```typescript
const mockCreate = jest.fn()
jest.mock('@anthropic-ai/sdk', () => ({
  default: jest.fn().mockImplementation(() => ({
    messages: { create: mockCreate },
  })),
}))

import { generateResponse, extractToneProfile } from '@/lib/llm'

describe('generateResponse', () => {
  it('calls Haiku and returns response text', async () => {
    mockCreate.mockResolvedValue({ content: [{ type: 'text', text: 'Thank you, Alice!' }] })
    const result = await generateResponse({
      authorName: 'Alice', rating: 5, text: 'Great food!',
      businessName: 'Mario Pizzeria', toneExamples: null,
    })
    expect(result).toBe('Thank you, Alice!')
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ model: expect.stringContaining('haiku') })
    )
  })

  it('handles reviews with no text', async () => {
    mockCreate.mockResolvedValue({ content: [{ type: 'text', text: 'Thanks for the rating!' }] })
    const result = await generateResponse({
      authorName: 'Bob', rating: 4, text: null,
      businessName: 'Test Biz', toneExamples: null,
    })
    expect(typeof result).toBe('string')
  })
})

describe('extractToneProfile', () => {
  it('returns JSON string with style key', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: JSON.stringify({ style: 'warm', formality: 'casual' }) }],
    })
    const result = await extractToneProfile(['Thanks so much!', 'We loved having you!'])
    expect(JSON.parse(result)).toHaveProperty('style')
  })
})
```

- [ ] **Step 2: Run to confirm failure**

```bash
npx jest __tests__/lib/llm.test.ts
```

Expected: FAIL

- [ ] **Step 3: Implement LLM client**

Create `lib/llm.ts`:
```typescript
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

type GenerateParams = {
  authorName: string
  rating: number
  text: string | null
  businessName: string
  toneExamples: string | null
}

export async function generateResponse(params: GenerateParams): Promise<string> {
  const { authorName, rating, text, businessName, toneExamples } = params
  const toneSection = toneExamples ? `\n\nTone examples:\n${toneExamples}` : ''
  const prompt = `Write a review response for "${businessName}".
Customer: ${authorName} | Rating: ${rating}/5
Review: ${text ?? '(rating only)'}${toneSection}

Write 2-4 sentences. Be genuine, address the customer by name. Output ONLY the response text.`

  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    messages: [{ role: 'user', content: prompt }],
  })

  const block = msg.content[0]
  if (block.type !== 'text') throw new Error('Unexpected response type')
  return block.text.trim()
}

export async function extractToneProfile(examples: string[]): Promise<string> {
  const prompt = `Analyze these review responses and return ONLY a JSON object with keys: style, formality ("formal"|"casual"), emoji_usage (boolean), signature (string|null).

Examples:
${examples.map((e, i) => `${i + 1}. ${e}`).join('\n')}`

  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    messages: [{ role: 'user', content: prompt }],
  })

  const block = msg.content[0]
  if (block.type !== 'text') throw new Error('Unexpected response type')
  return block.text.trim()
}
```

- [ ] **Step 4: Run tests — confirm pass**

```bash
npx jest __tests__/lib/llm.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/llm.ts __tests__/lib/llm.test.ts
git commit -m "feat: add LLM response generator with tests"
```

---

## Task 7: Alert System

**Files:**
- Create: `lib/alerts.ts`, `__tests__/lib/alerts.test.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/lib/alerts.test.ts`:
```typescript
const mockSend = jest.fn()
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({ emails: { send: mockSend } })),
}))

import { sendLowRatingAlert } from '@/lib/alerts'

beforeEach(() => mockSend.mockClear())

describe('sendLowRatingAlert', () => {
  it('sends email for 1-star review', async () => {
    mockSend.mockResolvedValue({ id: 'email_1' })
    await sendLowRatingAlert({
      toEmail: 'owner@test.com', businessName: 'Test Biz',
      authorName: 'Dave', rating: 1, reviewText: 'Awful.', reviewId: 'r1',
    })
    expect(mockSend).toHaveBeenCalledTimes(1)
    const call = mockSend.mock.calls[0][0]
    expect(call.to).toBe('owner@test.com')
    expect(call.subject).toContain('1-star')
    expect(call.html).toContain('Dave')
  })

  it('does not send for ratings above 1', async () => {
    await sendLowRatingAlert({
      toEmail: 'owner@test.com', businessName: 'Test Biz',
      authorName: 'Dave', rating: 2, reviewText: 'Meh.', reviewId: 'r2',
    })
    expect(mockSend).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run to confirm failure**

```bash
npx jest __tests__/lib/alerts.test.ts
```

Expected: FAIL

- [ ] **Step 3: Implement alert service**

Create `lib/alerts.ts`:
```typescript
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

type AlertParams = {
  toEmail: string
  businessName: string
  authorName: string
  rating: number
  reviewText: string | null
  reviewId: string
}

export async function sendLowRatingAlert(params: AlertParams): Promise<void> {
  if (params.rating > 1) return

  await resend.emails.send({
    from: process.env.ALERT_FROM_EMAIL!,
    to: params.toEmail,
    subject: `Urgent: ${params.rating}-star review for ${params.businessName}`,
    html: `
      <h2>Low Rating Alert — ${params.businessName}</h2>
      <p><strong>${params.authorName}</strong> left a <strong>${params.rating}-star</strong> review:</p>
      <blockquote style="border-left:3px solid #e53e3e;padding-left:12px;color:#555">
        ${params.reviewText ?? '(No text)'}
      </blockquote>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/responses?review=${params.reviewId}"
         style="background:#2563eb;color:white;padding:10px 20px;border-radius:6px;text-decoration:none">
        Respond Now
      </a>
    `,
  })
}
```

- [ ] **Step 4: Run tests — confirm pass**

```bash
npx jest __tests__/lib/alerts.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/alerts.ts __tests__/lib/alerts.test.ts
git commit -m "feat: add low-rating email alert with tests"
```

---

## Task 8: Cron Sync Job

**Files:**
- Create: `app/api/cron/sync/route.ts`, `vercel.json`

- [ ] **Step 1: Create sync route**

Create `app/api/cron/sync/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { fetchReviews, refreshAccessToken } from '@/lib/google'
import { generateResponse } from '@/lib/llm'
import { sendLowRatingAlert } from '@/lib/alerts'

export async function GET(req: NextRequest) {
  if (req.headers.get('x-cron-secret') !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const businesses = await db.business.findMany({
    where: { googleLocationId: { not: null }, googleAccountId: { not: null }, accessToken: { not: null } },
  })

  let synced = 0
  let generated = 0

  for (const business of businesses) {
    try {
      let token = business.accessToken!
      if (business.tokenExpiresAt && business.tokenExpiresAt < new Date(Date.now() + 300_000)) {
        const refreshed = await refreshAccessToken(business.refreshToken!)
        token = refreshed.accessToken
        await db.business.update({
          where: { id: business.id },
          data: { accessToken: refreshed.accessToken, tokenExpiresAt: refreshed.expiresAt },
        })
      }

      const reviews = await fetchReviews(business.googleAccountId!, business.googleLocationId!, `Bearer ${token}`)

      for (const raw of reviews) {
        const exists = await db.review.findUnique({ where: { googleReviewId: raw.googleReviewId } })
        if (exists) continue

        const review = await db.review.create({
          data: {
            businessId: business.id,
            googleReviewId: raw.googleReviewId,
            authorName: raw.authorName,
            rating: raw.rating,
            text: raw.text,
            publishedAt: raw.publishedAt,
          },
        })
        synced++

        if (raw.rating === 1 && business.alertEmail) {
          await sendLowRatingAlert({
            toEmail: business.alertEmail,
            businessName: business.name,
            authorName: raw.authorName,
            rating: raw.rating,
            reviewText: raw.text,
            reviewId: review.id,
          })
          await db.review.update({ where: { id: review.id }, data: { alertSent: true } })
        }

        const responseText = await generateResponse({
          authorName: raw.authorName,
          rating: raw.rating,
          text: raw.text,
          businessName: business.name,
          toneExamples: business.toneExamples,
        })

        await db.response.create({
          data: {
            reviewId: review.id,
            text: responseText,
            status: business.autoPublish ? 'approved' : 'draft',
          },
        })
        generated++
      }
    } catch (err) {
      console.error(`Sync failed for business ${business.id}:`, err)
    }
  }

  return NextResponse.json({ synced, generated })
}
```

- [ ] **Step 2: Configure Vercel cron**

Create `vercel.json`:
```json
{
  "crons": [{ "path": "/api/cron/sync", "schedule": "0 * * * *" }]
}
```

- [ ] **Step 3: Test manually**

```bash
curl -H "x-cron-secret: $(grep CRON_SECRET .env.local | cut -d= -f2)" http://localhost:3000/api/cron/sync
```

Expected: `{"synced":0,"generated":0}`

- [ ] **Step 4: Commit**

```bash
git add app/api/cron/ vercel.json
git commit -m "feat: add hourly review sync cron job"
```

---

## Task 9: API Routes for UI

**Files:**
- Create: `app/api/reviews/route.ts`, `app/api/responses/route.ts`, `app/api/responses/[id]/approve/route.ts`, `app/api/responses/[id]/publish/route.ts`

- [ ] **Step 1: Reviews GET route**

Create `app/api/reviews/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import { getDbUser } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  const user = await getDbUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const business = await db.business.findFirst({ where: { userId: user.id } })
  if (!business) return NextResponse.json({ reviews: [] })
  const reviews = await db.review.findMany({
    where: { businessId: business.id },
    include: { response: true },
    orderBy: { publishedAt: 'desc' },
    take: 50,
  })
  return NextResponse.json({ reviews })
}
```

- [ ] **Step 2: Responses GET route**

Create `app/api/responses/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import { getDbUser } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  const user = await getDbUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const business = await db.business.findFirst({ where: { userId: user.id } })
  if (!business) return NextResponse.json({ responses: [] })
  const responses = await db.response.findMany({
    where: { review: { businessId: business.id }, status: 'draft' },
    include: { review: true },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ responses })
}
```

- [ ] **Step 3: Approve route**

Create `app/api/responses/[id]/approve/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getDbUser } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getDbUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { text } = await req.json()
  const response = await db.response.findUnique({
    where: { id: params.id },
    include: { review: { include: { business: true } } },
  })
  if (!response || response.review.business.userId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  const updated = await db.response.update({
    where: { id: params.id },
    data: { status: 'approved', ...(text ? { text } : {}) },
  })
  return NextResponse.json({ response: updated })
}
```

- [ ] **Step 4: Publish route**

Create `app/api/responses/[id]/publish/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getDbUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { publishResponse } from '@/lib/google'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getDbUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const response = await db.response.findUnique({
    where: { id: params.id },
    include: { review: { include: { business: true } } },
  })
  if (!response || response.review.business.userId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  const { review } = response
  const { business } = review
  await publishResponse(
    business.googleAccountId!,
    business.googleLocationId!,
    review.googleReviewId,
    response.text,
    `Bearer ${business.accessToken}`
  )
  const updated = await db.response.update({
    where: { id: params.id },
    data: { status: 'published', publishedAt: new Date() },
  })
  return NextResponse.json({ response: updated })
}
```

- [ ] **Step 5: Commit**

```bash
git add app/api/reviews/ app/api/responses/
git commit -m "feat: add reviews and responses API routes"
```

---

## Task 10: Dashboard UI

**Files:**
- Create: `app/(dashboard)/layout.tsx`, `app/(dashboard)/reviews/page.tsx`, `app/(dashboard)/responses/page.tsx`, `app/(dashboard)/settings/page.tsx`, `components/ReviewCard.tsx`, `components/ResponseEditor.tsx`

- [ ] **Step 1: Dashboard layout**

Create `app/(dashboard)/layout.tsx`:
```typescript
import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="font-semibold">ReviewPilot</span>
          <Link href="/reviews" className="text-sm text-gray-600 hover:text-gray-900">Reviews</Link>
          <Link href="/responses" className="text-sm text-gray-600 hover:text-gray-900">Responses</Link>
          <Link href="/settings" className="text-sm text-gray-600 hover:text-gray-900">Settings</Link>
        </div>
        <UserButton afterSignOutUrl="/" />
      </nav>
      <main className="max-w-4xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
```

- [ ] **Step 2: ReviewCard component**

Create `components/ReviewCard.tsx`:
```typescript
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

type Review = {
  id: string
  authorName: string
  rating: number
  text: string | null
  publishedAt: string
  response: { text: string; status: string } | null
}

export function ReviewCard({ review }: { review: Review }) {
  const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating)
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <span className="font-medium">{review.authorName}</span>
          <div className="flex items-center gap-2">
            <span className="text-yellow-500 text-sm">{stars}</span>
            {review.response && (
              <Badge variant={review.response.status === 'published' ? 'default' : 'secondary'}>
                {review.response.status}
              </Badge>
            )}
          </div>
        </div>
        <span className="text-xs text-gray-400">{new Date(review.publishedAt).toLocaleDateString()}</span>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-700">{review.text ?? '(No text)'}</p>
        {review.response && (
          <div className="mt-3 pl-3 border-l-2 border-blue-200">
            <p className="text-xs text-gray-400 mb-1">AI Response</p>
            <p className="text-sm text-gray-600">{review.response.text}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 3: ResponseEditor component**

Create `components/ResponseEditor.tsx`:
```typescript
'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

type Props = {
  responseId: string
  reviewAuthor: string
  reviewText: string | null
  rating: number
  draftText: string
  onDone: () => void
}

export function ResponseEditor({ responseId, reviewAuthor, reviewText, rating, draftText, onDone }: Props) {
  const [text, setText] = useState(draftText)
  const [loading, setLoading] = useState(false)

  const publish = async () => {
    setLoading(true)
    await fetch(`/api/responses/${responseId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
    await fetch(`/api/responses/${responseId}/publish`, { method: 'POST' })
    setLoading(false)
    onDone()
  }

  const saveDraft = async () => {
    setLoading(true)
    await fetch(`/api/responses/${responseId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
    setLoading(false)
    onDone()
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <span className="font-medium">{reviewAuthor}</span>
          <span className="text-yellow-500 text-sm">{'★'.repeat(rating)}{'☆'.repeat(5 - rating)}</span>
        </div>
        <p className="text-sm text-gray-600">{reviewText ?? '(No text)'}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea value={text} onChange={e => setText(e.target.value)} rows={4} />
        <div className="flex gap-2">
          <Button variant="outline" onClick={saveDraft} disabled={loading}>Save Draft</Button>
          <Button onClick={publish} disabled={loading}>Publish to Google</Button>
        </div>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 4: Reviews page**

Create `app/(dashboard)/reviews/page.tsx`:
```typescript
'use client'
import { useEffect, useState } from 'react'
import { ReviewCard } from '@/components/ReviewCard'

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/reviews').then(r => r.json()).then(d => { setReviews(d.reviews); setLoading(false) })
  }, [])

  if (loading) return <p className="text-gray-500">Loading...</p>
  if (!reviews.length) return (
    <div className="text-center py-20 text-gray-500">
      <p>No reviews yet. Connect Google Business in Settings to start syncing.</p>
    </div>
  )
  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Reviews</h1>
      <div className="space-y-4">{reviews.map(r => <ReviewCard key={r.id} review={r} />)}</div>
    </div>
  )
}
```

- [ ] **Step 5: Responses page**

Create `app/(dashboard)/responses/page.tsx`:
```typescript
'use client'
import { useEffect, useState } from 'react'
import { ResponseEditor } from '@/components/ResponseEditor'

export default function ResponsesPage() {
  const [responses, setResponses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    fetch('/api/responses').then(r => r.json()).then(d => { setResponses(d.responses); setLoading(false) })
  }

  useEffect(() => { load() }, [])

  if (loading) return <p className="text-gray-500">Loading...</p>
  if (!responses.length) return <div className="text-center py-20 text-gray-500">No pending responses.</div>

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Pending Responses ({responses.length})</h1>
      <div className="space-y-4">
        {responses.map(r => (
          <ResponseEditor
            key={r.id}
            responseId={r.id}
            reviewAuthor={r.review.authorName}
            reviewText={r.review.text}
            rating={r.review.rating}
            draftText={r.text}
            onDone={load}
          />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Settings page**

Create `app/(dashboard)/settings/page.tsx`:
```typescript
'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function SettingsPage() {
  const [alertEmail, setAlertEmail] = useState('')

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Settings</h1>

      <Card>
        <CardHeader><CardTitle className="text-base">Google Business Profile</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">Connect to start syncing reviews automatically.</p>
          <Button onClick={() => window.location.href = '/api/google/connect'}>Connect Google Account</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Alert Email</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-600">Get notified instantly on 1-star reviews.</p>
          <Input placeholder="owner@yourbusiness.com" value={alertEmail} onChange={e => setAlertEmail(e.target.value)} />
          <Button size="sm">Save</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Subscription</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {[
              { plan: 'solo', label: 'Solo', price: '$49/mo', desc: '1 location' },
              { plan: 'business', label: 'Business', price: '$99/mo', desc: '2–5 locations' },
              { plan: 'agency', label: 'Agency', price: '$299/mo', desc: 'Up to 20 locations' },
            ].map(({ plan, label, price, desc }) => (
              <div key={plan} className="border rounded-xl p-4 text-center">
                <p className="font-medium">{label}</p>
                <p className="text-2xl font-bold my-1">{price}</p>
                <p className="text-xs text-gray-500 mb-3">{desc}</p>
                <Button size="sm" className="w-full" onClick={async () => {
                  const res = await fetch('/api/billing/checkout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ plan }),
                  })
                  const { url } = await res.json()
                  window.location.href = url
                }}>Subscribe</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 7: Run dev and verify all pages**

```bash
npm run dev
```

Check `http://localhost:3000/reviews`, `/responses`, `/settings` — all render without errors.

- [ ] **Step 8: Commit**

```bash
git add app/(dashboard) components/
git commit -m "feat: add dashboard UI with reviews, responses, and settings"
```

---

## Task 11: Stripe Billing

**Files:**
- Create: `lib/stripe.ts`, `app/api/billing/checkout/route.ts`, `app/api/webhooks/stripe/route.ts`

- [ ] **Step 1: Stripe client**

Create `lib/stripe.ts`:
```typescript
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })

export const PLAN_PRICES: Record<string, string> = {
  solo: process.env.STRIPE_PRICE_SOLO!,
  business: process.env.STRIPE_PRICE_BUSINESS!,
  agency: process.env.STRIPE_PRICE_AGENCY!,
}
```

- [ ] **Step 2: Checkout session route**

Create `app/api/billing/checkout/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getDbUser } from '@/lib/auth'
import { stripe, PLAN_PRICES } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  const user = await getDbUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { plan } = await req.json()
  if (!PLAN_PRICES[plan]) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: user.email,
    line_items: [{ price: PLAN_PRICES[plan], quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/reviews?subscribed=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
    metadata: { userId: user.id },
  })

  return NextResponse.json({ url: session.url })
}
```

- [ ] **Step 3: Stripe webhook**

Create `app/api/webhooks/stripe/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { stripe, PLAN_PRICES } from '@/lib/stripe'
import { db } from '@/lib/db'
import Stripe from 'stripe'

const PRICE_TO_PLAN = Object.fromEntries(Object.entries(PLAN_PRICES).map(([k, v]) => [v, k]))

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.CheckoutSession
    const userId = session.metadata?.userId
    if (!userId) return NextResponse.json({ received: true })
    const sub = await stripe.subscriptions.retrieve(session.subscription as string)
    const priceId = sub.items.data[0].price.id
    await db.subscription.upsert({
      where: { userId },
      create: {
        userId,
        stripeCustomerId: session.customer as string,
        stripePriceId: priceId,
        stripeSubId: sub.id,
        status: sub.status,
        plan: PRICE_TO_PLAN[priceId] ?? 'solo',
      },
      update: { stripePriceId: priceId, stripeSubId: sub.id, status: sub.status, plan: PRICE_TO_PLAN[priceId] ?? 'solo' },
    })
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription
    await db.subscription.updateMany({ where: { stripeSubId: sub.id }, data: { status: 'canceled' } })
  }

  return NextResponse.json({ received: true })
}
```

- [ ] **Step 4: Test webhook locally**

In a second terminal:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

- [ ] **Step 5: Commit**

```bash
git add lib/stripe.ts app/api/billing/ app/api/webhooks/
git commit -m "feat: add Stripe billing with checkout session and webhook"
```

---

## Task 12: Landing Page

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Build landing page**

Replace `app/page.tsx`:
```typescript
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b px-6 py-4 flex items-center justify-between max-w-5xl mx-auto">
        <span className="font-semibold text-lg">ReviewPilot</span>
        <div className="flex gap-3">
          <Link href="/sign-in"><Button variant="ghost" size="sm">Sign in</Button></Link>
          <Link href="/sign-up"><Button size="sm">Get started free</Button></Link>
        </div>
      </nav>
      <section className="max-w-3xl mx-auto text-center px-6 py-24">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Never miss a review again</h1>
        <p className="text-xl text-gray-500 mb-8">
          ReviewPilot monitors your Google reviews and generates AI responses in your voice — ready to publish in one click.
        </p>
        <Link href="/sign-up"><Button size="lg">Start free trial</Button></Link>
      </section>
      <section className="max-w-4xl mx-auto px-6 pb-24 grid grid-cols-3 gap-6">
        {[
          { title: 'AI Responses', desc: 'Matched to your tone, generated in seconds.' },
          { title: 'Instant Alerts', desc: '1-star review? You\'ll know within minutes.' },
          { title: 'One Dashboard', desc: 'All your reviews in one place, always up to date.' },
        ].map(({ title, desc }) => (
          <div key={title} className="p-6 border rounded-xl text-center">
            <h3 className="font-semibold mb-2">{title}</h3>
            <p className="text-sm text-gray-500">{desc}</p>
          </div>
        ))}
      </section>
    </div>
  )
}
```

- [ ] **Step 2: Verify landing page**

Visit `http://localhost:3000` — hero, nav, and 3 feature cards visible.

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx && git commit -m "feat: add landing page"
```

---

## Task 13: Final Checks

- [ ] **Run all tests**

```bash
npx jest --coverage
```

Expected: All tests pass. `lib/google.ts`, `lib/llm.ts`, `lib/alerts.ts` covered.

- [ ] **TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Production build**

```bash
npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Final commit**

```bash
git add . && git commit -m "chore: all tests pass, build succeeds"
```

---

## Pre-Deploy Checklist

Before pushing to Vercel:

- [ ] Neon DB created → `DATABASE_URL` set in Vercel env
- [ ] Clerk app created → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY` set
- [ ] Google Cloud project created, OAuth 2.0 credentials configured, Business Profile API enabled → **apply for API access now, takes 2–4 weeks**
- [ ] Anthropic API key set
- [ ] Resend account + verified sending domain → `RESEND_API_KEY` + `ALERT_FROM_EMAIL` set
- [ ] Stripe account with 3 products (Solo $49, Business $99, Agency $299) → price IDs set
- [ ] `CRON_SECRET` set to output of `openssl rand -hex 32`
- [ ] `npx prisma db push` run against production DB URL
- [ ] Stripe webhook registered at `https://yourdomain.com/api/webhooks/stripe` with events: `checkout.session.completed`, `customer.subscription.deleted`
