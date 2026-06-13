# ReviewPilot — SaaS Concept Document
*Generated: 2026-06-13*

---

## Concept Summary

**"AI review monitoring + auto-response for multi-location SMBs"**

ReviewPilot aggregates customer reviews from Google, Yelp, TripAdvisor, and Booking.com into a single dashboard. It learns the business's tone and generates on-brand responses automatically — with options for human approval or full auto-publish. It alerts owners instantly on negative reviews and provides sentiment benchmarking against competitors.

---

## Problem

Restaurants, clinics, salons, hotels, and gyms receive reviews across multiple platforms constantly. Most businesses:
- Ignore the majority of reviews (time constraint)
- Spend hours responding manually (skill + time constraint)
- Have no visibility into how they compare to competitors
- Miss urgent negative reviews until it's too late

Existing solutions (Birdeye, Podium) charge $300–$500+/month with bloated features, priced out of reach for most SMBs.

---

## Solution

A lean, AI-native review management tool at the $49–$149/month price point.

**Core workflow:**
1. Business connects their Google Business Profile (and later Yelp, TripAdvisor)
2. ReviewPilot ingests all incoming reviews in real-time
3. AI generates a tone-matched response for each review
4. Owner approves individually or enables auto-publish
5. Urgent 1-star reviews trigger instant alerts (email/SMS)
6. Dashboard shows sentiment trends and competitor comparison

---

## Target Customers

**Primary ICP:**
- Local businesses with 1–5 locations: restaurants, salons, dental clinics, gyms, hotels
- Owners who are time-poor and non-technical
- Businesses actively getting reviews (20+ Google reviews already)

**High-value segment:**
- Franchise operators (20+ locations) → single contract = $1,500+/month

**Secondary:**
- Local marketing agencies managing 10–50 business clients (white-label opportunity)

---

## MVP Feature Set

### Must Have (MVP)
- Google Business Profile integration (reviews in + responses out)
- AI response generation matched to business tone
- Response queue with approve / auto-publish toggle
- Urgent alert system (1-star reviews → instant notification via email)
- Basic sentiment dashboard (average rating over time, review volume)

### V2 (Post-Traction)
- Yelp, TripAdvisor, Booking.com integrations
- Competitor sentiment benchmarking
- Review request campaigns (text/email to recent customers)
- Multi-location management dashboard (franchise view)
- White-label for agencies

---

## Technical Architecture

```
Google Business Profile API (polling + webhooks)
        │
        ▼
Review Ingestion Service
        │
        ├─ Sentiment Analyzer (LLM)
        │       └─ Review DB (Postgres)
        │
        ├─ Response Generator (LLM with tone profile)
        │       └─ Approval Queue / Auto-publish
        │
        └─ Alert Engine (email/SMS for 1-star reviews)
```

### Tech Stack (Budget-Optimized)

| Layer | Tool | Cost |
|-------|------|------|
| Frontend | Next.js + Vercel | Free |
| Backend | Node.js/Express on Railway | $5/month |
| Database | Neon (Postgres) | Free tier → $19/month |
| Queue | Upstash Redis | Free tier |
| Auth | Clerk | Free (up to 10K MAU) |
| LLM | Claude Haiku / GPT-4o-mini | ~$1–3/month at MVP scale |
| Email alerts | Resend | Free (3K/month) |
| Payments | Stripe | 2.9% + $0.30 per transaction |
| Domain | Namecheap | ~$12/year |

### Key Integrations
- **Google Business Profile API** — primary (free, but requires 2–4 week approval process — apply immediately)
- **Yelp Fusion API** — free tier (5K calls/day, sufficient for MVP)
- **TripAdvisor API** — has costs, skip for MVP, add post-revenue

---

## Go-To-Market Strategy

### Channel 1 — Local Business Facebook Groups (fastest)
- Restaurant owners, salon owners, gym owners have active FB communities
- Approach: engage genuinely, offer free trial
- Converts fast — pain is immediate and visible

### Channel 2 — Agency Partnerships (highest leverage)
- Local marketing agencies manage 10–50 business clients each
- One partnership = 10–50 customers instantly
- White-label offer: agency charges clients $149, pays you $49, keeps $100 margin
- Approach: cold email local SEO agencies with revenue share proposal

### Channel 3 — Local SEO Communities
- Facebook groups for Google Local Guides and local SEO practitioners
- They directly influence business owners

---

## Pricing

| Plan | Price | Target |
|------|-------|--------|
| Solo | $49/month | Single location |
| Business | $99/month | 2–5 locations |
| Agency | $299/month | Up to 20 locations |

**Killer upsell:** Review request campaigns (getting more reviews) — businesses pay extra for volume growth, not just management.

---

## Cost Breakdown

### Monthly Infrastructure Costs

| Stage | Monthly Infra Cost | Revenue (example) | Margin |
|-------|-------------------|-------------------|--------|
| Building (0 customers) | ~$8–11/month | $0 | — |
| MVP live (10 customers × $99) | ~$10–40/month | $990/month | ~96% |
| Growth (75 customers × $99 avg) | ~$80–150/month | $7,425/month | ~98% |

### LLM Cost Reality
- ~800 tokens per response generated
- 50 customers × 30 reviews/month = 1,500 responses
- Total LLM cost: **~$1–3/month** at MVP scale

### Stripe Fees
- $49/month plan → Stripe takes $1.72 → you keep $47.28
- $99/month plan → Stripe takes $3.17 → you keep $95.83
- $299/month plan → Stripe takes $8.97 → you keep $290.03

### One-Time Launch Budget
- Domain: ~$12
- 2–3 months hosting while building: ~$15–30
- **Total out-of-pocket: ~$30–50**

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Google API approval delay (2–4 weeks) | Apply week 1, build with mock data meanwhile |
| Google ToS on AI-generated responses | Responses are AI-assisted; human approval before publish is default. Auto-publish is opt-in only. |
| High churn from local businesses | Annual plan discount (2 months free), prioritize agency channel for stickier contracts |
| "I can just use ChatGPT" | The integration, monitoring, and auto-detection of new reviews is the value — not just the AI writing |
| TripAdvisor/Yelp API limitations | MVP is Google-only. Expand after first revenue. |

---

## Competitive Landscape

| Competitor | Price | Gap |
|-----------|-------|-----|
| Birdeye | $300–500+/month | Too expensive, bloated, enterprise-focused |
| Podium | $300–500+/month | Same — overkill for single-location SMBs |
| Grade.us | $110+/month | No AI response generation |
| Reviewflowz | $49+/month | No auto-response, monitoring only |
| **ReviewPilot** | $49–299/month | AI-native, lean, affordable, agency white-label |

**Competitive moat:** Tone learning (matches business voice over time) + multi-platform aggregation + agency white-label at SMB pricing.

---

## Revenue Targets

| Milestone | Customers | MRR |
|-----------|-----------|-----|
| Ramen profitable | 15 × $49 avg | ~$735/month |
| Meaningful traction | 50 × $79 avg | ~$3,950/month |
| Strong signal | 150 × $99 avg | ~$14,850/month |
| One agency partner (20 locations) | 1 × $299 | $299/month immediately |

---

## Build Timeline (Solo Developer)

| Week | Milestone |
|------|-----------|
| 1 | Apply for Google Business Profile API access. Set up project, auth, Stripe, DB schema. |
| 2–3 | Review ingestion service + Google integration (with mock data while API pending) |
| 4 | LLM response generation + tone profile system |
| 5 | Approval queue UI + auto-publish toggle |
| 6 | Alert system (1-star → email notification) |
| 7 | Dashboard (sentiment trend, review volume) |
| 8 | Polish, onboarding flow, billing, launch |

**Target: chargeable MVP in 6–8 weeks**

---

## Why Now

- Google reviews are increasingly decisive for local business revenue (46% of searches have local intent)
- AI response generation is now cheap enough to offer at SMB price points
- The category is validated (Birdeye's $150M+ revenue) but completely unserved at the affordable end
- Google's push for business owners to respond to reviews creates a clear, growing pain point
