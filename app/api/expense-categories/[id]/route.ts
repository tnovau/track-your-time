import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const category = await prisma.expenseCategory.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!category) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.expenseCategory.update({
    where: { id },
    data: { name: body.name.trim() },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const category = await prisma.expenseCategory.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!category) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.expenseCategory.delete({ where: { id } });

  return new NextResponse(null, { status: 204 });
}
