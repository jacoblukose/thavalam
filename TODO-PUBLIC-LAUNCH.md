# Thavalam — Public Launch Checklist

Pre-launch checklist covering security hardening, production readiness, and legal compliance.
Generated from a full codebase review on 2026-03-15.

---

## Security

### [x] 1. Add auth middleware to notification routes
**Severity:** Critical
**File:** `server/routes.ts:462-500`

The `/api/notifications` endpoints (`GET`, `PATCH /:id/read`, `POST /read-all`, `DELETE`) access `req.user!.id` but have no `requireAuth` middleware applied. Unlike `/api/vehicles` and `/api/documents` which have `app.use("/api/...", requireAuth)`, notifications are unprotected. An unauthenticated request will either crash the server (500 with stack trace) or behave unpredictably. Every endpoint that touches user data must verify identity first.

**Fix:** Add `app.use("/api/notifications", requireAuth as RequestHandler);` alongside the existing vehicle/document guards in `registerRoutes`.

---

### [ ] 2. Make Supabase document bucket private and use signed URLs
**Severity:** High
**File:** `server/supabase-storage.ts:42`

Uploaded vehicle documents (insurance policies, PUC certificates) are stored in a public Supabase bucket. The returned URL (`/object/public/...`) is accessible to anyone without authentication. These documents contain names, policy numbers, vehicle registration numbers, and addresses. A single leaked or guessed URL exposes sensitive personal information.

**Fix:** Switch the Supabase bucket to private. Replace public URLs with short-lived signed URLs generated server-side when the user requests a document. Add a new API endpoint (e.g., `GET /api/vehicles/:vehicleId/documents/:docId/url`) that verifies ownership, generates a signed URL (e.g., 5-minute expiry), and returns it to the client.

---

### [ ] 3. Add rate limiting
**Severity:** High
**Files:** `server/index.ts`, `server/routes.ts`

No rate limiting is configured anywhere. `express-rate-limit` is listed in the build externals but never imported or used. Without rate limits, attackers can brute-force API endpoints, enumerate vehicle/user IDs, spam create endpoints to flood the database, or effectively DoS the app on a small Azure App Service plan.

**Fix:** Add a global rate limiter (e.g., 100 requests/minute per IP) and a stricter limiter on auth routes (e.g., 10 requests/minute). Apply via `app.use(limiter)` in `server/index.ts` before routes are registered.

---

### [ ] 4. Add helmet for security headers
**Severity:** High
**File:** `server/index.ts`

No HTTP security headers are set. The app is missing Content-Security-Policy, X-Content-Type-Options, Strict-Transport-Security, X-Frame-Options, and others. Without these, the app is vulnerable to clickjacking (iframe embedding), MIME-sniffing attacks on uploaded files, HTTPS downgrade attacks, and unconstrained script injection if any XSS vector is found.

**Fix:** `npm install helmet` (if not already installed) and add `app.use(helmet())` near the top of the middleware stack in `server/index.ts`. Review the default CSP and adjust if your frontend loads external resources (e.g., Google profile pictures).

---

### [ ] 5. Add CORS configuration
**Severity:** Medium
**File:** `server/index.ts`

No CORS middleware is configured. The app relies entirely on the browser's default same-origin policy. This is fragile — if the app is ever served from a different subdomain, or if defaults change, cross-origin requests from malicious sites could reach the API.

**Fix:** Add `cors({ origin: "https://thavalam-app.azurewebsites.net", credentials: true })` middleware. In development, allow `localhost` origins as well.

---

### [ ] 6. Sanitize error messages in production
**Severity:** Medium
**File:** `server/index.ts:68-79`

The global error handler returns `err.message` directly to the client. Some library errors include file paths, SQL fragments, or internal details in their message strings. This gives attackers free reconnaissance about the server's internals.

**Fix:** In the error handler, check `process.env.NODE_ENV === "production"` and return a generic `"Internal Server Error"` message to the client. Log the real error server-side only.

---

### [ ] 7. Use proper SSL certificate validation for database
**Severity:** Low
**File:** `server/db.ts:10`

The PostgreSQL connection uses `ssl: { rejectUnauthorized: false }`, which accepts any SSL certificate including forged ones. In a man-in-the-middle scenario, an attacker on the network path could intercept database traffic. Low risk on managed platforms (Supabase, Azure) but still a weakened security posture.

**Fix:** Obtain the CA certificate from your database provider and configure `ssl: { ca: fs.readFileSync("path/to/ca-cert.pem") }` instead of disabling verification.

---

## Readiness

### [ ] 8. Validate currency and timezone in profile updates
**Severity:** Medium
**File:** `server/auth.ts:178-181`

The `PATCH /api/auth/profile` endpoint accepts any string for `currency` and `timezone` with no validation beyond type checking. Users or attackers could submit garbage values, extremely long strings, or unexpected content. This pollutes the database and could cause rendering bugs across the app.

**Fix:** Validate `currency` against a known set of ISO 4217 codes (e.g., `["INR", "USD", "EUR", ...]`) and `timezone` against IANA timezone names (use `Intl.supportedValuesOf("timeZone")` or a static list). Reject requests with unknown values.

---

### [ ] 9. Make `trust proxy` conditional on environment
**Severity:** Low
**File:** `server/auth.ts:44`

`app.set("trust proxy", 1)` is set unconditionally. This tells Express to trust the `X-Forwarded-For` header for the client's IP address. Behind Azure's reverse proxy this is correct, but if the app is ever run directly (local dev, different host), any client can forge their IP, breaking rate limiting and audit logging.

**Fix:** Only set `trust proxy` when `NODE_ENV === "production"` or when a `TRUST_PROXY` env var is set.

---

## Legal / Compliance

### [x] 10. Add account deletion and data export
**Severity:** High
**Context:** India's DPDPA and EU's GDPR

The app stores personal data: Google profile info (name, email, picture), vehicle details, uploaded documents (insurance, PUC). Both DPDPA and GDPR grant users the right to request deletion of their personal data and (under GDPR) the right to data portability. Without an account deletion feature, the app is non-compliant from launch.

**Fix:** Add a "Delete my account" option in user settings. This should delete the user record (cascading to vehicles, documents, etc.), remove all uploaded files from Supabase storage, and destroy the session. Optionally, add a "Download my data" feature that exports all user data as JSON/ZIP.

---

### [x] 11. Add a privacy policy page
**Severity:** High
**Context:** Google OAuth requirement, DPDPA, GDPR

Google requires a linked privacy policy for apps using their OAuth API in production. Beyond that, any public app collecting personal data must disclose what data is collected, why it's collected, how long it's retained, and who it's shared with. Without a privacy policy, Google can revoke the OAuth consent screen and the app is exposed to regulatory complaints.

**Fix:** Create a `/privacy` page covering: data collected (Google profile, vehicle info, uploaded documents), purpose (vehicle management), storage provider (Supabase, Azure), retention period, third-party sharing (none), user rights (deletion, export), and contact information. Link it from the footer and the Google OAuth consent screen configuration.

---

### [x] 12. Add footer links to Privacy Policy and Terms of Service
**Severity:** High
**Context:** Legal compliance, user trust

The landing page at pocketgarage.club has no footer links to a Privacy Policy or Terms of Service. These are required for Google OAuth production approval and general legal compliance.

**Fix:** Add a site footer with links to `/privacy` and `/terms` pages. Create a Terms of Service page covering acceptable use, liability limitations, and service availability.

---

### [ ] 13. Add a "Report a Bug" / Support contact
**Severity:** Medium
**Context:** User trust, security vulnerability reporting

There is no way for users to report bugs, request support, or disclose security vulnerabilities. This is a basic expectation for any public-facing app.

**Fix:** Add a support email (e.g., `support@pocketgarage.club`) or a "Report a Bug" link in the footer/settings page. Consider adding a `/.well-known/security.txt` file with a security contact for responsible disclosure.
