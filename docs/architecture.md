# Architecture

## Technology stack

| Layer | Technology |
|---|---|
| Web framework | [Next.js 16](https://nextjs.org/) with App Router |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| ORM | [Prisma 7](https://www.prisma.io/) |
| Database | PostgreSQL 17 (Docker for local dev) |
| Authentication | [Better Auth 1.x](https://www.better-auth.com/) |
| File storage | [Uploadthing](https://uploadthing.com/) (free tier) |
| Image-to-PDF | [pdf-lib](https://pdf-lib.js.org/) |

## Project structure

```
track-your-time/
├── app/                         # Next.js App Router pages & API routes
│   ├── api/
│   │   ├── auth/[...all]/       # Better Auth catch-all handler
│   │   ├── projects/            # CRUD for projects
│   │   │   └── [id]/
│   │   │       ├── members/     # Project member management
│   │   │       └── members/[memberId]/  # Per-member role & removal
│   │   ├── expenses/            # CRUD for expenses
│   │   │   ├── [id]/            # Per-expense update & delete
│   │   │   └── upload/          # File upload with image-to-PDF conversion
│   │   └── time-entries/        # CRUD for time entries
│   │       └── [id]/stop/       # PATCH to stop a running entry
│   ├── dashboard/               # Protected dashboard page
│   ├── projects/                # Protected projects page
│   ├── sign-in/                 # Sign-in page
│   ├── generated/prisma/        # Auto-generated Prisma client (git-ignored)
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                 # Landing page
├── components/
│   ├── time-tracker.tsx         # Client component for the timer UI
│   └── project-manager.tsx      # Client component for project & member management
├── docs/                        # Project documentation
├── lib/
│   ├── auth.ts                  # Better Auth server-side instance
│   ├── auth-client.ts           # Better Auth client-side helpers
│   ├── prisma.ts                # Prisma singleton
│   └── uploadthing.ts           # Uploadthing UTApi singleton
├── prisma/
│   ├── schema.prisma            # Database schema
│   └── migrations/              # SQL migration history
├── prisma.config.ts             # Prisma CLI configuration
├── docker-compose.yml           # PostgreSQL 17 service
├── .env.example                 # Example environment variables
└── next.config.ts               # Next.js configuration
```

## Data flow

```
Browser
  └─► Next.js API Route  (app/api/*)
        └─► Prisma Client
              └─► PostgreSQL
```

Authentication is handled entirely by Better Auth:
- The catch-all route `app/api/auth/[...all]/route.ts` forwards every
  `/api/auth/*` request to Better Auth's handler.
- Sessions are stored in the `Session` table in PostgreSQL.
- The `auth.api.getSession()` helper is used in server components and API
  routes to verify the current user.

## Design decisions

- **App Router** – all pages are React Server Components by default. Client
  interactivity (the timer) is isolated in `components/time-tracker.tsx`.
- **Prisma singleton** – `lib/prisma.ts` follows the recommended pattern for
  Next.js to avoid creating multiple database connections during hot reload.
- **Better Auth** – chosen for its first-class TypeScript support, Prisma
  adapter, and built-in social OAuth providers.
