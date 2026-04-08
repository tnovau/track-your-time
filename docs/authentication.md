# Authentication

Track Your Time uses **[Better Auth](https://www.better-auth.com/)** for authentication. It supports social sign-in with Google and GitHub out of the box.

## How it works

1. The user clicks "Continue with Google" or "Continue with GitHub" on the sign-in page.
2. Better Auth redirects the user to the OAuth provider.
3. After successful authentication the provider redirects back to `/api/auth/callback/<provider>`.
4. Better Auth creates or updates the `User`, `Account`, and `Session` records in the database.
5. The user is redirected to `/dashboard`.

## Server-side configuration (`lib/auth.ts`)

```ts
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";

const vercelUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : undefined;

const authUrl = process.env.BETTER_AUTH_URL ?? vercelUrl ?? "http://localhost:3000";

export const auth = betterAuth({
  baseURL: authUrl,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    },
  },
});
```

## Client-side helpers (`lib/auth-client.ts`)

```ts
import { createAuthClient } from "better-auth/react";

const clientBaseUrl =
  process.env.NEXT_PUBLIC_APP_URL ??
  (typeof window === "undefined" ? "http://localhost:3000" : window.location.origin);

export const authClient = createAuthClient({ baseURL: clientBaseUrl });
export const { signIn, signOut, signUp, useSession } = authClient;
```

## Setting up OAuth providers

### Google

1. Go to [Google Cloud Console → APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials).
2. Create an **OAuth 2.0 Client ID** (Application type: Web application).
3. Add `http://localhost:3000/api/auth/callback/google` to the **Authorised redirect URIs**.
4. Copy the **Client ID** and **Client Secret** into `.env`:
   ```
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   ```

### GitHub

1. Go to [GitHub → Settings → Developer settings → OAuth Apps → New OAuth App](https://github.com/settings/applications/new).
2. Set **Authorization callback URL** to `http://localhost:3000/api/auth/callback/github`.
3. Copy the **Client ID** and generate a **Client Secret**:
   ```
   GITHUB_CLIENT_ID=...
   GITHUB_CLIENT_SECRET=...
   ```

## Protecting pages

Use `auth.api.getSession()` in a Server Component to protect any route:

```ts
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const session = await auth.api.getSession({ headers: await headers() });
if (!session) redirect("/sign-in");
```

## Vercel preview deployments

If you want preview deployments to use a different database and still support OAuth login, configure a dedicated **Preview** environment in Vercel.

### 1. Set Preview environment variables in Vercel

In **Project Settings -> Environment Variables**, set these values for the **Preview** environment:

- `DATABASE_URL`: connection string for your preview PostgreSQL database
- `BETTER_AUTH_SECRET`: auth secret for preview
- `BETTER_AUTH_URL`: the preview app URL (recommended: a stable preview domain)
- `NEXT_PUBLIC_APP_URL`: same value as `BETTER_AUTH_URL`
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`: preview OAuth app credentials
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`: preview OAuth app credentials

Use different credentials from production so preview auth sessions and users are isolated.

### 2. Register preview callback URLs in providers

For your preview OAuth apps, add callback URLs that match the preview domain:

- Google: `https://<preview-domain>/api/auth/callback/google`
- GitHub: `https://<preview-domain>/api/auth/callback/github`

Important: most OAuth providers do not allow wildcard callback URLs. Use a stable preview hostname (for example a branch domain or a dedicated preview custom domain), not random per-deployment URLs.

### 3. Keep production and preview isolated

- Production Vercel environment should keep production `DATABASE_URL` and OAuth credentials.
- Preview Vercel environment should keep preview `DATABASE_URL` and OAuth credentials.
- Development keeps local `.env` values.

This project resolves auth URLs from `BETTER_AUTH_URL` first, then `VERCEL_URL`, which helps preview deployments work reliably when environment variables are set.
