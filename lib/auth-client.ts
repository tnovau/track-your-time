import { createAuthClient } from "better-auth/react";

const clientBaseUrl =
  process.env.NEXT_PUBLIC_APP_URL ??
  (typeof window === "undefined" ? "http://localhost:3000" : window.location.origin);

export const authClient = createAuthClient({
  baseURL: clientBaseUrl,
});

export const { signIn, signOut, signUp, useSession } = authClient;
