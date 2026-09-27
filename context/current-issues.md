# Current Issues

_No open issues._

## Resolved

### 2026-09-27 — `/editor/[roomId]` load errors

1. **Postgres SSL warning** — `DATABASE_URL` used `sslmode=require`, which `pg`
   treats as `verify-full` and warns about. Fixed by normalizing the URL to
   `sslmode=verify-full` in `src/lib/database-url.ts` (wired from `db.ts` and
   `prisma.config.ts`).

2. **`Feed ai-chat already exists`** — sidebar called `createFeed` on mount
   without awaiting the Promise, so an existing feed became an unhandled
   rejection. Fixed by creating the feed lazily on first send (await + catch),
   matching Liveblocks’ ensure-feed pattern.
