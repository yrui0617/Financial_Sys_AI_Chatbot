# Chapter 3 · Backend

## 3.0 Orientation
### Purpose
Use this chapter as a hands-on manual for building and hardening backend features in the CORRAD Application Framework. Complete each section in sequence; later procedures assume earlier steps are already working.

### Description
This orientation clarifies the scope of the Sales Kit backend track. You will understand which domains you will touch (ticket APIs, Prisma models, developer tooling) and how each subsequent manual builds on the previous one.

### How to progress
1. **Beginner procedures** (Section 3.1) establish a simple API and UI consumption path.
2. **Intermediate procedures** (Section 3.2) apply production safeguards such as auth, validation, and testing.
3. **Expert procedures** (Section 3.3) layer in advanced architecture, performance, and deployment practices.
4. **Reference checklists** (Section 3.4) supply quick-look answers when troubleshooting.
5. **CRUD manual** (Section 3.5) provides copy-ready endpoint templates once the fundamentals are in place.

Move forward only after the verification steps at the end of each section pass.

## 3.1 Beginner Manual · First API Endpoint
### Overview
Publish your first Nitro endpoint, confirm the response in the browser, and surface the data from a page component.

### Description
This procedure introduces you to the ticket domain by exposing read-only data through Nitro and Prisma, then wiring that output into a Vue page. You will see the complete flow from database to API to client for the first time.

### Prerequisites
- Database seeded with sample `ticket` data (or create manual rows via Prisma Studio).
- `server/utils/prisma.ts` exposes a configured Prisma client.
- Front-end page ready to display a ticket list (e.g., `pages/tickets.vue`).

### Procedure
1. **Create the GET endpoint**
   - Path: `server/api/tickets/index.get.ts`
   ```javascript
   export default defineEventHandler(async () => {
     const tickets = await prisma.ticket.findMany({
       orderBy: { createdAt: "desc" },
       take: 10,
     })

     return {
       success: true,
       data: tickets,
     }
   })
   ```
2. **Run the development server**
   - Command: `yarn dev`
   - Navigate to `http://localhost:3000/api/tickets` and confirm the JSON payload loads without errors.
3. **Inspect the response with DevTool**
   - Visit `/devtool/api-editor`.
   - Enter `/api/tickets` and validate the returned schema and data.
4. **Consume the endpoint from the UI**
   - In your page component:
     ```javascript
     const { data } = await useFetch("/api/tickets")
     ```
   - Render the ticket list with appropriate Tailwind styling.
5. **Add a POST handler (optional extension)**
   - Path: `server/api/tickets/index.post.ts`
   ```javascript
   export default defineEventHandler(async (event) => {
     const body = await readBody(event)
     if (!body.title || !body.description) {
       throw createError({ statusCode: 400, statusMessage: "Missing fields" })
     }

     const ticket = await prisma.ticket.create({ data: body })
     return { success: true, data: ticket }
   })
   ```

### Verification
- Visiting `/api/tickets` returns the last 10 tickets with no server errors.
- The tickets page renders data retrieved via `$fetch`/`useFetch`.
- Invalid POST payloads trigger a structured 400 response.

### Troubleshooting
1. **Endpoint returns 500**  
   - Inspect the server console for Prisma errors (often missing env vars).  
   - Verify the Prisma client import path (`server/utils/prisma`) is correct.
2. **Browser fetch returns empty array**  
   - Confirm the database has ticket rows (`npx prisma studio`).  
   - Check the endpoint `take` limit to ensure items are not filtered out.
3. **CORS or network error in DevTool**  
   - Make sure `yarn dev` is running and the API path matches `/api/tickets`.  
   - Clear browser cache if the dev server was restarted.

### HTTP error code reference
| Code | When to use | Example message |
|------|-------------|-----------------|
| 200  | Successful read or write | `OK` |
| 201  | Resource created via POST | `Ticket created successfully` |
| 204  | Successful delete with no body | `No Content` |
| 400  | Validation failure or missing fields | `Missing required field: title` |
| 401  | Missing/invalid session or token | `Unauthorized` |
| 403  | Authenticated but lacking permissions | `Forbidden` |
| 404  | Ticket or route not found | `Ticket not found` |
| 409  | Conflict (duplicate title, optimistic lock) | `Ticket was updated by another user` |
| 422  | Semantic validation failure (optional) | `Priority value is not allowed` |
| 429  | Rate limit exceeded | `Too many requests` |
| 500  | Unexpected server error | `Internal Server Error` |

## 3.2 Intermediate Manual · Production-ready APIs
### Overview
Add authentication gates, validate request payloads, manage schema changes with migrations, and introduce automated tests.

### Description
This manual hardens the same ticket endpoints you built earlier. You will recognise how each safeguard—auth checks, validators, migrations, automated tests—protects the domain from bad requests, drift, and regressions.

### Prerequisites
- Beginner procedures completed and endpoints available.
- `requireUserSession(event)` (or equivalent) ready for auth checks.
- `zod` (or approved validator) installed for payload validation.
- `prisma/schema.prisma` under version control.

### Authentication workflow
1. **Session extraction** — `requireUserSession(event)` should read cookies (or headers) and validate the session/JWT.  
2. **Role attachment** — extend the session object with `roles` or `permissions` to drive RBAC decisions.  
3. **Error handling** — throw `createError({ statusCode: 401, statusMessage: "Unauthorized" })` when the session is absent or expired.  
4. **Client responsibilities** — front end must include the session cookie automatically or attach the bearer token in the `Authorization` header.  
5. **Security tips** — rotate secrets regularly, set `httpOnly` and `secure` flags on cookies, and expire refresh tokens when suspicious activity is detected.

### Procedure
1. **Enforce authentication**
   - Wrap every handler with session validation:
   ```javascript
   const user = await requireUserSession(event)
   if (!user) throw createError({ statusCode: 401, statusMessage: "Unauthorized" })
   ```
   - Attach the user’s `roles` to the request context if RBAC is needed downstream.
2. **Validate and sanitise inputs**
   - Define schemas using `zod` (or project helper).
   - Parse `readBody(event)` through the schema before database writes.
   - Drop unexpected fields to protect against mass assignment.
3. **Apply database migrations**
   - Update `prisma/schema.prisma` with the required changes.
   - Run `npx prisma migrate dev --name <meaningful-name>`.
   - Review the generated SQL to ensure only intended changes are included.
   - Document migration effects in your pull request.
4. **Standardise error handling**
   - Return the structure `{ success: false, error: { code, message } }` for failures.
   - Log full stack traces server-side with `console.error` (or logger) while sending client-safe messages.
5. **Automate integration tests**
   - Use `supertest` or `vitest` with Nitro utilities to hit your endpoints.
   - Mock Prisma against SQLite (`datasource db provider = "sqlite"`) for fast runs.
   - Cover happy paths, auth-rejection paths, and validation errors.
6. **Leverage developer tooling**
   - Open ORM DevTool to confirm schema alignment after migrations.
   - Launch Prisma Studio (`npx prisma studio`) to spot-check data.

### Verification
- Authenticated routes reject anonymous requests with HTTP 401.
- Validation prevents malformed writes and returns precise error details.
- Migrations run without manual SQL intervention and generate expected schema diffs.
- Automated tests succeed locally and in CI.

### Troubleshooting
1. **Persistent 401 responses**  
   - Confirm the client is sending cookies or bearer tokens.  
   - Validate that `requireUserSession` reads the correct cookie name and JWT secret.
2. **Validation errors on known-good payloads**  
   - Log the parsed body before validation to confirm the shape.  
   - Ensure optional fields are marked with `.optional()` in the `zod` schema.
3. **Migrate dev failures**  
   - Run `npx prisma migrate reset` if the local schema drifted.  
   - Check for pending migrations in the repo that were not applied.
4. **Tests fail only in CI**  
   - Verify `.env.test` is committed/available to the pipeline.  
   - Reset the SQLite test DB before each run to avoid residual data.

### HTTP error code reference
| Code | When to use | Example message |
|------|-------------|-----------------|
| 200  | Successful auth validation | `OK` |
| 400  | Validation schema rejection | `Invalid payload` |
| 401  | Missing or expired session | `Unauthorized` |
| 403  | RBAC denies access | `Forbidden` |
| 409  | Optimistic locking failure | `Resource version conflict` |
| 422  | Semantic validation error | `Field violates business rule` |
| 500  | Unhandled server exception | `Internal Server Error` |

## 3.3 Expert Manual · Advanced Backend Engineering
### Overview
Implement patterns that keep complex APIs maintainable at scale: layered architecture, transactional integrity, background jobs, performance, security, observability, and deployment readiness.

### Description
This track positions you as the maintainer of a mission-critical ticketing service. You will separate responsibilities, manage concurrent writes, plan for asynchronous workloads, and integrate the operational safeguards required for enterprise deployments.

### Prerequisites
- Intermediate procedures complete with auth, validation, migrations, and tests in place.
- Services directory available (e.g., `server/services`).
- Access to infrastructure tools (logging stack, Redis, deployment pipeline) if referenced.

### Procedure
1. **Modularise architecture**
   - Group endpoints under `server/api/<domain>/action.ts` folders.
   - Extract business logic into service functions (`server/services/ticketService.ts`) to keep handlers thin.
2. **Guarantee transactional safety**
   - Wrap multi-write workflows in `prisma.$transaction`.
   - For concurrent updates, check `updatedAt` before writing and abort if stale (optimistic locking).
3. **Schedule background work**
   - For recurring tasks, drive execution via external cron hitting Nitro endpoints.
   - If in-process schedules are required, encapsulate `setInterval` inside a Nitro plugin and clean up on shutdown.
4. **Optimise performance**
   - Add Prisma indexes (`@@index`) for commonly filtered columns.
   - Implement caching (HTTP cache headers, Redis) for expensive reads where appropriate.
5. **Harden security posture**
   - Perform threat modelling on new endpoints to mitigate injection, broken auth, and data exposure.
   - Configure the `nuxt-security` module: CSP, CORS, rate limiting, and other mandatory headers.
   - Record critical actions via an `audit` Prisma model for traceability.
6. **Enhance observability**
   - Emit structured JSON logs and forward them to your logging platform (ELK, Datadog, etc.).
   - Provide `/api/health` endpoints that report database and dependency status.
   - Monitor Prisma query metrics through middleware hooks.
7. **Prepare deployment workflow**
   - Run `npx prisma migrate deploy` during release processes.
   - Use zero-downtime strategies (rolling updates, blue/green) to avoid session drops.

### Verification
- Service modules cleanly separate API transport from business logic.
- Transactions roll back cleanly on failures, and race conditions are handled.
- Background jobs run on schedule with safe shutdown behaviour.
- Performance and security audits show no high-priority findings.
- Observability dashboards expose request health and query latency.
- Deployments apply migrations safely without downtime reports.

### Troubleshooting
1. **Race conditions despite transactions**  
   - Check that all write sequences are inside the same `prisma.$transaction`.  
   - Use `forUpdate`-style locks (or `select ... for update` via raw SQL) if multiple services edit the same record set.
2. **Background job duplication**  
   - Ensure only one scheduler instance runs the cron task (e.g., use a distributed lock).  
   - Add job idempotency checks before performing writes.
3. **Cache serving stale data**  
   - Invalidate or namespace caches on write operations.  
   - Set finite TTLs and monitor cache hit ratios.
4. **Health endpoint reports failures**  
   - Log dependency status details (DB connectivity, Redis ping).  
   - Provide runbook links for each dependency to speed remediation.
5. **Zero-downtime deploy still drops sessions**  
   - Confirm sticky sessions (or token-based auth) are configured on load balancers.  
   - Delay draining old instances until in-flight requests complete.

### HTTP error code reference
| Code | When to use | Example message |
|------|-------------|-----------------|
| 200  | Operational checks succeed | `OK` |
| 202  | Background job accepted | `Processing scheduled` |
| 400  | Misconfigured job payload | `Invalid job payload` |
| 401  | Service-to-service auth failed | `Unauthorized` |
| 403  | RBAC denies system-level action | `Forbidden` |
| 409  | Concurrent modification detected | `Resource version conflict` |
| 429  | Throttling enforced | `Too many requests` |
| 500  | Infrastructure failure (DB down) | `Internal Server Error` |
| 503  | Dependency unavailable | `Service Unavailable` |

## 3.4 Operations Manual · Quick Reference & Troubleshooting
### Description
Use this operational quick reference when you are diagnosing ticket API issues or need a snapshot of core commands. It distils the most common directories, CLI tasks, and incident responses you will encounter while supporting the Sales Kit backend.

### Directory Map
1. `server/api/` — Nitro handlers organised by domain.
2. `server/utils/` — Shared utilities (Prisma client, auth helpers, hashing).
3. `prisma/` — Schema definitions and migrations.

### Command Library
1. `yarn prisma:generate` — Refresh generated Prisma client.
2. `npx prisma migrate dev --name <change>` — Apply and record local schema changes.
3. `npx prisma migrate deploy` — Execute migrations in production environments.
4. `npx prisma studio` — Launch GUI for interactive data inspection.

### Issue Playbook
1. **Prisma P1001 (cannot connect)**  
   - Confirm database credentials and network access.  
   - Restart the database service if necessary.
2. **JWT invalid signature**  
   - Rotate tokens, clear cookies, and verify `.env` secrets match across services.
3. **Unhandled promise rejection**  
   - Wrap async logic in `try/catch`.  
   - Throw `createError` with a safe client message.
4. **Missing relations in responses**  
   - Check Prisma queries for `include` or `select` coverage.
5. **Session cookie missing**  
   - Confirm the domain and path on the cookie align with the current host.  
   - Ensure HTTPS is used so `secure` cookies transmit correctly.
6. **403 despite valid login**  
   - Check role-to-permission mappings in the RBAC configuration.  
   - Audit the JWT payload to confirm `roles` contains the expected value.

### Reference Index
1. Advanced API samples — `server/api/devtool/**`
2. External token example — `server/api/metabase/token.get.js`
3. Prisma documentation — https://www.prisma.io/docs

### HTTP error code reference
| Code | When to use | Example message |
|------|-------------|-----------------|
| 200  | Health checks pass | `OK` |
| 301  | Endpoint moved (document in changelog) | `Moved Permanently` |
| 302  | Temporary redirect (e.g., login flow) | `Found` |
| 400  | Command misuse or malformed request | `Bad Request` |
| 401  | Missing authentication | `Unauthorized` |
| 403  | Authenticated but no permission | `Forbidden` |
| 404  | Endpoint not found | `Not Found` |
| 409  | Version mismatch in documentation | `Conflict` |
| 410  | Deprecated endpoint | `Gone` |
| 429  | Rate limit triggered | `Too Many Requests` |
| 500  | Server error during troubleshooting | `Internal Server Error` |
| 503  | Maintenance window or dependency outage | `Service Unavailable` |

## 3.5 CRUD Reference Manual
### Overview
Use this manual to implement ticket CRUD endpoints in Nuxt Nitro. Follow the numbered procedures in order, starting with simple reads and finishing with secure write patterns.

### Description
This reference equips you with battle-tested CRUD snippets tailored to the Sales Kit ticket domain. Each step highlights the exact Nitro handler, Prisma call, and security guard you need so you can stand up new endpoints or audit existing ones with confidence.

### Prerequisites
- Shared Prisma client available under `server/utils/prisma.ts`.
- Authentication helper such as `requireUserSession(event)` ready to call inside handlers.
- Validation helper (`zod` in the examples) installed and imported.

### Step 1 · Read a single record
- Path: `server/api/tickets/[id].get.ts`
```javascript
import { z } from "zod"

const paramsSchema = z.object({ id: z.string().uuid("Invalid ticket id") })

export default defineEventHandler(async (event) => {
  const user = await requireUserSession(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: "Unauthorized" })

  const { id } = paramsSchema.parse({ id: getRouterParam(event, "id") })

  const ticket = await prisma.ticket.findUnique({ where: { id } })
  if (!ticket) throw createError({ statusCode: 404, statusMessage: "Ticket not found" })

  return { success: true, data: ticket }
})
```

### Step 2 · List records with pagination
- Path: `server/api/tickets/index.get.ts`
```javascript
import { z } from "zod"

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  const user = await requireUserSession(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: "Unauthorized" })

  const query = querySchema.parse(getQuery(event))
  const where = query.search
    ? { title: { contains: query.search, mode: "insensitive" } }
    : {}

  const [items, total] = await prisma.$transaction([
    prisma.ticket.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.ticket.count({ where }),
  ])

  return {
    success: true,
    data: items,
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      pageCount: Math.ceil(total / query.pageSize),
    },
  }
})
```

### Step 3 · Create a record
- Path: `server/api/tickets/index.post.ts`
```javascript
import { z } from "zod"

const bodySchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
})

export default defineEventHandler(async (event) => {
  const user = await requireUserSession(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: "Unauthorized" })

  const body = bodySchema.parse(await readBody(event))

  const ticket = await prisma.ticket.create({
    data: {
      title: body.title,
      description: body.description,
      priority: body.priority,
      ownerId: user.id,
    },
  })

  return { success: true, data: ticket }
})
```

### Step 4 · Replace a record
- Path: `server/api/tickets/[id].put.ts`
```javascript
import { z } from "zod"

const putSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
})

export default defineEventHandler(async (event) => {
  const user = await requireUserSession(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: "Unauthorized" })

  const id = getRouterParam(event, "id")
  if (!id) throw createError({ statusCode: 400, statusMessage: "Missing ticket id" })

  const payload = putSchema.parse(await readBody(event))

  const ticket = await prisma.ticket.update({
    where: { id },
    data: payload,
  })

  return { success: true, data: ticket }
})
```

### Step 5 · Partially update a record
- Path: `server/api/tickets/[id].patch.ts`
```javascript
import { z } from "zod"

const patchSchema = z
  .object({
    title: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    "Provide at least one field to update.",
  )

export default defineEventHandler(async (event) => {
  const user = await requireUserSession(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: "Unauthorized" })

  const id = getRouterParam(event, "id")
  if (!id) throw createError({ statusCode: 400, statusMessage: "Missing ticket id" })

  const payload = patchSchema.parse(await readBody(event))

  const ticket = await prisma.ticket.update({
    where: { id },
    data: payload,
  })

  return { success: true, data: ticket }
})
```

### Step 6 · Soft-delete a record
- Path: `server/api/tickets/[id].delete.ts`
```javascript
export default defineEventHandler(async (event) => {
  const user = await requireUserSession(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: "Unauthorized" })

  const id = getRouterParam(event, "id")
  if (!id) throw createError({ statusCode: 400, statusMessage: "Missing ticket id" })

  await prisma.ticket.update({
    where: { id },
    data: { deletedAt: new Date(), deletedById: user.id },
  })

  return { success: true, data: null }
})
```

### Step 7 · Hash sensitive fields
- Helper: `server/utils/hashSecret.ts`
```javascript
import { createHash } from "node:crypto"

export const hashSecret = (value: string, salt: string) => {
  return createHash("sha256").update(`${salt}:${value}`).digest("hex")
}
```
- Usage: add hashed data when writing secure values.
```javascript
import { hashSecret } from "~/server/utils/hashSecret"

const { securitySalt } = useRuntimeConfig()
const confidentialNoteHash = body.confidentialNote
  ? hashSecret(body.confidentialNote, securitySalt)
  : null

await prisma.ticket.create({
  data: {
    title: body.title,
    description: body.description,
    confidentialNoteHash,
  },
})
```

### Pagination checklist
- Restrict `pageSize` to safe limits (1–100).
- Return `{ page, pageSize, total, pageCount }` with every paged response.
- Wrap `findMany` and `count` in a single `prisma.$transaction`.
- Apply filters (search, status, owner) to reduce payloads.

### Troubleshooting
1. **GET handlers return 404 unexpectedly**  
   - Verify `id` route params are passed through `zod` coercion (string vs UUID).  
   - Confirm soft-deleted records are excluded only when intended.
2. **PATCH overwrites fields unintentionally**  
   - Ensure `partial()` schema only includes optional fields and omit defaults.  
   - Use Prisma `data: { ...payload }` carefully; consider selective mapping.
3. **DELETE still shows the record**  
   - Check that the UI filters out `deletedAt != null`.  
   - Confirm the soft-delete timestamp local clock matches DB time zone expectations.
4. **Hash mismatch on verification**  
   - Compare salts between environments; mismatched runtime config leads to different hashes.  
   - Normalize inputs (trim whitespace) before hashing to maintain consistency.

### HTTP error code reference
| Code | When to use | Example message |
|------|-------------|-----------------|
| 200  | Successful CRUD operation | `OK` |
| 201  | Record created via POST | `Ticket created successfully` |
| 204  | Soft-delete acknowledged | `No Content` |
| 400  | Validation failure | `Missing required field: title` |
| 401  | Missing/invalid auth | `Unauthorized` |
| 403  | RBAC prevents action | `Forbidden` |
| 404  | Ticket not found | `Ticket not found` |
| 409  | Optimistic lock conflict | `Ticket updated by another user` |
| 422  | Business rule violation | `Status transition not allowed` |
| 429  | Rate limit exceeded | `Too many requests` |
| 500  | Unhandled server exception | `Internal Server Error` |