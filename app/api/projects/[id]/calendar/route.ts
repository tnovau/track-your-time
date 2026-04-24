import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const membership = await prisma.projectMember.findFirst({
    where: { projectId: id, userId: session.user.id },
    include: { project: { select: { name: true, color: true } } },
  });

  if (!membership) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()), 10);
  const month = parseInt(searchParams.get("month") ?? String(new Date().getMonth() + 1), 10);

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    return NextResponse.json({ error: "Invalid year or month" }, { status: 400 });
  }

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  const entries = await prisma.timeEntry.findMany({
    where: {
      projectId: id,
      userId: session.user.id,
      startTime: { gte: start, lt: end },
    },
    select: { startTime: true, duration: true },
  });

  // Group by day-of-month, summing duration (running entries contribute 0)
  const byDay: Record<number, number> = {};
  for (const entry of entries) {
    const day = entry.startTime.getDate();
    byDay[day] = (byDay[day] ?? 0) + (entry.duration ?? 0);
  }

  const days = Object.entries(byDay).map(([day, seconds]) => ({
    day: parseInt(day, 10),
    hours: Math.round((seconds / 3600) * 100) / 100,
  }));

  return NextResponse.json({
    project: membership.project,
    year,
    month,
    days,
  });
}
