import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const entry = await prisma.timeEntry.findFirst({
    where: { id, userId: session.user.id, endTime: null },
  });

  if (!entry) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  const now = new Date();
  const duration = Math.floor(
    (now.getTime() - entry.startTime.getTime()) / 1000
  );

  const updated = await prisma.timeEntry.update({
    where: { id },
    data: { endTime: now, duration },
    include: { project: { select: { id: true, name: true, color: true } } },
  });

  return NextResponse.json(updated);
}
