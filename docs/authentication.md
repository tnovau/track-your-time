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

export const auth = betterAuth({
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

export const authClient = createAuthClient({ baseURL: "http://localhost:3000" });
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
