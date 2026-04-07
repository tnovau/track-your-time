import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const projectFilter = searchParams.get("projectId");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const isFiltered = !!(projectFilter || dateFrom || dateTo);

  let entries;

  if (!isFiltered) {
    entries = await prisma.timeEntry.findMany({
      where: { userId: session.user.id },
      include: { project: { select: { id: true, name: true, color: true } } },
      orderBy: { startTime: "desc" },
      take: 50,
    });
  } else {
    // Build conditions for completed entries
    const completedConditions: Record<string, unknown> = {
      endTime: { not: null },
    };

    if (projectFilter === "none") {
      completedConditions.projectId = null;
    } else if (projectFilter) {
      completedConditions.projectId = projectFilter;
    }

    if (dateFrom || dateTo) {
      const startTimeFilter: { gte?: Date; lte?: Date } = {};
      if (dateFrom) startTimeFilter.gte = new Date(dateFrom);
      if (dateTo) startTimeFilter.lte = new Date(dateTo);
      completedConditions.startTime = startTimeFilter;
    }

    // Always include the running entry so the timer stays accurate
    entries = await prisma.timeEntry.findMany({
      where: {
        userId: session.user.id,
        OR: [{ endTime: null }, completedConditions],
      },
      include: { project: { select: { id: true, name: true, color: true } } },
      orderBy: { startTime: "desc" },
    });
  }

  return NextResponse.json(entries);
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  // Manual entry: startTime and endTime provided by the client
  if (body.startTime && body.endTime) {
    const startTime = new Date(body.startTime);
    const endTime = new Date(body.endTime);

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      return NextResponse.json(
        { error: "Invalid startTime or endTime" },
        { status: 400 }
      );
    }

    if (endTime <= startTime) {
      return NextResponse.json(
        { error: "endTime must be after startTime" },
        { status: 400 }
      );
    }

    const duration = Math.floor(
      (endTime.getTime() - startTime.getTime()) / 1000
    );

    const entry = await prisma.timeEntry.create({
      data: {
        description: body.description ?? null,
        startTime,
        endTime,
        duration,
        userId: session.user.id,
        projectId: body.projectId ?? null,
      },
      include: { project: { select: { id: true, name: true, color: true } } },
    });

    return NextResponse.json(entry, { status: 201 });
  }

  // Timer entry: stop any currently running entry first
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
