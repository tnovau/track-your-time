import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";

export const auth = betterAuth({
  trustedOrigins: [process.env.BETTER_AUTH_URL || process.env.VERCEL_URL || "http://localhost:3000"],
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      redirectURI: process.env.VERCEL_URL ? `${process.env.VERCEL_URL}/api/auth/callback/google` : undefined,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
      redirectURI: process.env.VERCEL_URL ? `${process.env.VERCEL_URL}/api/auth/callback/github` : undefined,
    },
  },
});
