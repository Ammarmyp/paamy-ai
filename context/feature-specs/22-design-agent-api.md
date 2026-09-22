Set up the backend flow for design generation using Trigger.dev.
This unit handles triggering background jobs, tracking runs, and issuing tokens. No AI logic yet.

## Prerequisites (validated)

- `@trigger.dev/sdk` is installed (see `package.json` / `trigger.config.ts`).
- Trigger.dev supports minting a **public access token** scoped to a single run via
  `auth.createPublicToken({ scopes: { read: { runs: [runId] } } })`.

### Public token contract (`POST /api/ai/design/token`)

| Concern | Behavior |
| --- | --- |
| Audience / scope | Read-only realtime access to the **requested `runId` only** (`scopes.read.runs: [runId]`). Never issue a token that can read all runs. |
| TTL | Default **15 minutes**. Prefer an explicit `expirationTime` of `"15m"` when minting so the client contract is stable. |
| Ownership | Verify the Clerk user owns the matching `TaskRun` (`userId` + `runId`) before minting. |
| Failure | `401` if unauthenticated; `403`/`404` if the run is missing or not owned by the caller; `502` if Trigger.dev token minting fails. Do not return a token in those cases. |

Only retain this token endpoint once the route implements the table above.

## Implementation

1. Add the design trigger route.

   Create: `POST /api/ai/design`
   This route should:
   - require an authenticated Clerk user
   - accept the design prompt and required context (`roomId`, `projectId`)
   - authorize project access with the existing owner-or-collaborator policy
     (`getAccessibleProject` / `userHasProjectAccess`)
   - verify `roomId` is the Liveblocks room bound to `projectId`
     (in this app they are the same id — reject when `roomId !== projectId`)
   - preserve collaborator access; reject mismatched context
   - perform **all** auth and access checks **before** creating a `TaskRun` or
     invoking Trigger.dev
   - trigger the design task through Trigger.dev
   - create a TaskRun record
   - return the run ID to the client

2. Add task run tracking.

   Create a `TaskRun` model in Prisma to track Trigger.dev runs and verify ownership.

   It should include:
   - `runId` (unique)
   - `projectId`
   - `userId`
   - `createdAt`

   Add:
   - an index on `runId`
   - a compound index on `userId` and `projectId`

3. Add the token route.

   Create: `POST /api/ai/design/token`
   This route should:
   - accept a run ID
   - require an authenticated Clerk user
   - verify ownership using the TaskRun record
   - generate a Trigger.dev public token scoped exclusively to that run
     (see Prerequisites)
   - return the token to the client

4. Create the design task.

   Create `trigger/design-agent.ts`
   - check the existing Trigger.dev setup and installed agent features first
   - reuse the existing setup instead of creating a new pattern
   - export a minimal design task
   - accept the expected payload (`prompt`, `roomId`)
   - log or echo the input for now
   - don’t add AI logic yet

## Scope Limits

- don’t generate nodes or edges yet
- don’t call any AI providers
- don’t update the canvas
- keep this focused on backend task wiring only

## Check When Done

- `POST /api/ai/design` triggers a background task only after Clerk auth and
  project access checks (owner or collaborator), and only when
  `roomId === projectId`.
- Task runs are stored in Prisma.
- `POST /api/ai/design/token` returns a run-scoped public token (15m TTL,
  read scope for that run only) after ownership verification.
- Design task exists and is callable.
- `npm run build` passes.
