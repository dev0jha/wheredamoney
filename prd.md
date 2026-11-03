# WhereDaMoney: Product Requirements Document

*Version 1.1 · Status: Draft · Platform: web-first, installable PWA · Stack: Next.js, Go, PostgreSQL, Drizzle, Docker, Groq*

## 1. Overview

WhereDaMoney is a web-first, installable app (PWA) where individuals (and later small teams) track **income** and **expenditure**, record **payments made to people (payees)**, and automatically notify those payees by email. Users get a dashboard with spending insights, a **monthly slip (statement)** that highlights where spending was highest, and optional **AI analysis** powered by Groq using the **user's own API key** (BYOK).

**Tagline:** *Know where every rupee goes.*

**Platform:** WhereDaMoney launches as a responsive web app that users install on their phone as a PWA (progressive web app). Native store apps are a later option, not part of v1.

### 1.1 Problem

- People lose track of where money goes each month.
- When money is given to someone (rent, salary, loan, friend, vendor), there is no proof or confirmation sent to the receiver.
- Spreadsheets give totals but no insight into *why* spending increased.

### 1.2 Goals

1. Fast, low-friction entry of income and expenses.
2. Automatic email receipt to a payee whenever a payment is recorded.
3. Clear dashboard: where money came from, where it went, what is trending up.
4. Month-end slip that calls out the categories and payees with the highest or increased spending.
5. AI insights using the user's own Groq key, so the platform pays no AI cost and the key stays private.

### 1.3 Non-goals (v1)

- Bank account syncing (Plaid, open banking).
- Actually moving money or payment processing.
- Multi-currency conversion and tax filing.
- Native iOS and Android apps in v1 (the web app is responsive and installable as a PWA; a native wrap comes later if needed).

### 1.4 Product Principles

- **Fast entry:** adding an expense takes under 10 seconds and no more than 4 taps on a phone.
- **No surprises:** WhereDaMoney never emails a payee unless the user has turned notifications on for that payee.
- **Explain, don't just show:** every chart and slip answers "why did this go up?".
- **Private by default:** the Groq key stays encrypted on the server, and AI sees only minimized data.
- **Works on a weak connection:** core screens load from cache and entries save offline.

### 1.5 Naming and Brand

- Product name: **WhereDaMoney** (one word, capital W, D and M). Tagline: *Know where every rupee goes.*
- Tone: friendly, plain, a little playful; clear and serious when money or errors are involved.
- Before launch: confirm the domain (for example wheredamoney.com or .app), social handles, and run a trademark search.
- Emails to payees are sent in the user's name and carry a small "Sent via WhereDaMoney" footer.

## 2. Target Users and Personas

| Persona | Need |
| --- | --- |
| Individual / freelancer | Track salary, client income, daily spending; send receipts to people they pay |
| Household manager | Track shared expenses, rent, staff salaries, and notify recipients |
| Small shop owner | Record vendor payments, send payment confirmations, see monthly outflow |

## 3. Core Features

### 3.1 Authentication and Account

- Sign up and log in with email and password; optional Google login.
- Email verification and password reset.
- Session via secure HTTP-only cookies (or short-lived JWT plus refresh token).
- Profile: name, default currency, timezone, month start day (for users paid mid-month).

### 3.2 Income Management

- Add, edit, delete income entries: amount, source, category (salary, freelance, business, gift, other), date, notes.
- Recurring income (monthly salary) with auto-creation.
- Attachment support (optional, v1.1).

### 3.3 Expenditure Management

- Add, edit, delete expenses: amount, category, date, payment method (cash, UPI, card, bank), notes, optional receipt image.
- Custom categories with color and icon; default set provided (food, rent, transport, bills, health, shopping, education, entertainment, other).
- Recurring expenses (rent, subscriptions).
- Bulk import via CSV; export to CSV.

### 3.4 Payees and Payment Notifications

This is the key differentiator.

- **Payee directory:** name, email, phone (optional), relationship tag (landlord, employee, friend, vendor), notes.
- When an expense is saved with a payee marked *"Notify payee"*, the system queues an email to the payee containing: payer name, amount, currency, date, purpose or note, payment method, and a unique reference number.
- **Per-payee setting:** auto-notify on or off, so users are not forced to email everyone.
- **Email log:** each notification has a status (queued, sent, delivered, failed, bounced) visible in the dashboard, with a **Resend** action.
- **Edit and delete rules:** if an amount is edited after sending, offer to send a *correction email*; if deleted, offer to send a *cancellation email*.
- **Opt-out:** every email includes an unsubscribe link; opted-out payees are never emailed again.
- Optional: PDF receipt attached to the email.

### 3.5 Dashboard

- Summary cards: total income, total expenses, net savings, savings rate for the selected month.
- Charts: income vs expense trend (6 or 12 months), category breakdown (donut), top payees, daily spend heatmap.
- Filters: date range, category, payee, payment method.
- Budget bars per category with warning at 80% and alert at 100% (budgets are v1.1 if time is tight).
- Recent transactions table with search, sort, and pagination.

### 3.6 Monthly Slip (Statement)

Generated automatically on the last day of each month (and on demand).

Contents:

1. Opening balance, total income, total expenses, closing balance.
2. **Highest spending categories** ranked, with percent of total.
3. **Where expenditure was more:** categories and payees whose spend increased versus the previous month (absolute and percent change), flagged as *High*, *Unusual*, or *New*.
4. Top 5 single expenses.
5. Payee summary: total paid to each person.
6. Optional AI summary section (if the user has added a Groq key).

Delivery: viewable in-app, downloadable as PDF, and emailed to the user. Slips are stored and immutable once generated (a regenerate action creates a new version).

### 3.7 AI Analysis with Groq (BYOK)

- In Settings, the user pastes their own **Groq API key**.
- Key is validated with a lightweight test call, then **encrypted at rest** (AES-256-GCM with a server-side master key; never returned to the frontend after saving, only a masked preview such as `gsk_...a1b2`).
- AI requests are made **from the Go backend**, never from the browser.
- Features:
  - Monthly insight summary: plain-language explanation of what changed and why.
  - Anomaly explanation: "Why was my food spend 40% higher?"
  - Saving suggestions based on actual categories.
  - Chat with your data: natural-language questions answered from aggregated data.
  - Auto-categorization suggestion for new expenses from the description.
- **Privacy:** send aggregated or minimized data by default (category totals, trends). Raw notes and payee emails are never sent unless the user explicitly enables "detailed analysis". Payee emails are always stripped.
- Model is selectable (for example a Llama or Mixtral-family model available on Groq), with a sensible default and fallback on rate-limit errors.
- If no key is set, all AI features show a friendly prompt and the rest of the app works normally.
- Users can remove or rotate their key at any time; removal deletes the ciphertext immediately.

### 3.8 Notifications and Settings

- In-app and email alerts: budget exceeded, slip ready, failed email delivery.
- Settings: profile, currency, categories, payees, notification preferences, Groq key, data export, delete account.

### 3.9 Progressive Web App (PWA)

WhereDaMoney is one Next.js codebase that behaves like a phone app once installed.

- **Installable:** web manifest (name WhereDaMoney, 192 and 512 px icons plus a maskable icon, theme color, standalone display, start URL /dashboard). Custom install prompt on Android and Chrome; a step-by-step "Add to Home Screen" guide for iPhone Safari.
- **Offline:** a service worker (Serwist) caches the app shell and the last-loaded dashboard. Users can add income and expenses offline; entries are stored in IndexedDB and synced when the connection returns, with a visible "Pending sync" badge.
- **Sync rules:** the server is the source of truth. Each offline entry carries a client-generated ID so retries never create duplicates. Payee emails are sent only after the entry reaches the server.
- **Web Push:** budget alerts and "your slip is ready" notifications through the Push API with VAPID keys. Needs the user's permission, and on iPhone works only after the app is installed (iOS 16.4 or later).
- **Passkeys and app lock:** passkey (WebAuthn) login for fingerprint or Face ID, plus an optional PIN lock after inactivity.
- **Share and files:** Web Share API for sending the monthly slip PDF; camera capture for receipt photos (v1.1).
- **Updates:** new versions download in the background and a "Reload to update" prompt appears. Caches are versioned and cleared on logout so one user's data never shows for another.
- **Quality bar:** Lighthouse PWA and Accessibility scores of 90 or higher; first load under 3 s on a mid-range phone on 4G; app shell ready from cache in under 1 s.
- **Known limits:** Safari has no background sync, so iPhone users sync when they open the app. There is no App Store or Play Store listing in v1; a Capacitor wrap is the planned path if listings are needed.

### 3.10 Onboarding and Empty States

1. Sign up and verify email.
2. Pick currency and the day the month starts, then choose starter categories.
3. Add the first income and the first expense with a guided form (target: under 2 minutes).
4. Optional: add a first payee and send a test notification to the user's own email.
5. Optional: paste a Groq key to unlock AI insights.

Every empty screen (dashboard, payees, slips) explains what it will show and has one clear button to add data. A demo-data toggle lets new users preview a full dashboard.

### 3.11 Release Scope

| Release | Includes |
| --- | --- |
| MVP (phases 1 to 3) | Auth, income and expense entry, categories, payees with email receipts and delivery log, dashboard, monthly slip with PDF, responsive layout |
| v1.0 (phases 4 and 5) | Groq BYOK insights and chat, PWA install, offline entry queue, web push, passkey login, recurring entries, budgets, CSV import and export |
| v1.1 and later | Receipt photo attachments, shared household accounts, Capacitor wrap for store listings, multi-currency |

Priority rule: anything that sends an email or touches the Groq key is built and tested before polish features.

## 4. User Stories and Acceptance Criteria

| ID | Story | Acceptance criteria |
| --- | --- | --- |
| US-1 | As a user, I add an expense paid to a person so they get a confirmation | Email queued within 5 seconds; status appears in the log; reference number is unique |
| US-2 | As a user, I turn off auto-notify for one payee | No email sent for that payee; setting persists |
| US-3 | As a user, I see where I spent more this month | Dashboard and slip list categories with percent change vs last month |
| US-4 | As a user, I add my Groq key and get AI insights | Key validated, stored encrypted, insights generated; key never visible again |
| US-5 | As a user, I receive a month-end slip | Slip generated on the last day, available as PDF, emailed |
| US-6 | As a user, I fix a wrong amount after the payee was emailed | App offers to send a correction email |
| US-7 | As a payee, I can unsubscribe from emails | Unsubscribe link works without login; no further emails |
| US-8 | As a user, I install WhereDaMoney on my phone from the browser | Install prompt (Android) or guide (iPhone) is shown; the app opens full screen from the home screen |
| US-9 | As a user, I add an expense with no internet | Entry saved locally with a Pending sync badge; syncs on reconnect with no duplicates; payee email sent only after sync |
| US-10 | As a user, I get a push alert when my slip is ready or a budget is crossed | Alert arrives after permission is granted; tapping it opens the slip or the category |

## 5. System Architecture

```
[Browser]
   |
[Next.js (App Router, TypeScript)]  <-- UI, SSR, auth session handling
   |  REST/JSON over HTTPS
[Go API (Chi or Gin)]  <-- business logic, auth, AI calls, jobs
   |            |              |
[PostgreSQL] [Redis (queue)]  [External: Groq API, Email provider]
   ^
[Go worker]  <-- email sending, slip generation, recurring entries (cron)
```

### 5.1 Tech Stack

| Layer | Choice | Notes |
| --- | --- | --- |
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, Recharts, TanStack Query, React Hook Form + Zod, Serwist (PWA service worker), web-push (VAPID) |  |
| Backend | Go with Chi (or Gin), pgx, sqlc | Separate API service plus worker binary |
| Database | PostgreSQL 16 |  |
| ORM and migrations | Drizzle + drizzle-kit | See note below |
| Queue and jobs | Redis with Asynq (or a Postgres-based queue such as River to avoid Redis) | Retries, scheduling |
| Email | Resend, Postmark, or AWS SES via SMTP/API | SPF, DKIM, DMARC configured |
| AI | Groq API (OpenAI-compatible chat completions) using the user's key |  |
| PDF | Go library (chromedp or gofpdf) or a headless-render service | For slips and receipts |
| Containers | Docker, docker-compose for dev, multi-stage builds for prod |  |
| CI/CD | GitHub Actions: lint, test, build, push images |  |

**Important design note on Drizzle with a Go backend:** Drizzle is a TypeScript ORM and cannot be used inside Go. Recommended approach: keep the **Drizzle schema as the single source of truth for the database and migrations** (drizzle-kit generate and migrate), use Drizzle in Next.js only for simple server-side reads if needed, and have the Go service access the same Postgres using **pgx plus sqlc** generated from the migrated schema. The alternative is to let the Go service own migrations (goose or atlas) and drop Drizzle. Decide this before sprint 1.

### 5.2 Services in Docker Compose

- `web` (Next.js), `api` (Go), `worker` (Go), `db` (Postgres), `redis`, and in dev `mailpit` (local email capture) and `adminer` (optional).
- Healthchecks on every service; environment via `.env` files and secrets in production.

## 6. Data Model (core tables)

| Table | Key fields |
| --- | --- |
| users | id, email, password\_hash, name, currency, timezone, month\_start\_day, created\_at |
| categories | id, user\_id, name, type (income/expense), color, icon, is\_default |
| payees | id, user\_id, name, email, phone, tag, auto\_notify, unsubscribed\_at |
| incomes | id, user\_id, amount, source, category\_id, date, notes, recurring\_id |
| expenses | id, user\_id, amount, category\_id, payee\_id (nullable), date, payment\_method, notes, receipt\_url, reference\_no, notify\_payee |
| recurring\_rules | id, user\_id, type, template\_json, frequency, next\_run\_at |
| email\_notifications | id, user\_id, payee\_id, expense\_id, type (receipt/correction/cancellation), status, provider\_message\_id, error, sent\_at |
| monthly\_slips | id, user\_id, month, version, summary\_json, pdf\_url, ai\_summary, generated\_at |
| user\_ai\_settings | id, user\_id, encrypted\_groq\_key, key\_last4, model, detailed\_analysis\_enabled, updated\_at |
| budgets | id, user\_id, category\_id, month, limit\_amount |
| audit\_logs | id, user\_id, action, entity, entity\_id, metadata, created\_at |
| push\_subscriptions | id, user\_id, endpoint, p256dh, auth, user\_agent, created\_at |
| offline\_sync\_log | id, user\_id, client\_id (unique per user), entity, status, received\_at |

Guidelines: store money as integer minor units (paise or cents) with a currency code, never floats; index on (user\_id, date) for transactions; soft-delete where an email has already been sent.

## 7. API Outline (Go, versioned under /api/v1)

- **Auth:** POST /auth/register, /auth/login, /auth/logout, /auth/refresh, /auth/forgot, /auth/reset
- **Income:** GET/POST /incomes, GET/PUT/DELETE /incomes/{id}
- **Expenses:** GET/POST /expenses, GET/PUT/DELETE /expenses/{id}, POST /expenses/import
- **Payees:** GET/POST /payees, PUT/DELETE /payees/{id}
- **Notifications:** GET /notifications, POST /notifications/{id}/resend
- **Dashboard:** GET /dashboard/summary?month=, /dashboard/trends, /dashboard/categories
- **Slips:** GET /slips, GET /slips/{month}, POST /slips/{month}/regenerate, GET /slips/{id}/pdf
- **AI:** PUT/DELETE /settings/ai-key, POST /ai/insights, POST /ai/chat, POST /ai/categorize
- **PWA:** POST/DELETE /push/subscribe, POST /sync/batch (replays offline entries using client-generated IDs)
- **Public:** GET /unsubscribe/{token}

Standards: consistent error format, pagination, idempotency keys on create endpoints that trigger emails, OpenAPI spec generated and published.

## 8. Key Flows

**Payment with notification**

1. User saves an expense with a payee and "Notify" on.
2. API writes the expense and an `email_notifications` row (status queued) in one transaction.
3. Worker picks the job, renders the template, sends via the email provider, updates status.
4. Provider webhook updates delivered or bounced; failures retry with exponential backoff (max 5), then surface in the dashboard.

**Month-end slip**

1. Scheduler runs at the end of each user's month (timezone aware).
2. Worker aggregates totals, computes month-over-month deltas, flags high-spend categories.
3. If the user has a Groq key, it requests a short narrative summary; failures never block the slip.
4. PDF generated, stored, user emailed and notified in-app.

**Groq key setup**

1. User pastes key, API makes a test call, encrypts and stores, returns only the last 4 characters.
2. All later AI requests decrypt the key in memory just for the call.

## 9. Non-Functional Requirements

- **Security:** Argon2id or bcrypt password hashing, CSRF protection, strict CORS, rate limiting on login and AI endpoints, input validation on both Zod and Go sides, row-level ownership checks on every query, secrets never logged, dependency scanning.
- **Privacy and compliance:** consent for emailing third parties, unsubscribe in every email, data export and account deletion (GDPR/India DPDP friendly), minimal data sent to AI, clear disclosure that AI calls use the user's own Groq account.
- **Performance:** dashboard API p95 under 300 ms for 50k transactions; email queued within 5 s of save; slip generated within 60 s.
- **Reliability:** 99.5% uptime target, daily database backups with restore tested, idempotent jobs.
- **Observability:** structured logs, request IDs, metrics (Prometheus), error tracking (Sentry), email delivery dashboard.
- **Accessibility and UX:** responsive, WCAG AA, dark mode, keyboard-friendly forms.
- **Testing:** unit tests (Go and TS), integration tests against a Postgres container, E2E with Playwright for the add-expense-to-email flow, load test on the dashboard.

## 10. Success Metrics

- Activation: 60% of new users add at least 5 transactions in the first week.
- 40% of users enable payee notifications.
- Email delivery rate above 98%; bounce rate under 2%.
- 30% of active users open their monthly slip.
- 25% of users add a Groq key; AI insight usefulness rating above 4/5.
- 35% of phone users install the PWA within 30 days; offline entries sync with under 0.5% failures.
- Day-30 retention above 40%.

## 11. Milestones

| Phase | Scope | Duration |
| --- | --- | --- |
| 0. Setup | Repo, Docker compose, CI, schema decisions, design system | 1 week |
| 1. Core | Auth, income, expenses, categories, basic dashboard | 3 weeks |
| 2. Payees and email | Payee directory, queue, email templates, delivery log, unsubscribe | 2 weeks |
| 3. Slip | Aggregations, MoM comparison, PDF, scheduler | 2 weeks |
| 4. AI | Groq BYOK, encryption, insights, chat, categorization | 2 weeks |
| 5. PWA and hardening | PWA polish (manifest, offline queue, web push, passkeys), security review, tests, performance, docs, beta launch | 3 weeks |

## 12. Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| Emails land in spam | Verified domain, SPF/DKIM/DMARC, transactional provider, plain template |
| Payees receive unwanted emails | Per-payee toggle, confirmation on first notify, unsubscribe |
| User key leakage | Encryption at rest, server-side calls only, masked display, no logging |
| Groq rate limits or outages | Retry with backoff, fallback model, graceful degradation |
| Wrong-amount emails | Edit window prompt, correction emails, undo within 60 seconds before sending (optional delay queue) |
| Drizzle and Go mismatch | Single schema source plus sqlc, decided in phase 0 |
| iOS PWA limits (push only after install, no background sync) | In-app install guide, sync on app open, clear Pending sync badge, optional Capacitor wrap for store presence |
| Offline entries create duplicates or show stale data | Client-generated IDs, idempotent sync endpoint, server as source of truth, caches cleared on logout |

## 13. Future Scope

- Bank and UPI statement import, receipt OCR.
- Shared workspaces with roles (owner, accountant, viewer).
- Multi-currency, tax summaries, invoices.
- WhatsApp or SMS payee notifications.
- Savings goals and forecasting.
- Capacitor wrap (or an Expo app) for App Store and Play Store listings and stronger iOS push, reusing the same web code and Go API.

## 14. Open Questions

1. Single-user only for v1, or shared household accounts from day one?
2. Should payee emails be sent immediately or after a short undo delay?
3. Which email provider and sending domain will be used?
4. Currency: INR only at launch or multi-currency?
5. Confirm the Drizzle plus Go approach (Section 5.1).
6. Is the PWA enough for launch, or are App Store and Play Store listings needed in the first release?
7. Is the WhereDaMoney domain available, and is the name cleared in a trademark search?
