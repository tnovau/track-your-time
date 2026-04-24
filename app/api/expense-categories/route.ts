import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

const CATEGORY_COLORS = [
  "#6366f1", "#f59e0b", "#10b981", "#ef4444", "#3b82f6",
  "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#84cc16",
];

function pickColor(existingColors: string[]): string {
  const used = new Set(existingColors);
  return CATEGORY_COLORS.find((c) => !used.has(c)) ?? CATEGORY_COLORS[existingColors.length % CATEGORY_COLORS.length];
}

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const categories = await prisma.expenseCategory.findMany({
    where: { userId: session.user.id },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const existing = await prisma.expenseCategory.findMany({
    where: { userId: session.user.id },
    select: { color: true },
  });

  const category = await prisma.expenseCategory.create({
    data: {
      name: body.name.trim(),
      color: pickColor(existing.map((c) => c.color)),
      userId: session.user.id,
    },
  });

  return NextResponse.json(category, { status: 201 });
}
