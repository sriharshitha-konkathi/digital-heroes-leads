# Digital Heroes — Lead Management Platform

Full-stack lead management app built with Next.js, TypeScript, Supabase, and Tailwind CSS.

**Live URL:** https://digital-heroes-leads-alpha.vercel.app
**GitHub:** https://github.com/sriharshitha-konkathi/digital-heroes-leads

> Built for [Digital Heroes Training Task](https://digitalheroesco.com)

---

## Quick Start

```bash
git clone https://github.com/sriharshitha-konkathi/digital-heroes-leads.git
cd digital-heroes-leads
npm install
npm run dev
```

Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Run tests: `npm test`

---

## Test Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@digitalheroesco.com | Admin@123456 |
| Member | member@digitalheroesco.com | Member@123456 |

---

## API

Base URL: `https://digital-heroes-leads-alpha.vercel.app/api`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | /api/leads | Required | List leads (pagination + filtering) |
| POST | /api/leads | Public | Create a lead |
| GET | /api/leads/:id | Required | Get single lead |
| PATCH | /api/leads/:id | Required | Update status or assignment |

**Query params for GET /api/leads:**
- `page` — default 1
- `limit` — default 10, max 100
- `status` — new, contacted, qualified, proposal, closed_won, closed_lost
- `assigned_to` — user UUID

---

## Roles

| Action | Admin | Member |

---

## Stack

Next.js 16 · TypeScript · Tailwind CSS · Supabase · Vercel · Jest

---

## AI Usage

Claude was used to scaffold the project, generate SQL schema, RLS policies, and API routes. All code was reviewed and adapted — particularly the auth middleware, RLS policies, and pagination logic.