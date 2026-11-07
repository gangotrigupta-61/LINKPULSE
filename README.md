# LinkPulse ⚡

**Smart URL Shortener & Real-Time Analytics**

> A production-grade, full-stack URL shortener and link analytics platform built with Next.js 16 (App Router), TypeScript, Prisma ORM, Neon PostgreSQL, Auth.js, and Upstash Redis.

---

## Live Demo & Repository

- **Live Application URL:** https://linkpulse-nine-nu.vercel.app
- **GitHub Repository:** `[https://github.com/your-username/linkpulse]` *(Placeholder)*
- **Demo Accounts (Public Demonstration):**
  - **Account 1:** `demo@linkpulse.io` | Password: `Demo1234!`
  - **Account 2:** `jane@linkpulse.io` | Password: `Demo1234!`

> ⚠️ *Note: These accounts are provided strictly for demonstration and code evaluation. Do not use them for personal or production links.*

---

## 1. Project Overview

LinkPulse addresses the fragmentation, security risks, and high cost of modern link management. Creators, marketers, and developers frequently deal with cumbersome, unbranded URLs that offer no performance visibility without expensive third-party subscriptions.

LinkPulse delivers:
- **Fast, Collision-Resistant Link Shortening:** Generates secure 7-character nanoid slugs or user-defined branded custom aliases.
- **Privacy-Centric, Real-Time Analytics:** Captures click timestamps, referrers, device categories, and browser clients with zero latency overhead and without collecting raw IP addresses or personal identifiable information (PII).
- **Enterprise-Grade Security:** Server-side authentication, salted bcrypt password hashing, per-user distributed rate limiting, and owner-isolated link management.

### Screenshot Placeholder
```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│                    [ LinkPulse Dashboard Preview ]                     │
│                                                                        │
│   [ Total Links: 10 ]     [ Total Clicks: 500 ]     [ Active: 6 ]      │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │  /docs-guide  →  https://nextjs.org/docs           [85 Clicks] │   │
│   │  /design-sys  →  https://figma.com                 [90 Clicks] │   │
│   └────────────────────────────────────────────────────────────────┘   │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Features

- [x] **High-Speed Redirection (`/[shortCode]`):** Optimized route resolution that redirects visitors immediately while logging analytics asynchronously in the background.
- [x] **Custom Aliases:** Claim memorable slugs (e.g., `/summer-launch`, `/docs-guide`) with case-insensitive uniqueness checks.
- [x] **Automatic Short-Code Generation:** Generates collision-resistant 7-character nanoid identifiers when no alias is specified.
- [x] **Reserved-Word Protection:** Blocks over 30 critical system slugs (`/dashboard`, `/api`, `/login`, `/admin`, etc.) to prevent routing collisions.
- [x] **Link Expiration:** Optional future expiration dates. Visitors to expired links see an informative, user-friendly expiration screen.
- [x] **Link Activation / Deactivation:** Instantly toggle links active or inactive without deleting historical analytics data.
- [x] **Destination URL Editing:** Modify the target destination URL of existing links with real-time protocol validation (`http://` / `https://`).
- [x] **Click Telemetry:** Records timestamp, HTTP referrer, client device (mobile, desktop, tablet), and browser family (Chrome, Safari, Firefox, Edge).
- [x] **Interactive Analytics Dashboard:** Real-time metrics visualization with 14-day click trend bars, top referrer rankings (with safe Direct visit fallback), and device/browser breakdowns.
- [x] **User Authentication & Authorization:** Multi-tenant credential authentication with Auth.js (NextAuth v5), secure session cookies, and password visibility toggle.
- [x] **User-Specific Link Isolation:** Strict server-side ownership enforcement — users can only view, edit, or delete their own links.
- [x] **Distributed Sliding-Window Rate Limiting:** Enforces 10 link creations per user per hour via Upstash Redis with HTTP 429 and `Retry-After` headers.
- [x] **Responsive UI & Design System:** Lightweight, pure CSS custom property design system tailored for mobile, tablet, and desktop viewports.
- [x] **Pagination Support:** `GET /api/links?page=1&limit=20` with backward-compatible array fallback.
- [x] **Idempotent Database Seeding:** Ready-to-use development and demo seed script preloaded with 2 demo users, 10 links, and 500 realistic click events.

---

## 3. Demo Credentials

The database is pre-seeded with two demo accounts to test user isolation, link ownership, and analytics:

| Account | Email | Password | Role / Purpose |
| :--- | :--- | :--- | :--- |
| **Demo User** | `demo@linkpulse.io` | `Demo1234!` | Primary account: 5 seeded links (active, expired, disabled), ~250 clicks |
| **Jane Doe** | `jane@linkpulse.io` | `Demo1234!` | Secondary account: 5 seeded links (active, expired, disabled), ~250 clicks |

*To test multi-tenant security: Log into `demo@linkpulse.io`, inspect the links, then switch to `jane@linkpulse.io` to verify that each user's links and analytics remain isolated.*

---

## 4. Quick Start

### Prerequisites
- **Node.js:** v18.17+, v20+, or v24+
- **npm:** v9+
- **PostgreSQL:** Neon PostgreSQL database (free tier)
- **Redis:** Upstash Redis database (free tier)

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/linkpulse.git
cd linkpulse
```

### 2. Install Dependencies
```bash
npm install
```
*(Automatically triggers `postinstall: prisma generate` to build Prisma Client)*

### 3. Configure Environment Variables
```bash
cp .env.example .env.local
```
Fill in `.env.local` with your database and authentication secrets (see table below).

### 4. Apply Database Migrations
```bash
npx prisma migrate dev
# Or verify current migration status:
npx prisma migrate status
```

### 5. Seed Demo Data
```bash
npm run db:seed
# Or directly:
npx prisma db seed
```
*(Populates 2 demo accounts, 10 links, and 500 click events idempotently)*

### 6. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 5. Environment Variables

Create `.env.local` in the project root. All required variables are documented in [`.env.example`](.env.example):

| Variable | Scope | Description | Safe Example Placeholder |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | Server | Pooled Neon PostgreSQL connection string (`sslmode=require&connect_timeout=30`) | `postgresql://user:pass@ep-xyz-pooler.region.neon.tech/neondb?sslmode=require&connect_timeout=30` |
| `AUTH_SECRET` | Server | Auth.js JWT session encryption key (32-character base64 string) | Generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Server | Canonical base URL of the application for callback validation | `http://localhost:3000` (Local) / `https://linkpulse.vercel.app` (Prod) |
| `NEXT_PUBLIC_APP_URL` | Client/Server | Public base URL used when constructing short link URLs | `http://localhost:3000` (Local) / `https://linkpulse.vercel.app` (Prod) |
| `UPSTASH_REDIS_REST_URL`| Server | Upstash Redis REST endpoint for distributed rate limiting | `https://your-upstash-instance.upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN`| Server| Upstash Redis REST API authentication bearer token | `your_secret_upstash_rest_token` |

> 🔒 *Security Note: Never commit `.env`, `.env.local`, or any actual secret values to version control. Both files are strictly ignored by `.gitignore`.*

---

## 6. System Architecture

The following Mermaid diagram details the end-to-end request flow, authentication boundaries, and data persistence:

```mermaid
flowchart TD
    User["👤 Visitor / User Browser"]
    
    subgraph Edge ["🌐 Vercel Edge / Network Layer"]
        Proxy["Next.js Proxy / Middleware<br/>(Route Protection & Auth Guard)"]
        Headers["Security Headers<br/>(X-Frame-Options, nosniff, Referrer-Policy)"]
    end
    
    subgraph App ["⚡ Next.js App Router (Server-Side)"]
        Landing["Landing Page (/)"]
        AuthPages["Auth Pages (/login, /register)"]
        Dashboard["Dashboard & Analytics (/dashboard, /links/*)"]
        PublicRedirect["Public Redirect Route (/[shortCode])"]
        
        subgraph Services ["💼 Business Logic Service Layer"]
            LinkService["links.service.ts"]
            MgmtService["link-management.service.ts"]
            RedirectService["redirect.service.ts"]
            AnalyticsService["analytics.service.ts"]
        end
    end
    
    subgraph External ["☁️ Cloud Infrastructure"]
        AuthModule["🔐 Auth.js (NextAuth v5)<br/>JWT Sessions & bcryptjs"]
        Upstash["🚦 Upstash Redis<br/>(Sliding-Window Rate Limiting)"]
        NeonDB["🐘 Neon PostgreSQL<br/>(Prisma Connection Pool)"]
    end

    User --> Headers --> Proxy
    Proxy -->|Public| Landing
    Proxy -->|Auth| AuthPages
    Proxy -->|Protected| Dashboard
    Proxy -->|Short URL| PublicRedirect

    PublicRedirect --> RedirectService
    RedirectService --> NeonDB
    PublicRedirect -.->|Async Non-Blocking| AnalyticsService
    AnalyticsService -.-> NeonDB

    Dashboard --> MgmtService
    Dashboard --> LinkService
    LinkService --> Upstash
    LinkService --> NeonDB
    MgmtService --> NeonDB
    AuthPages --> AuthModule
    AuthModule --> NeonDB
```

---

## 7. Data Model

LinkPulse uses a normalized PostgreSQL database managed through Prisma:

```mermaid
erDiagram
    USER ||--o{ LINK : "owns"
    LINK ||--o{ CLICK : "tracks"

    USER {
        string id PK "cuid"
        string email UK "unique, normalized lowercase"
        string passwordHash "salted bcrypt hash"
        string name "optional display name"
        datetime createdAt "default now"
        datetime updatedAt "auto-updated"
    }

    LINK {
        string id PK "cuid"
        string shortCode UK "unique 7-char code or custom alias"
        string originalUrl "validated http/https destination"
        string userId FK "references USER(id), cascade delete"
        string title "optional link label"
        boolean isActive "default true"
        datetime expiresAt "optional expiration date"
        datetime createdAt "default now"
        datetime updatedAt "auto-updated"
    }

    CLICK {
        string id PK "cuid"
        string linkId FK "references LINK(id), cascade delete"
        datetime timestamp "default now"
        string referrer "extracted hostname or full URL"
        string deviceType "mobile | desktop | tablet"
        string browser "Chrome | Safari | Firefox | Edge"
        string ipHash "optional non-PII hash"
        string country "optional country code"
    }
```

### Key Schema Characteristics
- **Fast Lookups:** B-Tree index on `Link.shortCode` guarantees sub-millisecond redirect resolution.
- **Composite Analytics Indexing:** Composite index `@@index([linkId, timestamp])` allows performant date-range queries without full-table scans.
- **Cascade Deletion:** Deleting a user automatically purges all their links, and deleting a link removes all associated click telemetry.

---

## 8. API Reference

All API routes strictly follow REST standards, return standard JSON responses, and enforce server-side validation:

| Method | Endpoint | Auth Required | Description | Status Codes |
| :--- | :--- | :---: | :--- | :--- |
| `POST` | `/api/auth/register` | No | Registers a new user account with hashed password | `201`, `400`, `409`, `503` |
| `GET` | `/api/auth/[...nextauth]` | No | Auth.js session handling, CSRF token, and provider endpoints | `200` |
| `POST` | `/api/auth/[...nextauth]` | No | Processes credentials login and sign-out requests | `200`, `401` |
| `GET` | `/api/links` | **Yes** | Lists links owned by the authenticated user. Supports `?page=1&limit=20` pagination | `200`, `401`, `500` |
| `POST` | `/api/links` | **Yes** | Creates a new short link with optional alias, title, and expiration. Rate-limited to 10/hr | `201`, `400`, `401`, `409`, `429` |
| `GET` | `/api/links/[id]` | **Yes** | Fetches full link details for the verified owner | `200`, `401`, `403`, `404` |
| `PATCH`| `/api/links/[id]` | **Yes** | Updates destination URL, custom alias, title, expiry, or active state (owner only) | `200`, `400`, `401`, `403`, `404`, `409` |
| `DELETE`| `/api/links/[id]`| **Yes** | Deletes a link and cascades to its click records (owner only) | `204`, `401`, `403`, `404` |
| `GET` | `/api/links/[id]/analytics` | **Yes** | Retrieves aggregated click trends, referrers, devices, and browser metrics (owner only) | `200`, `401`, `403`, `404` |
| `GET` | `/[shortCode]` | No | Public redirection handler. Records telemetry asynchronously and redirects to destination | `307`, `404` (Inactive/Expired UI) |

---

## 9. Design Decisions

1. **Next.js 16 App Router:** Single full-stack architecture eliminating cross-origin CORS overhead. Combines static marketing pages with server-rendered dynamic routes and secure API route handlers.
2. **Neon Serverless PostgreSQL & Prisma:** Neon provides auto-scaling PostgreSQL with built-in connection pooling. Prisma delivers strict TypeScript schema types, automated migration tracking, and protection against SQL injection.
3. **Auth.js (NextAuth v5):** Implements JWT stateless sessions (30-day lifecycle) with `httpOnly`, `sameSite`, and `secure` cookie configurations. Completely eliminates server-side session table lookups.
4. **Collision-Resistant Short Codes (nanoid):** 7-character alphanumeric alphabet (`[a-zA-Z0-9]`) yields over $62^7 \approx 3.5 \times 10^{12}$ combinations, maintaining sub-millisecond generation without database sequence locks.
5. **Distributed Sliding-Window Rate Limiting:** Traditional fixed-window limiters suffer from boundary traffic doubling. The sliding-window algorithm on Upstash Redis tracks rolling timestamps, preventing burst link spamming across serverless instances.
6. **Fire-and-Forget Telemetry Logging:** Public link redirection does not `await` click insertion. Redirect responses complete immediately, ensuring low latency even under heavy traffic.

---

## 10. Automated Testing

LinkPulse maintains an automated test suite executed with Vitest:

```bash
# Run all automated tests once
npm test

# Run tests in watch mode
npm run test:watch
```

### Verified Test Suite Breakdown (69 Tests Passing)
- **`tests/phase4-5.test.ts` (19 Tests):** Destination URL editing, invalid scheme rejection, cross-user mutation blocks, click telemetry logging, referrer extraction, and deletion verification.
- **`tests/phase6-7-8.test.ts` (50 Tests):**
  - **Category A (Tests 1–11):** Link creation, invalid URL rejection, `javascript:`, `data:`, and `ftp:` blocking, alias regex enforcement, reserved-word collision blocking, duplicate alias conflicts, expiration date validation, and rate limit enforcement.
  - **Category B (Tests 12–15):** Unauthenticated request blocking, credential lookup verification, invalid password rejection, and route protection callbacks.
  - **Category C (Tests 16–20):** Active redirects, non-existent 404 responses, expired link blocking, disabled link blocking, and reserved word bypassing.
  - **Category D (Tests 21–26):** Click event persistence, timestamp fidelity, referrer trimming, device parsing, browser classification, and non-blocking failure tolerance.
  - **Category E (Tests 27–31):** Multi-tenant link isolation, unauthorized mutation prevention, unauthorized analytics protection, and session-derived `userId` verification.
  - **Category F (Tests 32–37):** Destination URL updating, title updating, expiry updating, alias updating with self-exclusion, active status toggling, and link deletion.
  - **Category G (Tests 38–44):** Total click accuracy, date grouping (`YYYY-MM-DD`), latest click resolution, device breakdown, browser breakdown, Direct referrer fallback, and ownership verification.
  - **Category H (Tests 45–50):** Schema payload validation, XSS title string sanitization, concurrent click resilience, empty state handling, pagination math, and long query URL validation.

---

## 11. Completed Features

- [x] Responsive Marketing Landing Page (`/`) with feature showcase and how-it-works section
- [x] Secure Registration (`/register`) and Login (`/login`) with password visibility toggle
- [x] Authenticated Dashboard (`/dashboard`) with 3-column summary statistics bar (Total Links, Total Clicks, Active Links)
- [x] Loading skeleton cards and empty state UI
- [x] Public High-Speed Redirection (`/[shortCode]`) with custom 404, Expired, and Disabled screens
- [x] Dedicated Full Analytics Page (`/links/[id]`) with 14-day trend charts, referrers, devices, and browsers
- [x] Dedicated Link Edit Page (`/links/[id]/edit`) and modal with alias change warnings
- [x] Destination URL editing with real-time protocol validation
- [x] Custom alias support with case-insensitive uniqueness check (excluding self)
- [x] Reserved route blocklist protection (30+ system routes blocked)
- [x] Distributed sliding-window rate limiting via Upstash Redis (10 links/hour per user)
- [x] PII-free click tracking and referrer hostname normalization
- [x] Pagination support on `GET /api/links` (`?page=1&limit=20`)
- [x] Database cold-start auto-retry for seamless Neon wake-ups
- [x] Idempotent database seed script (`npm run db:seed`) creating 2 users, 10 links, and 500 clicks
- [x] 69/69 Automated Tests Passing

---

## 12. Unfinished Features

- **UTM Tag Builder:** Campaign parameter builder in the create link modal is not yet automated.
- **QR Code Vector Download:** Short link QR code download on the details page is currently planned for a future release.

---

## 13. Future Improvements

1. **Custom Domain Support:** Allow users to connect custom branded domains (e.g. `go.yourbrand.com`) using Cloudflare or Vercel domain verification.
2. **QR Code Generator:** Generate downloadable SVG/PNG QR codes for every created short link.
3. **CSV/PDF Analytics Export:** One-click data exports for link click history and metrics.
4. **Unique Visitor Telemetry:** Non-PII daily unique visitor estimates using cryptographic HyperLogLog counters in Redis.
5. **Webhook Alerts:** Webhook notifications when a link crosses engagement milestones (e.g., 1,000 clicks) or approaches expiration.

---

## 14. AI Tools Used

This project was developed with architectural design, code verification, and automated testing assistance from **Google Antigravity (Gemini)**. All architectural decisions, source code, database migrations, and test suites were reviewed, validated, and tested by the engineer.

---

## 15. License & Terms

All rights reserved. This repository and its contents are part of a technical engineering evaluation and internship assignment. Unauthorized commercial distribution or redistribution without permission is prohibited.

---

## 16. Production Deployment Preparation (Vercel + Neon)

### Hosting Architecture
- **Web Application & API:** [Vercel](https://vercel.com) (Next.js App Router)
- **PostgreSQL Database:** [Neon](https://neon.tech) (Serverless PostgreSQL with connection pooling)
- **Distributed Cache & Rate Limiting:** [Upstash Redis](https://upstash.com)
- **Version Control:** GitHub

### Production Migration Strategy
When deploying to production, **never** run `prisma migrate reset` or `prisma db push`. Always apply versioned migrations safely:
```bash
# Apply pending versioned migrations in production
npx prisma migrate deploy
```
On Vercel, `"postinstall": "prisma generate"` in `package.json` guarantees that the Prisma Client is automatically regenerated during every deployment build.

### Production Seeding Procedure (One-Time / Optional)
To seed the demonstration accounts and initial links on a production or staging Neon database, run:
```bash
# Execute idempotent seed against target database
npx prisma db seed
```
*(The script uses upsert logic and count checks; running it multiple times will not duplicate accounts or click counts)*

### Custom Domain Configuration (Vercel)
1. Go to your Vercel Project Dashboard → **Settings** → **Domains**.
2. Enter your custom domain (e.g., `linkpulse.yourdomain.com`).
3. Add the recommended `CNAME` or `A` DNS records at your domain registrar.
4. Update `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` in Vercel Environment Variables to reflect your new custom domain.
