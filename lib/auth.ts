import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";

const vercelUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : undefined;

const authUrl = process.env.BETTER_AUTH_URL ?? vercelUrl ?? "http://localhost:3000";

const trustedOrigins = [authUrl, process.env.NEXT_PUBLIC_APP_URL, vercelUrl].filter(
  (origin): origin is string => Boolean(origin),
);

export const auth = betterAuth({
  baseURL: authUrl,
  trustedOrigins,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
  },
});
