import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

type Period = "week" | "month" | "year";

function getPeriodBounds(period: Period, reference: Date): { start: Date; end: Date } {
  const d = new Date(reference);
  if (period === "week") {
    const day = d.getDay();
    const diffToMon = day === 0 ? -6 : 1 - day;
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
  const start = new Date(d.getFullYear(), 0, 1);
  const end = new Date(d.getFullYear() + 1, 0, 1);
  return { start, end };
}

function getTimeLabels(period: Period, start: Date, end: Date): string[] {
  if (period === "week") {
    return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  }
  if (period === "month") {
    const labels: string[] = [];
    const ws = new Date(start);
    let wn = 1;
    while (ws < end) {
      labels.push(`Wk ${wn}`);
      ws.setDate(ws.getDate() + 7);
      wn++;
    }
    return labels;
  }
  return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
}

function getBucketIndex(period: Period, date: Date, start: Date, end: Date): number {
  if (period === "week") {
    const day = date.getDay();
    return day === 0 ? 6 : day - 1;
  }
  if (period === "month") {
    const diff = Math.floor((date.getTime() - start.getTime()) / (7 * 24 * 3600 * 1000));
    const maxWeeks = getTimeLabels(period, start, end).length;
    return Math.min(diff, maxWeeks - 1);
  }
  return date.getMonth();
}

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const period: Period = (searchParams.get("period") as Period) ?? "month";

  if (!["week", "month", "year"].includes(period)) {
    return NextResponse.json({ error: "Invalid period" }, { status: 400 });
  }

  const now = new Date();
  const { start, end } = getPeriodBounds(period, now);
  const labels = getTimeLabels(period, start, end);

  // Get all projects the user is a member of
  const memberships = await prisma.projectMember.findMany({
    where: { userId: session.user.id },
    include: {
      project: {
        select: { id: true, name: true, color: true, hourlyRate: true, currency: true },
      },
    },
  });

  const projectIds = memberships.map((m) => m.project.id);

  if (projectIds.length === 0) {
    return NextResponse.json({ labels, projects: [], series: [] });
  }

  // Fetch all completed entries within the period for these projects
  const entries = await prisma.timeEntry.findMany({
    where: {
      projectId: { in: projectIds },
      endTime: { not: null },
      startTime: { gte: start, lt: end },
    },
    select: { startTime: true, duration: true, projectId: true },
    orderBy: { startTime: "asc" },
  });

  // Build per-project stats
  const projectMap = new Map(memberships.map((m) => [m.project.id, m.project]));

  // Overall pie data (total hours per project in period)
  const pieData: { id: string; name: string; color: string; hours: number; earnings: number }[] = [];

  // Time series per project
  const seriesMap = new Map<string, { hours: number[]; earnings: number[] }>();
  for (const pid of projectIds) {
    seriesMap.set(pid, {
      hours: new Array(labels.length).fill(0),
      earnings: new Array(labels.length).fill(0),
    });
  }

  for (const entry of entries) {
    if (!entry.projectId) continue;
    const proj = projectMap.get(entry.projectId);
    if (!proj) continue;
    const secs = entry.duration ?? 0;
    const hours = secs / 3600;
    const idx = getBucketIndex(period, entry.startTime, start, end);
    const series = seriesMap.get(entry.projectId);
    if (series && idx >= 0 && idx < labels.length) {
      series.hours[idx] = Math.round((series.hours[idx] + hours) * 100) / 100;
      const earn = proj.hourlyRate != null ? hours * proj.hourlyRate : 0;
      series.earnings[idx] = Math.round((series.earnings[idx] + earn) * 100) / 100;
    }
  }

  for (const pid of projectIds) {
    const proj = projectMap.get(pid)!;
    const series = seriesMap.get(pid)!;
    const totalHours = series.hours.reduce((s, h) => s + h, 0);
    const totalEarnings = series.earnings.reduce((s, e) => s + e, 0);
    pieData.push({
      id: pid,
      name: proj.name,
      color: proj.color,
      hours: Math.round(totalHours * 100) / 100,
      earnings: Math.round(totalEarnings * 100) / 100,
    });
  }

  const series = projectIds.map((pid) => {
    const proj = projectMap.get(pid)!;
    const s = seriesMap.get(pid)!;
    return {
      id: pid,
      name: proj.name,
      color: proj.color,
      currency: proj.currency,
      hourlyRate: proj.hourlyRate,
      hours: s.hours,
      earnings: s.earnings,
    };
  });

  return NextResponse.json({
    period,
    start: start.toISOString(),
    end: end.toISOString(),
    labels,
    projects: pieData,
    series,
  });
}
