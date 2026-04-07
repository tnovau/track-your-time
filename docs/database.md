# Database

## Technology

Track Your Time uses **[Prisma 7](https://www.prisma.io/)** as the ORM and **PostgreSQL 17** as the database engine.

For local development a Dockerised PostgreSQL instance is provided via `docker-compose.yml`.

## Running locally

```bash
# Start the database
docker compose up -d

# Apply migrations
npx prisma migrate dev --name init

# (Optional) Open Prisma Studio
npx prisma studio
```

## Schema overview

The schema lives in `prisma/schema.prisma`.

### Better Auth tables

| Model | Description |
|---|---|
| `User` | Registered users |
| `Session` | Active authentication sessions |
| `Account` | Linked OAuth provider accounts |
| `Verification` | Email verification tokens |

### Application tables

| Model | Description |
|---|---|
| `Project` | User-defined projects (name, colour) |
| `TimeEntry` | Individual time records with optional project link |

### TimeEntry fields

| Field | Type | Description |
|---|---|---|
| `id` | String (cuid) | Primary key |
| `description` | String? | Optional description |
| `startTime` | DateTime | When the entry started |
| `endTime` | DateTime? | When the entry stopped (`null` if still running) |
| `duration` | Int? | Duration in **seconds** (`null` if still running) |
| `userId` | String | Owner (FK → User) |
| `projectId` | String? | Associated project (FK → Project, nullable) |

## Creating a migration

After editing `prisma/schema.prisma` run:

```bash
npx prisma migrate dev --name <description>
```

This will:
1. Generate a SQL migration file in `prisma/migrations/`.
2. Apply it to the local database.
3. Re-generate the Prisma client.

## Resetting the database

```bash
npx prisma migrate reset
```

> ⚠️ This deletes all data. Use only in development.
