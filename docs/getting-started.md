# Getting Started

## Prerequisites

- [Node.js](https://nodejs.org/) v20 or later
- [Docker](https://www.docker.com/) and Docker Compose (for the local database)
- A Google OAuth app and/or a GitHub OAuth app (see [Authentication](./authentication.md))

## 1. Clone and install dependencies

```bash
git clone <repo-url>
cd track-your-time
npm install
```

## 2. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in the required values:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Random secret (run `openssl rand -base64 32`) |
| `BETTER_AUTH_URL` | Base URL of your app (e.g. `http://localhost:3000`) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GITHUB_CLIENT_ID` | GitHub OAuth App client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App client secret |

## 3. Start the database

```bash
docker compose up -d
```

This starts a PostgreSQL 17 container on port **5432**.

## 4. Run database migrations

```bash
npx prisma migrate dev --name init
```

This creates all the tables defined in `prisma/schema.prisma`.

## 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Useful scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server with hot reload |
| `npm run build` | Create a production build |
| `npm run start` | Run the production build |
| `npm run lint` | Run ESLint |
| `npx prisma studio` | Open Prisma Studio to browse the database |
| `npx prisma migrate dev` | Create and run a new migration |
| `npx prisma generate` | Re-generate the Prisma client |
