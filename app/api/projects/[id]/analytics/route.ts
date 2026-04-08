import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

type Period = "week" | "month" | "year";

interface DataPoint {
  label: string;
  hours: number;
  earnings: number;
}

function getPeriodBounds(period: Period, reference: Date): { start: Date; end: Date } {
  const d = new Date(reference);
  if (period === "week") {
    const day = d.getDay(); // 0=Sun
    const diffToMon = (day === 0 ? -6 : 1 - day);
    const mon = new Date(d);
    mon.setHours(0, 0, 0, 0);
    mon.setDate(d.getDate() + diffToMon);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 7);
    return { start: mon, end: sun };
  }
  if (period === "month") {
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    return { start, end };
  }
  // year
  const start = new Date(d.getFullYear(), 0, 1);
  const end = new Date(d.getFullYear() + 1, 0, 1);
  return { start, end };
}

function shiftPeriod(period: Period, start: Date, delta: number): Date {
  const d = new Date(start);
  if (period === "week") {
    d.setDate(d.getDate() + delta * 7);
  } else if (period === "month") {
    d.setMonth(d.getMonth() + delta);
  } else {
    d.setFullYear(d.getFullYear() + delta);
  }
  return d;
}

function aggregateEntries(
  entries: { startTime: Date; duration: number | null }[],
  period: Period,
  start: Date,
  end: Date,
  hourlyRate: number | null
): DataPoint[] {
  const points: DataPoint[] = [];

  if (period === "week") {
    // 7 days: Mon–Sun
    const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    for (let i = 0; i < 7; i++) {
      const dayStart = new Date(start);
      dayStart.setDate(start.getDate() + i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayStart.getDate() + 1);
      const secs = entries
        .filter((e) => e.startTime >= dayStart && e.startTime < dayEnd)
        .reduce((s, e) => s + (e.duration ?? 0), 0);
      const hours = secs / 3600;
      points.push({
        label: DAY_LABELS[i],
        hours: Math.round(hours * 100) / 100,
        earnings: hourlyRate != null ? Math.round(hours * hourlyRate * 100) / 100 : 0,
      });
    }
  } else if (period === "month") {
    // Weeks within the month
    let weekStart = new Date(start);
    let weekNum = 1;
    while (weekStart < end) {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      const secs = entries
        .filter((e) => e.startTime >= weekStart && e.startTime < (weekEnd < end ? weekEnd : end))
        .reduce((s, e) => s + (e.duration ?? 0), 0);
      const hours = secs / 3600;
      points.push({
        label: `Wk ${weekNum}`,
        hours: Math.round(hours * 100) / 100,
        earnings: hourlyRate != null ? Math.round(hours * hourlyRate * 100) / 100 : 0,
      });
      weekStart = weekEnd;
      weekNum++;
    }
  } else {
    // 12 months
    const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    for (let m = 0; m < 12; m++) {
      const mStart = new Date(start.getFullYear(), m, 1);
      const mEnd = new Date(start.getFullYear(), m + 1, 1);
      const secs = entries
        .filter((e) => e.startTime >= mStart && e.startTime < mEnd)
        .reduce((s, e) => s + (e.duration ?? 0), 0);
      const hours = secs / 3600;
      points.push({
        label: MONTH_LABELS[m],
        hours: Math.round(hours * 100) / 100,
        earnings: hourlyRate != null ? Math.round(hours * hourlyRate * 100) / 100 : 0,
      });
    }
  }

  return points;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Check membership
  const membership = await prisma.projectMember.findFirst({
    where: { projectId: id, userId: session.user.id },
    include: { project: { select: { hourlyRate: true, currency: true, name: true, color: true } } },
  });

  if (!membership) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const period: Period = (searchParams.get("period") as Period) ?? "week";

  if (!["week", "month", "year"].includes(period)) {
    return NextResponse.json({ error: "Invalid period" }, { status: 400 });
  }

  const now = new Date();
  const current = getPeriodBounds(period, now);
  const prevStart = shiftPeriod(period, current.start, -1);
  const previous = getPeriodBounds(period, prevStart);

  // Fetch all completed entries for both periods
  const allEntries = await prisma.timeEntry.findMany({
    where: {
      projectId: id,
      endTime: { not: null },
      startTime: { gte: previous.start, lt: current.end },
    },
    select: { startTime: true, duration: true },
    orderBy: { startTime: "asc" },
  });

  const currentEntries = allEntries.filter(
    (e) => e.startTime >= current.start && e.startTime < current.end
  );
  const previousEntries = allEntries.filter(
    (e) => e.startTime >= previous.start && e.startTime < previous.end
  );

  const { hourlyRate, currency, name, color } = membership.project;

  const currentData = aggregateEntries(currentEntries, period, current.start, current.end, hourlyRate);
  const previousData = aggregateEntries(previousEntries, period, previous.start, previous.end, hourlyRate);

  const totalCurrentHours = currentData.reduce((s, d) => s + d.hours, 0);
  const totalCurrentEarnings = currentData.reduce((s, d) => s + d.earnings, 0);
  const totalPreviousHours = previousData.reduce((s, d) => s + d.hours, 0);
  const totalPreviousEarnings = previousData.reduce((s, d) => s + d.earnings, 0);

  return NextResponse.json({
    project: { id, name, color, hourlyRate, currency },
    period,
    current: {
      start: current.start.toISOString(),
      end: current.end.toISOString(),
      data: currentData,
      totalHours: Math.round(totalCurrentHours * 100) / 100,
      totalEarnings: Math.round(totalCurrentEarnings * 100) / 100,
    },
    previous: {
      start: previous.start.toISOString(),
      end: previous.end.toISOString(),
      data: previousData,
      totalHours: Math.round(totalPreviousHours * 100) / 100,
      totalEarnings: Math.round(totalPreviousEarnings * 100) / 100,
    },
  });
}
