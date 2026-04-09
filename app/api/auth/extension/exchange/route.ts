import { NextRequest, NextResponse } from "next/server";
import { consumeExtensionBridgeCode } from "@/lib/extension-auth-bridge";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as
    | { code?: string; state?: string }
    | null;

  if (!body?.code || !body?.state) {
    return NextResponse.json(
      { error: "Missing code or state" },
      { status: 400 }
    );
  }

  const exchange = consumeExtensionBridgeCode({
    code: body.code,
    state: body.state,
  });

  if (!exchange) {
    return NextResponse.json(
      { error: "Invalid or expired bridge code" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    cookie: exchange.cookieHeader,
  });
}
