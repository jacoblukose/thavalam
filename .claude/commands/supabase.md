Manage the Supabase project for Thavalam.

Supabase details:
- Project URL: https://umodxzkvdigntonjltol.supabase.co
- Storage bucket: vehicle-documents
- Auth: Service role key via SUPABASE_SERVICE_KEY env var

Database (PostgreSQL via Drizzle ORM):
- Push schema changes: `npm run db:push` (runs `drizzle-kit push`)
- Connection: DATABASE_URL env var (set in Azure app settings)

Tables: users, vehicles, service_records, build_notes, vehicle_documents, vehicle_shares, session

Storage operations (via supabase-storage.ts):
- Upload: POST to `/storage/v1/object/vehicle-documents/{path}` with Bearer token
- Delete: DELETE to `/storage/v1/object/vehicle-documents/{path}` with Bearer token
- Public URL pattern: `https://umodxzkvdigntonjltol.supabase.co/storage/v1/object/public/vehicle-documents/{path}`

To access Supabase dashboard, visit: https://supabase.com/dashboard (login required)
