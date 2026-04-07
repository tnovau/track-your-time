# Track Your Time

A simple, powerful time tracking tool built with Next.js, Prisma, and Better Auth.

## Features

- ⏱ **One-click timers** – start and stop with a single button
- 📁 **Projects** – organise entries into colour-coded projects
- 🔐 **Authentication** – sign in with Google or GitHub via Better Auth
- 🗄 **PostgreSQL** – persistent storage with Prisma ORM

## Tech stack

| Layer | Technology |
|---|---|
| Web framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| ORM | Prisma 7 |
| Database | PostgreSQL 17 |
| Authentication | Better Auth 1.x |

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Fill in DATABASE_URL, BETTER_AUTH_SECRET, and OAuth credentials

# 3. Start the database
docker compose up -d

# 4. Run migrations
npx prisma migrate dev --name init

# 5. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Documentation

See the [`docs/`](./docs/README.md) folder for detailed documentation:

- [Getting Started](./docs/getting-started.md)
- [Architecture](./docs/architecture.md)
- [Authentication](./docs/authentication.md)
- [Database](./docs/database.md)
- [API Reference](./docs/api.md)

