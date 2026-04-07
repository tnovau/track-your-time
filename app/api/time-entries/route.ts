import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const entries = await prisma.timeEntry.findMany({
    where: { userId: session.user.id },
    include: { project: { select: { id: true, name: true, color: true } } },
    orderBy: { startTime: "desc" },
    take: 50,
  });

  return NextResponse.json(entries);
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Stop any currently running entry first
  const running = await prisma.timeEntry.findFirst({
    where: { userId: session.user.id, endTime: null },
  });
  if (running) {
    const now = new Date();
    const duration = Math.floor(
      (now.getTime() - running.startTime.getTime()) / 1000
    );
    await prisma.timeEntry.update({
      where: { id: running.id },
      data: { endTime: now, duration },
    });
  }

  const body = await req.json();
  const entry = await prisma.timeEntry.create({
    data: {
      description: body.description ?? null,
      startTime: new Date(),
      userId: session.user.id,
      projectId: body.projectId ?? null,
    },
    include: { project: { select: { id: true, name: true, color: true } } },
  });

  return NextResponse.json(entry, { status: 201 });
}
