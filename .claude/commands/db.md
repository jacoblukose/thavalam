Database operations for Thavalam.

Schema is defined in shared/schema.ts using Drizzle ORM.

Push schema to database:
```
npm run db:push
```

Connect to production DB directly (requires DATABASE_URL from Azure app settings):
```
az webapp config appsettings list --name thavalam-app --resource-group thavalam-rg --query "[?name=='DATABASE_URL'].value" -o tsv | xargs -I{} psql "{}"
```

Tables:
- users — Google OAuth users (id, googleId, email, name, picture)
- vehicles — User vehicles (nickname, model, year, odo, health, tags)
- service_records — Maintenance history (title, date, odometer, amount, workshop, items)
- build_notes — Key-value build specs per vehicle
- vehicle_documents — Insurance, PUC docs with expiry dates and file URLs
- vehicle_shares — Share access between users (owner grants, shared user can view/edit)
- session — Express sessions (managed by connect-pg-simple)
