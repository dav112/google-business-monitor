# Google Business Monitor — SaaS

Phase 1 selesai. Phase 2-9 terstruktur bertahap (lihat AGENT notes).

## Quick Start
```bash
createdb google_business_monitor
cp .env.example .env # isi DATABASE_URL & JWT_SECRET
npm install
npx prisma db push
npm run dev # http://localhost:3000
```

## Arsitektur (Rule 21)

**Stack:** Next.js 16 App Router, Prisma 5, PostgreSQL 18, Tailwind 4, jose (JWT), bcryptjs. No extra auth lib — ponytail: stdlib + 2 deps.

**DB:** 10 tabel (users, google_accounts, business_accounts, locations, reviews [unique reviewId], performance_metrics, google_sheets, telegram_configs, notifications, activity_logs). FK + index userId, locationId, rating. Multi-tenant: semua query filter `userId`.

**Env:** DATABASE_URL, JWT_SECRET, GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI, GOOGLE_PUBSUB_TOPIC, ENCRYPTION_KEY, NEXT_PUBLIC_APP_URL.

**Google APIs (hanya resmi):**
- OAuth 2.0 (`accounts.google.com/o/oauth2/v2/auth`, `oauth2.googleapis.com/token`)
- Business Profile: `mybusinessaccountmanagement.googleapis.com/v1/accounts`, `mybusinessbusinessinformation.googleapis.com/v1/{account}/locations`, `mybusiness.googleapis.com/v4/{location}/reviews`
- Performance: `businessprofileperformance.googleapis.com/v1/{location}:fetchMultiDailyMetricsTimeSeries` (agregat views/searches/calls/directions — tidak ada tracking individual)
- Notifications: Pub/Sub push ke `/api/google/pubsub` → webhook → DB → Sheets/Telegram
- Sheets: `sheets.googleapis.com/v4/spreadsheets`

**OAuth Flow:** Login → Connect Google → consent (offline) → callback → server simpan access+refresh token (encrypted, httpOnly, tidak ke client) → fetch accounts → fetch locations → user pilih → monitoring.

**Data Flow:** Google Pub/Sub (atau polling fallback 15m, tidak agresif) → Backend webhook → upsert Review (unique constraint) → jika rating 1-3 & belum pernah notif → Telegram → Sheets append → Dashboard (polling/SWR) → activity_logs. DB = source of truth.

**Security:** password hash, JWT httpOnly secure, server-side ownership check, rate limit (Phase 8), validasi zod, token tidak expose, encryption at rest.

## Roadmap
- [x] Phase 1: Auth + Dashboard shell
- [ ] Phase 2: Google OAuth + Locations
- [ ] Phase 3: Reviews sync + filter
- [ ] Phase 4: Analytics charts (Recharts)
- [ ] Phase 5: Google Sheets
- [ ] Phase 6: Telegram
- [ ] Phase 7: Pub/Sub realtime
- [ ] Phase 8: Logs, hardening
- [ ] Phase 9: Deploy

## Skipped (ponytail)
- NextAuth → custom jose, add when SSO needed
- Prisma 8 platform → pinned 5.22 classic, migrasi saat stable
- Recharts/shadcn CLI belum di Phase 1, add per-phase

## Verify
```bash
npx prisma db push
npm run build
curl -X POST http://localhost:3000/api/auth/register -H "Content-Type: application/json" -d '{"name":"Test","email":"t@test.com","password":"123456"}'
```
