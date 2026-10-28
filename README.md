# LinkPulse ⚡

**Smart URL Shortener & Analytics**

> A production-quality, Bitly-like URL shortener with real-time click analytics. Built as a Full-Stack AI Engineering Intern assignment.

---

## Status

🚧 **Under Active Development** — Building phase by phase.

| Phase | Description | Status |
|---|---|---|
| 0 | Project Foundation | ✅ Complete |
| 1 | Database & Data Model | 🔜 Next |
| 2 | Authentication | ⏳ Pending |
| 3 | Link Creation | ⏳ Pending |
| 4 | Short URL Redirect | ⏳ Pending |
| 5 | Analytics | ⏳ Pending |
| 6 | Frontend UI | ⏳ Pending |
| 7 | Link Management | ⏳ Pending |
| 8 | Automated Tests | ⏳ Pending |
| 9 | Seed / Demo Data | ⏳ Pending |
| 10 | Documentation | ⏳ Pending |
| 11 | Deployment | ⏳ Pending |

---

## Quick Start

### Prerequisites
- Node.js 18+
- npm 9+
- PostgreSQL database (or [Neon](https://neon.tech) free tier)
- [Upstash](https://upstash.com) Redis (free tier, for rate limiting)

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-username/linkpulse.git
cd linkpulse

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local and fill in your values

# 4. Run database migrations (Phase 1+)
# npx prisma migrate dev

# 5. Seed demo data (Phase 9+)
# npm run db:seed

# 6. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

See [`.env.example`](.env.example) for a full list with descriptions.

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_URL` | Full URL of the app |
| `NEXTAUTH_SECRET` | Random secret for JWT signing |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token |
| `NEXT_PUBLIC_APP_URL` | Public app URL (client-accessible) |
| `NEXT_PUBLIC_APP_NAME` | App display name |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Database | PostgreSQL via Neon |
| ORM | Prisma |
| Auth | Auth.js (NextAuth v5) |
| Rate Limiting | Upstash Redis |
| Validation | Zod |
| Short Codes | nanoid |
| UA Parsing | ua-parser-js |
| Testing | Vitest |
| Deployment | Vercel + Neon + Upstash |

---

## Architecture

```
src/
├── app/                  # Next.js App Router (pages + API routes)
│   ├── [code]/route.ts   # Short URL redirect handler (public)
│   ├── api/              # REST API endpoints
│   ├── dashboard/        # Authenticated dashboard
│   └── ...
├── lib/                  # Shared utilities (Prisma client, auth config, etc.)
├── services/             # Pure business logic (testable, no HTTP)
├── validators/           # Zod schemas for input validation
└── styles/               # Global CSS and design tokens
tests/                    # Vitest test suite
prisma/                   # Database schema and migrations
```

**Key design decisions:**
- **Next.js full-stack**: Single repo, single deployment, no CORS complexity
- **Service layer**: Business logic separated from route handlers for testability
- **Fire-and-forget analytics**: Click recording never blocks redirects
- **307 redirects**: Prevents browser caching so destination changes take effect immediately
- **Ownership via session**: All mutations verified against `session.user.id`, not request body

---

## Data Model

> Full schema defined in Phase 1.

```
User 1 ──< Link 1 ──< Click
```

- **User**: email, passwordHash, name
- **Link**: shortCode, originalUrl, userId, title, isActive, expiresAt
- **Click**: linkId, timestamp, referrer, deviceType, browser, ipHash

---

## API Endpoints

> Implemented progressively — see individual phase branches.

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | No | Register new user |
| `GET` | `/api/links` | Yes | List user's links |
| `POST` | `/api/links` | Yes | Create short link |
| `GET` | `/api/links/[id]` | Yes | Get link (owner) |
| `PATCH` | `/api/links/[id]` | Yes | Update link (owner) |
| `DELETE` | `/api/links/[id]` | Yes | Delete link (owner) |
| `GET` | `/api/links/[id]/analytics` | Yes | Get click analytics |
| `GET` | `/[code]` | No | Redirect short URL |

---

## Running Tests

```bash
# Run all tests once
npm test

# Watch mode
npm run test:watch
```

---

## Demo Credentials

> Available after running the seed script in Phase 9.

```
Email:    demo@linkpulse.io
Password: Demo1234!
```

---

## AI Tools Used

This project was built with assistance from **Google Antigravity (Gemini)** for:
- Architecture planning and decision analysis
- Code generation and review
- Documentation drafting

All generated code was reviewed, understood, and adapted by the developer.

---

## License

MIT
