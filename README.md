# Digital Heroes — Lead Management Platform

A full-stack lead management application built with Next.js, TypeScript, Supabase, and Tailwind CSS.

**Live URL:** https://digital-heroes-leads-alpha.vercel.app  
**GitHub:** https://github.com/sriharshitha-konkathi/digital-heroes-leads

Built for Digital Heroes Training Task — digitalheroesco.com

---

## Features

- Public lead capture form (no login required)
- Authenticated dashboard with two roles: Admin and Member
- Lead pipeline with status tracking (New → Contacted → Qualified → Proposal → Closed Won/Lost)
- Lead assignment to team members
- Notes with timestamps on each lead
- Full activity trail / audit log
- JSON REST API with pagination and filtering
- Row Level Security enforced at database level
- 12 automated tests covering auth rules and core flows

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, TypeScript, Tailwind CSS |
| Backend | Next.js API Routes |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Deployment | Vercel |
| Testing | Jest + ts-jest |

---

## Getting Started

### Prerequisites
- Node.js 18+
- Supabase account
- Vercel account

### Installation

```bash
git clone https://github.com/sriharshitha-konkathi/digital-heroes-leads.git
cd digital-heroes-leads
npm install
```

### Environment Variables

Create `.env.local` in the root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Run Development Server

```bash
npm run dev
```

Open http://localhost:3000

### Run Tests

```bash
npm test
```

---

## API Documentation

Base URL: `https://digital-heroes-leads-alpha.vercel.app/api`

All endpoints require authentication via Supabase session cookie except POST /leads.

### GET /api/leads

Returns paginated list of leads.

**Query Parameters:**

| Parameter | Type | Description |
|---|---|---|
| page | number | Page number (default: 1) |
| limit | number | Results per page (default: 10, max: 100) |
| status | string | Filter by status |
| assigned_to | string | Filter by assigned user ID |

**Status values:** `new`, `contacted`, `qualified`, `proposal`, `closed_won`, `closed_lost`

**Response 200:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "total_pages": 1,
    "has_next": false,
    "has_prev": false
  }
}
```

**Response 401:** Unauthorized  
**Response 400:** Invalid parameters

---

### POST /api/leads

Creates a new lead. Public endpoint — no auth required.

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@company.com",
  "company": "Acme Inc",
  "phone": "+1 555 000 0000",
  "message": "Interested in Shopify development"
}
```

**Required:** `name`, `email`  
**Optional:** `company`, `phone`, `message`

**Response 201:**
```json
{
  "data": { ...lead },
  "message": "Lead created successfully"
}
```

**Response 400:** Validation error

---

### GET /api/leads/:id

Returns a single lead by ID.

**Response 200:** `{ "data": { ...lead } }`  
**Response 401:** Unauthorized  
**Response 404:** Lead not found

---

### PATCH /api/leads/:id

Updates a lead's status or assignment.

**Request Body:**
```json
{
  "status": "contacted",
  "assigned_to": "user-uuid"
}
```

**Response 200:** `{ "data": { ...lead } }`  
**Response 400:** Invalid fields  
**Response 401:** Unauthorized  
**Response 404:** Lead not found

---

## Roles & Permissions

| Action | Admin | Member |
|---|---|---|
| View all leads | ✅ | ❌ |
| View assigned leads | ✅ | ✅ |
| Assign leads | ✅ | ❌ |
| Update lead status | ✅ | ✅ (assigned only) |
| Add notes | ✅ | ✅ (assigned only) |
| Access admin panel | ✅ | ❌ |

---

## Test Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@digitalheroesco.com | Admin@123456 |
| Member | member@digitalheroesco.com | Member@123456 |

---

## Database Schema

- **profiles** — User profiles with roles (admin/member)
- **leads** — Lead data with status and assignment
- **notes** — Timestamped notes on leads
- **activity_log** — Full audit trail of all actions

Row Level Security is enforced on all tables at the database level.

---

## AI Usage

Claude (Anthropic) was used throughout this project to:
- Scaffold the Next.js project structure
- Generate Supabase SQL schema and RLS policies
- Build API route handlers with proper error handling
- Write the test suite

All code was reviewed, understood, and adapted — particularly the RLS policies, middleware auth flow, and API pagination logic which were customized for this specific use case.