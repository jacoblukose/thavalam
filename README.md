# Thavalam — Digital Vehicle Garage

A full-stack web application for managing your personal vehicle garage. Track motorcycles and cars, log service history, manage maintenance intervals, keep build notes, store documents (insurance, PUC), and share vehicles with other users.

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Azure App Service                    │
│                  (thavalam-app, Central India)            │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │              Node.js / Express 5 Server             │  │
│  │                                                     │  │
│  │  ┌──────────────┐  ┌────────────────────────────┐  │  │
│  │  │ Static Files  │  │       REST API (/api)       │  │  │
│  │  │ (React SPA)   │  │                             │  │  │
│  │  │  Vite-built   │  │  Auth · Vehicles · Services │  │  │
│  │  │  dist/public/  │  │  Notes · Docs · Sharing    │  │  │
│  │  └──────────────┘  └─────────┬──────────┬────────┘  │  │
│  │                              │          │            │  │
│  └──────────────────────────────┼──────────┼────────────┘  │
└─────────────────────────────────┼──────────┼────────────────┘
                                  │          │
                    ┌─────────────┘          └──────────────┐
                    ▼                                       ▼
     ┌──────────────────────────┐        ┌──────────────────────────┐
     │   Supabase (PostgreSQL)  │        │   Supabase Storage (S3)  │
     │                          │        │                          │
     │  users                   │        │  bucket: vehicle-documents│
     │  vehicles                │        │  insurance PDFs, PUC docs │
     │  service_records         │        │                          │
     │  build_notes             │        └──────────────────────────┘
     │  vehicle_documents       │
     │  vehicle_shares          │
     │  session (connect-pg)    │
     └──────────────────────────┘

     ┌──────────────────────────┐
     │   Google OAuth 2.0       │
     │   (Passport.js)          │
     │   Sign-in & identity     │
     └──────────────────────────┘
```

### Data Flow

1. **Client** — React SPA served as static files from the Express server
2. **Auth** — Google OAuth 2.0 via Passport.js, sessions stored in PostgreSQL (`connect-pg-simple`)
3. **API** — Express REST endpoints, all `/api/vehicles/*` routes require authentication
4. **Database** — Supabase-hosted PostgreSQL accessed via Drizzle ORM
5. **File Storage** — Document uploads (insurance, PUC) go to Supabase Storage via service key
6. **Deployment** — GitHub Actions builds on push to `main` and deploys zip to Azure App Service

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS 4, shadcn/ui, Framer Motion
- **Backend:** Express 5, Node.js, TypeScript
- **Database:** PostgreSQL (Supabase) with Drizzle ORM
- **File Storage:** Supabase Storage
- **Auth:** Google OAuth 2.0 via Passport.js
- **Validation:** Zod
- **State:** TanStack React Query
- **Routing:** Wouter
- **Hosting:** Azure App Service (Central India)
- **CI/CD:** GitHub Actions

## Prerequisites

- Node.js 20+
- PostgreSQL 14+ (or Supabase project)

## Setup

```bash
# Install dependencies
npm install

# Push the schema
DATABASE_URL="postgresql://..." npx drizzle-kit push

# Start the dev server (serves both API and client)
DATABASE_URL="postgresql://..." npm run dev
```

The app will be available at `http://localhost:5000`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (Express + Vite HMR) |
| `npm run dev:client` | Start Vite client only |
| `npm run build` | Build for production |
| `npm start` | Run production build |
| `npm run check` | TypeScript type checking |
| `npm run db:push` | Push Drizzle schema to database |

## Project Structure

```
├── client/src/              # React frontend
│   ├── pages/               # Route pages (home, garage, not-found)
│   ├── components/ui/       # shadcn/ui components
│   ├── lib/                 # API client, query config, utilities
│   └── hooks/               # Custom React hooks
├── server/                  # Express backend
│   ├── index.ts             # App entry point & middleware
│   ├── auth.ts              # Google OAuth & session setup
│   ├── routes.ts            # REST API endpoints
│   ├── storage.ts           # Database access layer (Drizzle)
│   ├── supabase-storage.ts  # File upload/delete (Supabase Storage)
│   ├── db.ts                # PostgreSQL connection pool
│   ├── static.ts            # Production static file serving
│   └── vite.ts              # Dev-mode Vite HMR integration
├── shared/
│   └── schema.ts            # Drizzle ORM schema & Zod validation
├── .github/workflows/
│   └── deploy.yml           # CI/CD: build & deploy to Azure
└── script/
    └── build.ts             # Production build script (esbuild)
```

## Database Schema

```
users ──────────< vehicles ──────────< service_records
                     │ │
                     │ ├──────────< build_notes
                     │ ├──────────< vehicle_documents
                     │ └──────────< vehicle_shares >────────── users
                     │
session (connect-pg-simple)
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/auth/google` | Initiate Google OAuth |
| GET | `/api/auth/google/callback` | OAuth callback |
| GET | `/api/auth/me` | Current user info |
| POST | `/api/auth/logout` | Log out |
| GET | `/api/vehicles` | List vehicles (owned + shared) |
| GET | `/api/vehicles/:id` | Get a vehicle |
| POST | `/api/vehicles` | Create a vehicle |
| PATCH | `/api/vehicles/:id` | Update a vehicle |
| DELETE | `/api/vehicles/:id` | Delete a vehicle (owner only) |
| GET | `/api/vehicles/:vehicleId/services` | List service records |
| POST | `/api/vehicles/:vehicleId/services` | Add a service record |
| GET | `/api/vehicles/:vehicleId/notes` | Get build notes |
| PUT | `/api/vehicles/:vehicleId/notes` | Replace build notes |
| GET | `/api/vehicles/:vehicleId/documents` | List documents |
| POST | `/api/vehicles/:vehicleId/documents` | Upload a document |
| DELETE | `/api/vehicles/:vehicleId/documents/:docId` | Delete a document |
| GET | `/api/documents` | All documents for user (expiry alerts) |
| GET | `/api/vehicles/:vehicleId/shares` | List shares (owner only) |
| POST | `/api/vehicles/:vehicleId/shares` | Share vehicle by email |
| DELETE | `/api/vehicles/:vehicleId/shares/:userId` | Remove share |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string (Supabase) |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth client secret |
| `SUPABASE_SERVICE_KEY` | Yes | Supabase service role key (for file storage) |
| `SESSION_SECRET` | No | Session encryption key (has default) |
| `PORT` | No | Server port (default: 5000) |
