# LinkPulse — Video Demonstration Script (3–5 Minutes)

**Project:** LinkPulse — Smart URL Shortener & Real-Time Analytics  
**Target Duration:** 3 to 5 minutes  
**Target Audience:** Technical Recruiters, Engineering Managers, Assignment Reviewers  
**Presenter Tone:** Professional, confident, concise, and engineering-focused  

---

## Pre-Recording Checklist

- [ ] Browser window open to `http://localhost:3000` (or production URL).
- [ ] Secondary browser / incognito window open for testing redirects and logout.
- [ ] Database seeded: 2 demo users, 10 links, 500 click events (`npm run db:seed`).
- [ ] Terminal ready showing clean build and passing tests (`npm test`).
- [ ] Zoom level set to 110%–125% for high-DPI video readability.

---

## Segment Breakdown & Timings

```
0:00 – 0:35  | 1. Introduction & Problem Statement
0:35 – 1:15  | 2. Technology Stack & System Architecture
1:15 – 1:55  | 3. Authentication & Demo Account Login
1:55 – 2:40  | 4. Link Creation & Collision Resistance
2:40 – 3:20  | 5. Public Redirection & Live Telemetry Ingestion
3:20 – 4:05  | 6. Real-Time Analytics Dashboard & Data Isolation
4:05 – 4:35  | 7. Link Management & Status Control
4:35 – 5:00  | 8. Rate Limiting, Security, & Conclusion
```

---

## Detailed Script & Presenter Walkthrough

### 1. Introduction & Problem Statement (0:00 – 0:35)

**[Screen: LinkPulse Landing Page — `http://localhost:3000` — Hero Section]**

> **Presenter:**  
> "Hello! Today I'm excited to present **LinkPulse**, a production-grade, full-stack URL shortener and real-time link analytics platform.
>
> Modern teams and creators share hundreds of links across social media, emails, and campaigns. But standard link shorteners are often black boxes: they add redirection latency, leak user data, or gate essential analytics behind expensive enterprise tiers.
>
> LinkPulse solves this by combining instant, collision-resistant link creation with sub-millisecond redirections, privacy-first click telemetry, and deep real-time analytics — all wrapped in a responsive, modern interface."

---

### 2. Technology Stack & Architecture (0:35 – 1:15)

**[Screen: Scroll briefly through the Landing Page Features & How It Works sections]**

> **Presenter:**  
> "Under the hood, LinkPulse is built with an enterprise-grade stack:
> - **Next.js 16 (App Router)** with React Server Components and Turbopack.
> - **TypeScript 5** with strict typing and zero `any` types.
> - **PostgreSQL via Neon Serverless**, utilizing connection pooling and automatic cold-start recovery.
> - **Prisma ORM 6** for type-safe schema definitions and cascading relations.
> - **Auth.js (NextAuth v5)** with bcrypt password hashing for session security.
> - **Upstash Redis** running a distributed sliding-window algorithm that enforces a strict 10 link creations per user per hour limit, backed by fail-closed production guards.
>
> Let's dive right into the live product."

---

### 3. Authentication & Demo Account Login (1:15 – 1:55)

**[Screen: Click 'Sign In' to navigate to `/login`]**

> **Presenter:**  
> "First, let's explore authentication. LinkPulse supports new user registration with client and server Zod validation, as well as password visibility toggles on all password fields.
>
> To make technical evaluation effortless, LinkPulse comes preloaded with two distinct demo accounts.
>
> Let's log in with our primary demo account: `demo@linkpulse.io` and password `Demo1234!`."

**[Action: Type `demo@linkpulse.io`, enter password, toggle the eye icon to verify visibility, and click 'Log In']**

> **Presenter:**  
> "Upon authentication, the JWT session is created, secure HTTP-only session cookies are set, and we are redirected straight to our authenticated dashboard."

---

### 4. Link Creation & Collision Resistance (1:55 – 2:40)

**[Screen: Authenticated Dashboard `/dashboard` showing Stats Bar and Link Creation Form]**

> **Presenter:**  
> "Here on the dashboard, we see an overview of our links and total clicks.
>
> Let's create a new short link. I'll enter a destination URL: `https://nextjs.org/docs`.
>
> We can let the system automatically generate a 7-character URL-safe nanoid code, or provide a custom alias. Let's try claiming a reserved route, like `dashboard` or `login`."

**[Action: Type `dashboard` in the alias field and submit]**

> **Presenter:**  
> "Notice the server immediately rejects this with a clear validation error: over 30 system routes are protected from being claimed.
>
> Now let's enter a valid branded alias: `nextjs-demo-live` with an optional title `Next.js Official Documentation`, and click 'Shorten Link'."

**[Action: Click 'Shorten Link'. The new link appears instantly at the top of 'My Links'.]**

> **Presenter:**  
> "The link is created immediately! We see our one-click copy button, full destination URL, creation timestamp, and active status badge."

---

### 5. Public Redirection & Live Telemetry Ingestion (2:40 – 3:20)

**[Screen: Copy the newly generated short link and open a new incognito window]**

> **Presenter:**  
> "Now let's test the public redirection pipeline.
>
> In an incognito window, I'll navigate to `http://localhost:3000/nextjs-demo-live`."

**[Action: Press Enter. The browser instantly redirects to `https://nextjs.org/docs`]**

> **Presenter:**  
> "The redirect was instantaneous — returning an HTTP 307 temporary redirect.
>
> In the background, LinkPulse asynchronously records click telemetry: timestamp, device category (desktop, mobile, tablet), browser client, and normalized referrer hostname — completely privacy-preserving without storing raw IP addresses.
>
> Even if database telemetry ingestion encounters network latency, the redirect never blocks."

---

### 6. Real-Time Analytics Dashboard & Data Isolation (3:20 – 4:05)

**[Screen: Return to Dashboard, locate `docs-guide`, and click '📊 Full Analytics' to navigate to `/links/[id]`]**

> **Presenter:**  
> "Let's inspect the analytics for one of our preloaded demo links: `/docs-guide`.
>
> Here on the dedicated analytics page, LinkPulse presents comprehensive telemetry:
> - **Total Clicks & Last Click Timestamp:** Instant summary metrics.
> - **Daily Click Trends:** Visual distribution across the past 30 days.
> - **Device Breakdown:** Mobile, Desktop, and Tablet distribution.
> - **Browser Breakdown:** Chrome, Safari, Firefox, and Edge splits.
> - **Top Referrers:** Normalizing referrers into clean domains like `twitter.com`, `google.com`, and a safe `'Direct'` classification for privacy-restricted visits.
>
> And crucially: tenant data is strictly isolated. User B (`jane@linkpulse.io`) cannot view, query, or modify Alex's links or analytics under any circumstances."

---

### 7. Link Management & Status Control (4:05 – 4:35)

**[Screen: Click 'Back to Dashboard', find a link, and click '✏️ Edit']**

> **Presenter:**  
> "LinkPulse gives users full lifecycle control over their links:
> - We can update the destination URL at any time without changing the short link.
> - If we edit the custom alias, a visual warning alerts us that previous links will change.
> - We can set or clear expiration timestamps.
> - And with a single toggle, we can immediately deactivate a link."

**[Action: Click 'Deactivate' on a link. The badge turns red 'Inactive'. Open that link in another tab to show the inactive notice page.]**

> **Presenter:**  
> "Notice that when a user visits a disabled or expired link, LinkPulse renders a branded, user-friendly status page rather than a cryptic 500 server crash."

---

### 8. Rate Limiting, Security, & Conclusion (4:35 – 5:00)

**[Screen: Return to Landing Page or terminal showing 69/69 passing tests]**

> **Presenter:**  
> "For security:
> - Every link creation is protected by Upstash Redis distributed sliding-window rate limiting. In production, missing credentials or Redis service outages fail-closed to prevent abuse.
> - We have 69 automated unit, integration, and security tests covering authentication, link creation, redirects, rate limiting, and analytics.
> - TypeScript compiles with strict zero-warning compliance, and the Next.js production build passes with full route pre-rendering.
>
> In the future, we look forward to adding custom domain CNAME routing, downloadable vector QR codes, and webhook notifications.
>
> Thank you for reviewing LinkPulse! All code, architecture diagrams, and testing instructions are documented in the repository README."

---

## Evaluation Checklist for Reviewers

| Feature Demonstrated | Verified in Script |
| :--- | :---: |
| Full-Stack Next.js 16 + Neon PostgreSQL + Prisma architecture | Yes (0:35) |
| Demo account authentication (`demo@linkpulse.io`) | Yes (1:15) |
| Password visibility toggle and session persistence | Yes (1:35) |
| Link creation with collision & reserved-route protection | Yes (1:55) |
| Non-blocking public redirection (`307`) | Yes (2:40) |
| Real-time analytics (trends, devices, browsers, referrers) | Yes (3:20) |
| Cross-tenant ownership authorization & isolation | Yes (3:55) |
| Link lifecycle management (edit destination, disable, expiry) | Yes (4:05) |
| Distributed sliding-window rate limiting & production safety | Yes (4:35) |
| 69/69 automated test suite passing | Yes (4:45) |
