import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { createExtensionBridgeCode } from "@/lib/extension-auth-bridge";

function isAllowedRedirectUri(redirectUri: string) {
  try {
    const url = new URL(redirectUri);
    if (url.protocol !== "http:") return false;
    return url.hostname === "127.0.0.1" || url.hostname === "localhost";
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const redirectUri = searchParams.get("redirect_uri");
  const state = searchParams.get("state");

  if (!redirectUri || !state) {
    return NextResponse.json(
      { error: "Missing redirect_uri or state" },
      { status: 400 }
    );
  }

  if (!isAllowedRedirectUri(redirectUri)) {
    return NextResponse.json(
      { error: "redirect_uri must point to localhost" },
      { status: 400 }
    );
  }

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    const callbackURL = `${origin}/api/auth/extension/complete?redirect_uri=${encodeURIComponent(
      redirectUri
    )}&state=${encodeURIComponent(state)}`;
    const signInUrl = `${origin}/sign-in?callbackURL=${encodeURIComponent(callbackURL)}`;
    return NextResponse.redirect(signInUrl);
  }

  const cookieHeader = (await headers()).get("cookie");
  if (!cookieHeader) {
    return NextResponse.json(
      { error: "No session cookie present" },
      { status: 400 }
    );
  }

  const code = createExtensionBridgeCode({
    cookieHeader,
    state,
  });

  const target = new URL(redirectUri);
  target.searchParams.set("code", code);
  target.searchParams.set("state", state);
  return NextResponse.redirect(target.toString());
}
