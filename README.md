# Thavalam — Digital Vehicle Garage

A full-stack web application for managing your personal vehicle garage. Track motorcycles and cars, log service history, manage maintenance intervals, and keep build notes — all in one place.

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS 4, shadcn/ui, Framer Motion
- **Backend:** Express 5, Node.js, TypeScript
- **Database:** PostgreSQL with Drizzle ORM
- **Validation:** Zod
- **State:** TanStack React Query
- **Routing:** Wouter

## Prerequisites

- Node.js 20+
- PostgreSQL 14+

## Setup

```bash
# Install dependencies
npm install

# Create the database
createdb thavalam

# Push the schema
DATABASE_URL="postgresql://localhost:5432/thavalam" npx drizzle-kit push

# Start the dev server (serves both API and client)
DATABASE_URL="postgresql://localhost:5432/thavalam" npm run dev
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
├── client/src/          # React frontend
│   ├── pages/           # Route pages (home, garage, not-found)
│   ├── components/ui/   # shadcn/ui components
│   ├── lib/             # API client, query config, utilities
│   └── hooks/           # Custom React hooks
├── server/              # Express backend
│   ├── index.ts         # App entry point & middleware
│   ├── routes.ts        # REST API endpoints
│   ├── storage.ts       # Database access layer
│   └── db.ts            # PostgreSQL connection
├── shared/
│   └── schema.ts        # Drizzle ORM schema & Zod validation
└── script/
    └── build.ts         # Production build script
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/vehicles` | List all vehicles |
| GET | `/api/vehicles/:id` | Get a vehicle |
| POST | `/api/vehicles` | Create a vehicle |
| PATCH | `/api/vehicles/:id` | Update a vehicle |
| DELETE | `/api/vehicles/:id` | Delete a vehicle |
| GET | `/api/vehicles/:vehicleId/services` | List service records |
| POST | `/api/vehicles/:vehicleId/services` | Add a service record |
| GET | `/api/vehicles/:vehicleId/notes` | Get build notes |
| PUT | `/api/vehicles/:vehicleId/notes` | Replace build notes |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `PORT` | No | Server port (default: 5000) |
