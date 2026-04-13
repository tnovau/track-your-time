# Copilot Instructions — Track Your Time

## Build & Dev Commands

```bash
npm run dev              # Start dev server
npm run build            # prisma generate + next build
npm run lint             # ESLint
docker compose up -d     # Start PostgreSQL
npx prisma migrate dev --name <name>  # Create/apply migration
npx prisma studio        # DB browser
```

No test framework is configured.

## Architecture

Next.js 16 App Router with TypeScript, Tailwind CSS v4, Prisma 7 (PostgreSQL), and Better Auth for authentication. Volta-pinned to Node 24.

### Prisma 7 Setup

Prisma 7 requires the connection URL in `prisma.config.ts`, not in `schema.prisma`. The generated client outputs to `app/generated/prisma/` (git-ignored). PrismaClient is instantiated with a `PrismaPg` adapter in `lib/prisma.ts` using the global singleton pattern to survive hot reload.

```typescript
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma/client";
```

### Authentication (Better Auth)

- Server config: `lib/auth.ts` — exports `auth` (Better Auth instance with Prisma adapter)
- Client helpers: `lib/auth-client.ts` — exports `authClient`, `useSession`, `signIn`, `signOut`
- Catch-all route: `app/api/auth/[...all]/route.ts`
- OAuth providers: Google and GitHub

**Session check pattern** (used in every protected API route and server page):

```typescript
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const session = await auth.api.getSession({ headers: await headers() });
if (!session) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
// Use session.user.id for all queries
```

### Role-Based Access (Project Sharing)

Projects use a `ProjectMember` join table with roles: `ADMIN`, `TRACKER`, `READER`. The project creator is auto-added as `ADMIN`. Access is always checked via the membership record, never by `project.userId` alone:

```typescript
const membership = await prisma.projectMember.findFirst({
  where: { projectId: id, userId: session.user.id },
});
if (!membership) {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
if (membership.role !== "ADMIN") {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
```

### Time Entry Model

- A running timer has `endTime: null` and `duration: null` — there is no status enum.
- Duration is stored in seconds as an integer: `Math.floor((endTime - startTime) / 1000)`.
- When filtering by a shared project, the API returns entries from **all** project members, not just the authenticated user.
- Unfiltered queries return only the authenticated user's 50 most recent entries.

### VSCode Extension

The `vscode-extension/` directory contains a companion VS Code extension. It authenticates via temporary bridge codes generated in `lib/extension-auth-bridge.ts` (60-second TTL, single-use). The extension is a separate project with its own `package.json` and is excluded from the main app's lint/build.

## Conventions

### API Route Patterns

All API routes follow this structure:

1. Check session (401 if missing)
2. Validate input (400 with `{ error: "message" }`)
3. Check resource exists and user has access (404 if not found, 403 if wrong role)
4. Perform operation
5. Return response:
   - Success: `NextResponse.json(data)` with 200 or 201
   - Delete: `new NextResponse(null, { status: 204 })`
   - Errors: `NextResponse.json({ error: "Message" }, { status: code })`

### Component Patterns

- Pages are Server Components by default; interactive components use `"use client"`.
- Client components fetch API routes with `fetch()` and manage their own loading/error states.
- Import alias: `@/` maps to project root.

### Styling

Tailwind CSS v4 with dark mode (`dark:` prefix). Primary accent is indigo-600. Project colors are 6-digit hex codes validated with `/^#[0-9a-fA-F]{6}$/`. Fonts: Geist Sans (body) and Geist Mono.

### Analytics

Analytics endpoints accept `?period=week|month|year` and return bucketed data:
- `week` → daily buckets, `month` → weekly buckets, `year` → monthly buckets
- Only completed entries (non-null `endTime`) are aggregated
- Earnings calculated as `hours * project.hourlyRate` (0 if no rate set)
