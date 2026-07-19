# Avaris Gig Radar

A ToS-safe system that scores strategy and research briefs against Dr. Esam Murad's
profile and drafts McKinsey/Bain/BCG-style proposals for the ones worth pursuing.
Runs on Cloudflare Workers (Hono API + D1) with a React review dashboard.

## What it does (this build: scoring + proposal core)

1. **Capture** a brief (paste it into the dashboard, or POST it to the API).
2. **Score** it 0-100 against the profile and tag the matched sector (sovereign
   credit, trade finance, FinTech, market entry, general strategy, Islamic finance).
   Poor-fit work (design/dev/marketing, low budget) is scored down automatically.
3. **Review** the scored queue, sorted best-first, and **approve or reject**.
4. On approve, the engine **drafts an MBB-style proposal** anchored to the single
   most relevant credential in the library (no fabrication, no CV dump, no em dashes).
5. Copy the draft, submit it, and mark the gig **applied**.

The scoring rubric, credential library, and both prompts live in
[`src/worker/profile.ts`](src/worker/profile.ts) — edit your positioning there.

### Not yet wired (planned next)

- **Ingestion**: daily open-source polling (public RFP/job boards) and email-alert
  parsing for the closed platforms (Catalant, BTG, High5, Upwork). No scraping —
  closed platforms are fed by forwarding their own alert emails to a mailbox.
- **Daily digest email** + a scheduled cron trigger to run the scan automatically.

## Architecture

| Piece | File |
| --- | --- |
| Shared types | `src/shared/types.ts` |
| Profile, credential library, prompts | `src/worker/profile.ts` |
| Claude client (+ keyless mock fallback) | `src/worker/claude.ts` |
| D1 access layer | `src/worker/db.ts` |
| API routes (Hono) | `src/worker/index.ts` |
| Review dashboard (React) | `src/react-app/App.tsx` |
| DB schema | `migrations/0001_init.sql` |

### API

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Status; `mock: true` when no API key is set |
| GET | `/api/gigs?status=` | List gigs (score-sorted), optional status filter |
| POST | `/api/gigs` | Capture a brief and score it |
| POST | `/api/gigs/:id/score` | Re-score |
| POST | `/api/gigs/:id/approve` | Approve and draft the proposal |
| POST | `/api/gigs/:id/reject` | Reject |
| POST | `/api/gigs/:id/proposal` | Regenerate the proposal |
| POST | `/api/gigs/:id/applied` | Mark as submitted |

## Setup

```bash
npm install

# 1. Create the D1 database, then paste the printed database_id into wrangler.json
npx wrangler d1 create avaris-gigs

# 2. Apply the schema (local for dev, add --remote for production)
npx wrangler d1 migrations apply avaris-gigs --local
npx wrangler d1 migrations apply avaris-gigs --remote

# 3. Set the Anthropic key (optional locally; without it the app runs in mock mode)
npx wrangler secret put ANTHROPIC_API_KEY

# 4. Run it
npm run dev
```

**Mock mode**: with no `ANTHROPIC_API_KEY`, scoring uses a keyword heuristic and
proposals use a deterministic template, so the whole flow is demoable offline.
Set the key to switch to live Claude calls. Models are configurable in
`wrangler.json` (`SCORING_MODEL`, `PROPOSAL_MODEL`).

---

# React + Vite + Hono + Cloudflare Workers

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cloudflare/templates/tree/main/vite-react-template)

This template provides a minimal setup for building a React application with TypeScript and Vite, designed to run on Cloudflare Workers. It features hot module replacement, ESLint integration, and the flexibility of Workers deployments.

![React + TypeScript + Vite + Cloudflare Workers](https://imagedelivery.net/wSMYJvS3Xw-n339CbDyDIA/fc7b4b62-442b-4769-641b-ad4422d74300/public)

<!-- dash-content-start -->

🚀 Supercharge your web development with this powerful stack:

- [**React**](https://react.dev/) - A modern UI library for building interactive interfaces
- [**Vite**](https://vite.dev/) - Lightning-fast build tooling and development server
- [**Hono**](https://hono.dev/) - Ultralight, modern backend framework
- [**Cloudflare Workers**](https://developers.cloudflare.com/workers/) - Edge computing platform for global deployment

### ✨ Key Features

- 🔥 Hot Module Replacement (HMR) for rapid development
- 📦 TypeScript support out of the box
- 🛠️ ESLint configuration included
- ⚡ Zero-config deployment to Cloudflare's global network
- 🎯 API routes with Hono's elegant routing
- 🔄 Full-stack development setup
- 🔎 Built-in Observability to monitor your Worker

Get started in minutes with local development or deploy directly via the Cloudflare dashboard. Perfect for building modern, performant web applications at the edge.

<!-- dash-content-end -->

## Getting Started

To start a new project with this template, run:

```bash
npm create cloudflare@latest -- --template=cloudflare/templates/vite-react-template
```

A live deployment of this template is available at:
[https://react-vite-template.templates.workers.dev](https://react-vite-template.templates.workers.dev)

## Development

Install dependencies:

```bash
npm install
```

Start the development server with:

```bash
npm run dev
```

Your application will be available at [http://localhost:5173](http://localhost:5173).

## Production

Build your project for production:

```bash
npm run build
```

Preview your build locally:

```bash
npm run preview
```

Deploy your project to Cloudflare Workers:

```bash
npm run build && npm run deploy
```

Monitor your workers:

```bash
npx wrangler tail
```

## Additional Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Vite Documentation](https://vitejs.dev/guide/)
- [React Documentation](https://reactjs.org/)
- [Hono Documentation](https://hono.dev/)
