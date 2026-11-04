# LinkPulse ⚡

**Smart URL Shortener & Real-Time Analytics**

> A production-ready, full-stack URL shortener and link analytics platform built with Next.js 16 (App Router), TypeScript, Prisma ORM, Neon PostgreSQL, Auth.js, and Upstash Redis. Built as an end-to-end full-stack engineering project.

---

## Live Demo & Repository

- **Live Application:** `[Production URL Placeholder — e.g. https://linkpulse.vercel.app]`
- **Repository:** `[GitHub Repository URL Placeholder]`
- **Demo Account:**
  - **Email:** `demo@linkpulse.io`
  - **Password:** `DemoPassword123!`

---

## 1. Project Overview

LinkPulse is a fast, secure, and modern link management platform that turns long, unwieldy URLs into clean, branded short links. Every redirect captures real-time telemetry (referrers, device types, browser clients, timestamps) without introducing latency or tracking personally identifiable information (PII).

---

## 2. Key Features

- **⚡ Instant Short Link Creation:** Automatically generates collision-resistant 7-character nanoid slugs.
- **🏷️ Custom Aliases:** Support for memorable, custom-branded slugs with case-insensitive uniqueness validation.
- **🛡️ Reserved-Word Collision Protection:** Over 30 system routes (e.g., `/dashboard`, `/api`, `/login`, `/admin`) are strictly blocked from being claimed as aliases.
- **🔒 Server-Side Authentication:** Robust email/password authentication using Auth.js (NextAuth v5) and bcrypt password hashing (cost factor 10).
- **📊 Real-Time Analytics:** Interactive metrics covering total clicks, click trend history, top referrer sources (with safe fallback for Direct visits), device breakdown (Mobile/Desktop/Tablet), and browser distribution.
- **✏️ Complete Link Management:** Edit destination URLs, custom aliases, titles, expiration dates, and toggle active/inactive status at any time.
- **⏰ Expiration Dates:** Set future expiration timestamps; expired links automatically display a user-friendly expiration page.
- **🚦 Distributed Sliding-Window Rate Limiting:** Enforces 10 link creations per user per hour via Upstash Redis with HTTP 429 and `Retry-After` header.
- **📱 Responsive UI & Design System:** Pure CSS tokens (no heavy UI frameworks) responsive across mobile, tablet, and desktop layouts.
- **🌱 Idempotent Seed Data:** Preloaded with sample active, inactive, and expired links with realistic analytics data.

---

## 3. Screenshots

| Landing Page | Dashboard & Link Management |
| :---: | :---: |
| *(Hero section, features, how-it-works)* <br> `[Screenshot Placeholder: Landing Page]` | *(Link creation form, stats bar, link cards)* <br> `[Screenshot Placeholder: Dashboard]` |

| Dedicated Analytics Page | Link Settings / Edit Page |
| :---: | :---: |
| *(Click trends, device/browser distribution, referrers)* <br> `[Screenshot Placeholder: Analytics]` | *(Destination URL, alias change warning, expiry)* <br> `[Screenshot Placeholder: Edit Page]` |

---

## 4. Technology Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Framework** | Next.js 16.4.3 | App Router, React Server Components, Server Actions |
| **Language** | TypeScript 5 (Strict) | Zero `any` policy, comprehensive interface definitions |
| **Runtime & UI** | React 19.3.0 | Modern Hooks, pure CSS design tokens |
| **Database** | PostgreSQL | Serverless PostgreSQL via [Neon](https://neon.tech) |
| **ORM** | Prisma 6.19.3 | Schema migrations, connection pooling, client singleton |
| **Authentication** | Auth.js (NextAuth v5) | JWT strategy, credentials provider, secure cookie handling |
| **Rate Limiting** | Upstash Redis | Sliding-window algorithm via `@upstash/ratelimit` |
| **Validation** | Zod 4 | Strict input parsing & protocol sanitization (`http/https`) |
| **Slug Generation** | nanoid 6 | 7-character URL-safe alphanumeric slugs |
| **UA Detection** | ua-parser-js | In-memory device & browser classification |
| **Testing** | Vitest 5 & Vite 8 | 69 unit & integration tests with in-process Prisma mocking |
| **Hosting** | Vercel | Production deployment with edge compatibility |

---

## 5. System Architecture

```
                                  ┌────────────────────────┐
                                  │      Client Browser    │
                                  └───────────┬────────────┘
                                              │ HTTP / HTTPS
                                              ▼
                                  ┌────────────────────────┐
                                  │   Next.js App Router   │
                                  │   (Edge Proxy & SSR)   │
                                  └─────┬────────────┬─────┘
                                        │            │
                  Public Redirects /[code]           │ Authenticated Routes (/dashboard, /links/*)
                                        │            │
                                        ▼            ▼
                           ┌───────────────────────────────┐
                           │   Service Layer (Business)   │
                           │ ───────────────────────────── │
                           │  • links.service.ts           │
                           │  • redirect.service.ts        │
                           │  • analytics.service.ts       │
                           │  • link-management.service.ts │
                           └───────┬───────────────┬───────┘
                                   │               │
            Prisma ORM (Connection Pool)          Distributed Sliding Window
                                   │               │
                                   ▼               ▼
                      ┌──────────────────────┐  ┌──────────────────────┐
                      │   Neon PostgreSQL    │  │     Upstash Redis    │
                      │  (User, Link, Click) │  │    (Rate Limiting)   │
                      └──────────────────────┘  └──────────────────────┘
```

---

## 6. Project Directory Structure

```
linkpulse/
├── prisma/
│   ├── migrations/             # Versioned SQL migrations
│   ├── schema.prisma           # Prisma data models and indexes
│   └── seed.ts                 # Idempotent development seed script
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/          # Login page route
│   │   │   └── register/       # User registration page route
│   │   ├── [shortCode]/        # Public high-performance redirect route
│   │   ├── api/
│   │   │   ├── auth/           # NextAuth handlers & registration API
│   │   │   └── links/          # Link CRUD, pagination, and analytics API
│   │   ├── dashboard/          # Authenticated user dashboard
│   │   ├── links/
│   │   │   └── [id]/           # Dedicated link analytics page
│   │   │       └── edit/       # Dedicated link edit page
│   │   ├── layout.tsx          # Root layout & design system provider
│   │   └── page.tsx            # Public marketing landing page
│   ├── components/             # Reusable UI components
│   │   ├── copy-button.tsx     # Clipboard copy button with visual feedback
│   │   ├── create-link-form.tsx# Short link generator form
│   │   ├── edit-link-page-form.tsx # Full edit form with alias warnings
│   │   ├── my-links-section.tsx# Link cards, stats bar, quick modal
│   │   └── providers.tsx       # Session provider wrapper
│   ├── lib/                    # Shared infrastructure utilities
│   │   ├── auth.config.ts      # Route protection and JWT callbacks
│   │   ├── auth.ts             # Credentials provider & password verification
│   │   ├── base-url.ts         # Environment-aware domain resolver
│   │   ├── nanoid.ts           # Slug generator
│   │   ├── prisma.ts           # Prisma client singleton
│   │   ├── ratelimit.ts        # Upstash Redis & fallback rate limiter
│   │   ├── reserved-words.ts   # System route collision blocklist
│   │   └── ua-parser.ts        # Client device & browser analyzer
│   ├── services/               # Pure business logic layer
│   │   ├── analytics.service.ts
│   │   ├── link-management.service.ts
│   │   ├── links.service.ts
│   │   └── redirect.service.ts
│   ├── styles/
│   │   └── globals.css         # Pure CSS custom properties & design tokens
│   └── validators/             # Zod validation schemas
│       ├── auth.validators.ts
│       └── link.validators.ts
├── tests/
│   ├── phase4-5.test.ts        # Redirection, ownership, & click tracking tests
│   └── phase6-7-8.test.ts      # 50 comprehensive tests across Categories A–H
├── .env.example                # Documented environment variable template
├── next.config.ts              # Security headers & Next.js configuration
├── package.json
├── tsconfig.json
└── vitest.config.mts           # Vitest configuration
```

---

## 7. Database Models & Schema

The PostgreSQL schema is managed via Prisma with relations and database indexes:

```prisma
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  name         String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  links Link[]
}

model Link {
  id          String    @id @default(cuid())
  shortCode   String    @unique
  originalUrl String
  userId      String
  title       String?
  isActive    Boolean   @default(true)
  expiresAt   DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  user   User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  clicks Click[]

  @@index([shortCode])
  @@index([userId])
  @@index([expiresAt])
}

model Click {
  id         String   @id @default(cuid())
  linkId     String
  timestamp  DateTime @default(now())
  referrer   String?
  deviceType String?
  browser    String?
  ipHash     String?
  country    String?

  link Link @relation(fields: [linkId], references: [id], onDelete: Cascade)

  @@index([linkId])
  @@index([linkId, timestamp])
  @@index([timestamp])
}
```

- **Indexes**: Fast `O(log n)` lookups on `shortCode` for sub-millisecond redirects; composite indexes on `[linkId, timestamp]` for performant analytics queries.
- **Referential Integrity**: Cascading deletes ensure deleting a link cleans up all click telemetry, and deleting a user removes all their links.

---

## 8. Authentication & Authorization

- **Library:** Auth.js (NextAuth v5 beta) with JWT session strategy (30-day expiration).
- **Password Security:** Salted hashes generated via `bcryptjs` with cost factor 10. `passwordHash` is excluded from all select queries and API responses.
- **Route Protection:** Handled via Next.js middleware and `authConfig.callbacks.authorized`. Any unauthenticated request to `/dashboard` or `/links/*` is redirected to `/login?callbackUrl=...`.
- **Server-Side Authorization:** Every mutation (`updateLink`, `deleteLink`, `getLinkById`, `getLinkAnalytics`) derives the authenticated user ID strictly from the verified session, rejecting access if the requesting user does not own the link.

---

## 9. Link Creation & Redirection Workflow

1. **Creation:**
   - Client sends `POST /api/links` with `url`, optional `alias`, `title`, and `expiresAt`.
   - Zod validates that the destination starts strictly with `http://` or `https://` (preventing `javascript:`, `data:`, or `ftp:` vectors).
   - If `alias` is supplied: validates format (`^[a-zA-Z0-9_-]+$`, 3–50 chars), checks reserved words, and ensures case-insensitive uniqueness in the database.
   - If `alias` is omitted: generates a collision-resistant 7-character nanoid code.
   - Rate limit check is evaluated (10 links/hr per user).
2. **Redirection (`GET /[shortCode]`):**
   - The shortCode is extracted and checked against reserved routes first (skips DB if reserved).
   - Looks up the link by `shortCode`.
   - If not found: renders standard 404 page.
   - If `isActive === false`: displays friendly "Link Disabled" state.
   - If `expiresAt <= now`: displays friendly "Link Expired" state.
   - If valid: asynchronously logs click event (fire-and-forget, non-blocking) and issues an immediate HTTP redirect to `originalUrl`.

---

## 10. Rate Limiting Mechanism

- **Algorithm:** Distributed Sliding Window (10 creations per 1 hour window).
- **Storage:** Upstash Redis REST API (`@upstash/ratelimit`).
- **Identifier:** `link_create:${session.user.id}`.
- **Response Headers:** When rate limited, LinkPulse responds with `429 Too Many Requests` including standard headers:
  - `Retry-After: <seconds>`
  - `X-RateLimit-Limit: 10`
  - `X-RateLimit-Remaining: 0`
  - `X-RateLimit-Reset: <timestamp>`
- **Production Safety:** In production, if Upstash credentials are not configured, the system logs a server-side configuration error and enforces safe rejection rather than silently weakening rate limits. In development, a local in-memory sliding window limiter is provided as a seamless fallback.

---

## 11. Analytics & Telemetry Engine

- **Click Capture:** Captures `timestamp`, `referrer` (via request headers), `deviceType` (mobile, tablet, desktop via user-agent parsing), and `browser` (Chrome, Safari, Firefox, Edge, etc.).
- **Privacy First:** Raw IP addresses are **never** stored in the database.
- **Aggregation:**
  - **Click Trend:** Grouped by date (`YYYY-MM-DD`) for the past 14 days.
  - **Referrers:** Hostname extracted and ranked descending. Missing referrers are labeled safely as `"Direct"`.
  - **Breakdowns:** Aggregated counts for device types and browsers.
- **Fault-Tolerant:** Analytics logging errors are swallowed gracefully so user redirection is never delayed or interrupted.

---

## 12. Local Installation & Setup

### Prerequisites
- **Node.js:** v18.17+ or v20+ (v24 supported)
- **Package Manager:** npm v9+
- **Database:** PostgreSQL database (recommended: [Neon free tier](https://neon.tech))
- **Redis:** Upstash Redis database (free tier: [Upstash](https://console.upstash.com))

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/linkpulse.git
cd linkpulse
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
```bash
cp .env.example .env.local
```
Edit `.env.local` with your configuration:
```env
DATABASE_URL="postgresql://neondb_owner:PASSWORD@ep-xyz-pooler.region.neon.tech/neondb?sslmode=require"
AUTH_SECRET="your-32-byte-base64-secret"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
UPSTASH_REDIS_REST_URL="https://your-upstash-redis.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-upstash-token"
```
*(Generate an Auth secret with `openssl rand -base64 32`)*

---

## 13. Database Migrations & Seeding

### 1. Validate Schema & Generate Client
```bash
npx prisma validate
npx prisma generate
```

### 2. Apply Migrations
```bash
npx prisma migrate dev
# Or check status against live DB:
npx prisma migrate status
```

### 3. Seed Demo Data
```bash
npm run db:seed
# Or directly:
npx prisma db seed
```

This populates the database with:
- Demo User: `demo@linkpulse.io` / `DemoPassword123!`
- 4 sample short links (`/docs-guide`, `/summer-launch`, `/old-portfolio`, `/flash-sale`)
- Sample click telemetry across devices, browsers, and referrers.
- **Note:** The seed script is completely idempotent; re-running it will not duplicate links or click counts.

---

## 14. Development & Testing Commands

```bash
# Start local development server
npm run dev

# Run automated test suite (69 tests)
npm test

# Run tests in watch mode
npm run test:watch

# TypeScript type checking
npx tsc --noEmit

# ESLint code style and best practice check
npm run lint

# Production build check
npm run build

# Start production server locally
npm run start
```

---

## 15. Automated Test Suite (69 Tests)

LinkPulse features comprehensive test coverage across 2 test suites:
- `tests/phase4-5.test.ts` (19 tests): Destination editing, click logging, ownership restrictions, and redirect verification.
- `tests/phase6-7-8.test.ts` (50 tests):
  - **Category A (1–11):** Link creation, validation, dangerous schemes (`javascript:`, `data:`, `ftp:`), duplicate aliases, past/future expiry, and rate limits.
  - **Category B (12–15):** Authentication enforcement, credential resolution, and protected route callbacks.
  - **Category C (16–20):** Active redirects, 404 responses, expired/inactive link blocking, and reserved slug routing.
  - **Category D (21–26):** Click telemetry, timestamps, referrers, UA device/browser detection, and non-blocking failure tolerance.
  - **Category E (27–31):** Multi-tenant ownership isolation, cross-user mutation prevention, and server-side session binding.
  - **Category F (32–37):** Link editing (URL, title, expiry, alias with self-exclusion, active status) and deletion.
  - **Category G (38–44):** Analytics metric accuracy, date grouping, last-click tracking, breakdowns, and Direct referrer fallback.
  - **Category H (45–50):** Edge cases, payload validation, XSS escaping, concurrent clicks, empty states, and pagination math.

---

## 16. Vercel Deployment Instructions

1. **Push to GitHub** (ensure `.env.local` is never committed; verify `.gitignore`).
2. **Import Project into Vercel:**
   - Framework Preset: **Next.js**
   - Root Directory: `./`
3. **Configure Environment Variables in Vercel Project Settings:**
   - `DATABASE_URL`: Your pooled Neon connection string (`sslmode=require`).
   - `AUTH_SECRET`: Strong 32-character base64 secret (`openssl rand -base64 32`).
   - `NEXTAUTH_URL`: Your production custom domain (e.g. `https://linkpulse.vercel.app`).
   - `NEXT_PUBLIC_APP_URL`: Same as `NEXTAUTH_URL`.
   - `UPSTASH_REDIS_REST_URL`: Upstash REST URL.
   - `UPSTASH_REDIS_REST_TOKEN`: Upstash REST Token.
4. **Build & Output Settings:**
   - Build Command: `next build`
   - Install Command: `npm install` (runs `postinstall: prisma generate` automatically).
5. **Deploy:** Click **Deploy**. Vercel will build the application, generate Prisma Client, and deploy serverless functions.

---

## 17. Completed Features Checklist

- [x] Responsive Marketing Landing Page (`/`) with branding, features, and how-it-works
- [x] Secure Registration (`/register`) and Login (`/login`)
- [x] Authenticated Dashboard (`/dashboard`) with link creation and 3-column summary stats bar
- [x] Loading skeleton states and empty state views
- [x] Public High-Speed Redirection (`/[shortCode]`) with custom 404, Expired, and Inactive pages
- [x] Dedicated Full Analytics Page (`/links/[id]`) with 14-day trend charts, referrers, and device/browser stats
- [x] Dedicated Edit Page (`/links/[id]/edit`) and quick-edit modal with alias modification warnings
- [x] Destination URL editing with real-time protocol validation
- [x] Case-insensitive alias uniqueness check excluding current link ID
- [x] Reserved route blocklist protection
- [x] Distributed rate limiting via Upstash Redis (10 links/hour per user)
- [x] PII-free click tracking and referrer normalization
- [x] Pagination support on `GET /api/links` (`?page=1&limit=20`)
- [x] Idempotent database seed script (`npm run db:seed`)
- [x] 69/69 Automated Tests Passing

---

## 18. Known Limitations

- **Rate Limit Window:** Link creation rate limiting is currently configured on an hourly sliding window. Burst-limiting over short intervals (e.g., 5 links/minute) can be added as traffic scales.
- **Referrer Privacy Policies:** Modern browsers stripping referrers via `strict-origin-when-cross-origin` will cause those clicks to be reported under the `"Direct"` category.

---

## 19. Future Improvements

- **Custom Domain Support:** Allow pro users to connect custom domains for their short links (e.g., `go.brand.com`).
- **QR Code Generation:** Add downloadable vector SVG/PNG QR codes for short links directly on the analytics page.
- **UTM Tag Builder:** Built-in UTM campaign parameter builder inside the link creation form.
- **Export Analytics:** CSV/JSON report downloads for link click telemetry.
- **Webhook Alerts:** Webhook notifications when a link exceeds click milestones or reaches its expiration date.

---

## 20. AI Tools & Attribution

This project was developed with architectural planning, code verification, and testing assistance from **Google Antigravity (Gemini)**. All code and test suites have been inspected, reviewed, and verified by the author.

---

## 21. License

This project is licensed under the **MIT License**.
