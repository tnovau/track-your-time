import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

type Period = "week" | "month" | "year";

interface DataPoint {
  label: string;
  amount: number;
  tax: number;
  count: number;
  billableAmount: number;
}

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

function aggregateExpenses(
  expenses: { amount: number; tax: number | null; billable: boolean; date: Date }[],
  period: Period,
  start: Date,
  end: Date
): DataPoint[] {
  const points: DataPoint[] = [];

  if (period === "week") {
    const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    for (let i = 0; i < 7; i++) {
      const dayStart = new Date(start);
      dayStart.setDate(start.getDate() + i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayStart.getDate() + 1);
      const bucket = expenses.filter((e) => e.date >= dayStart && e.date < dayEnd);
      points.push({
        label: DAY_LABELS[i],
        amount: Math.round(bucket.reduce((s, e) => s + e.amount, 0) * 100) / 100,
        tax: Math.round(bucket.reduce((s, e) => s + (e.tax ?? 0), 0) * 100) / 100,
        count: bucket.length,
        billableAmount: Math.round(bucket.filter((e) => e.billable).reduce((s, e) => s + e.amount, 0) * 100) / 100,
      });
    }
  } else if (period === "month") {
    let weekStart = new Date(start);
    let weekNum = 1;
    while (weekStart < end) {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      const cutoff = weekEnd < end ? weekEnd : end;
      const bucket = expenses.filter((e) => e.date >= weekStart && e.date < cutoff);
      points.push({
        label: `Wk ${weekNum}`,
        amount: Math.round(bucket.reduce((s, e) => s + e.amount, 0) * 100) / 100,
        tax: Math.round(bucket.reduce((s, e) => s + (e.tax ?? 0), 0) * 100) / 100,
        count: bucket.length,
        billableAmount: Math.round(bucket.filter((e) => e.billable).reduce((s, e) => s + e.amount, 0) * 100) / 100,
      });
      weekStart = weekEnd;
      weekNum++;
    }
  } else {
    const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    for (let m = 0; m < 12; m++) {
      const mStart = new Date(start.getFullYear(), m, 1);
      const mEnd = new Date(start.getFullYear(), m + 1, 1);
      const bucket = expenses.filter((e) => e.date >= mStart && e.date < mEnd);
      points.push({
        label: MONTH_LABELS[m],
        amount: Math.round(bucket.reduce((s, e) => s + e.amount, 0) * 100) / 100,
        tax: Math.round(bucket.reduce((s, e) => s + (e.tax ?? 0), 0) * 100) / 100,
        count: bucket.length,
        billableAmount: Math.round(bucket.filter((e) => e.billable).reduce((s, e) => s + e.amount, 0) * 100) / 100,
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

  const membership = await prisma.projectMember.findFirst({
    where: { projectId: id, userId: session.user.id },
    include: { project: { select: { name: true, color: true, currency: true } } },
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

  const allExpenses = await prisma.expense.findMany({
    where: {
      projectId: id,
      date: { gte: previous.start, lt: current.end },
    },
    select: { amount: true, tax: true, billable: true, date: true },
    orderBy: { date: "asc" },
  });

  const currentExpenses = allExpenses.filter(
    (e) => e.date >= current.start && e.date < current.end
  );
  const previousExpenses = allExpenses.filter(
    (e) => e.date >= previous.start && e.date < previous.end
  );

  const { name, color, currency } = membership.project;

  const currentData = aggregateExpenses(currentExpenses, period, current.start, current.end);
  const previousData = aggregateExpenses(previousExpenses, period, previous.start, previous.end);

  const sum = (arr: DataPoint[], key: keyof Omit<DataPoint, "label">) =>
    Math.round(arr.reduce((s, d) => s + d[key], 0) * 100) / 100;

  return NextResponse.json({
    project: { id, name, color, currency },
    period,
    current: {
      start: current.start.toISOString(),
      end: current.end.toISOString(),
      data: currentData,
      totalAmount: sum(currentData, "amount"),
      totalTax: sum(currentData, "tax"),
      totalCount: sum(currentData, "count"),
      totalBillableAmount: sum(currentData, "billableAmount"),
    },
    previous: {
      start: previous.start.toISOString(),
      end: previous.end.toISOString(),
      data: previousData,
      totalAmount: sum(previousData, "amount"),
      totalTax: sum(previousData, "tax"),
      totalCount: sum(previousData, "count"),
      totalBillableAmount: sum(previousData, "billableAmount"),
    },
  });
}
