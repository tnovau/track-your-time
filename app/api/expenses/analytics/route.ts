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
  const groupBy = searchParams.get("groupBy") === "category" ? "category" : "project";

  if (!["week", "month", "year"].includes(period)) {
    return NextResponse.json({ error: "Invalid period" }, { status: 400 });
  }

  const now = new Date();
  const { start, end } = getPeriodBounds(period, now);
  const labels = getTimeLabels(period, start, end);

  if (groupBy === "category") {
    const categories = await prisma.expenseCategory.findMany({
      where: { userId: session.user.id },
      select: { id: true, name: true, color: true },
    });

    const expenses = await prisma.expense.findMany({
      where: {
        userId: session.user.id,
        date: { gte: start, lt: end },
      },
      select: {
        amount: true,
        tax: true,
        billable: true,
        date: true,
        categoryId: true,
      },
      orderBy: { date: "asc" },
    });

    const NO_CATEGORY = { id: "__none__", name: "No Category", color: "#9ca3af" };
    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    const activeIds = new Set<string>();
    for (const e of expenses) activeIds.add(e.categoryId ?? NO_CATEGORY.id);

    const seriesMap = new Map<string, { amounts: number[]; taxes: number[]; counts: number[]; billableAmounts: number[] }>();
    for (const cid of activeIds) {
      seriesMap.set(cid, {
        amounts: new Array(labels.length).fill(0),
        taxes: new Array(labels.length).fill(0),
        counts: new Array(labels.length).fill(0),
        billableAmounts: new Array(labels.length).fill(0),
      });
    }

    for (const expense of expenses) {
      const cid = expense.categoryId ?? NO_CATEGORY.id;
      const s = seriesMap.get(cid);
      if (!s) continue;
      const idx = getBucketIndex(period, expense.date, start, end);
      if (idx >= 0 && idx < labels.length) {
        s.amounts[idx] = Math.round((s.amounts[idx] + expense.amount) * 100) / 100;
        s.taxes[idx] = Math.round((s.taxes[idx] + (expense.tax ?? 0)) * 100) / 100;
        s.counts[idx] += 1;
        if (expense.billable) {
          s.billableAmounts[idx] = Math.round((s.billableAmounts[idx] + expense.amount) * 100) / 100;
        }
      }
    }

    const projects = [];
    const series = [];

    for (const cid of activeIds) {
      const cat = cid === NO_CATEGORY.id ? NO_CATEGORY : categoryMap.get(cid);
      if (!cat) continue;
      const s = seriesMap.get(cid)!;
      const totalAmount = Math.round(s.amounts.reduce((a, b) => a + b, 0) * 100) / 100;
      const totalTax = Math.round(s.taxes.reduce((a, b) => a + b, 0) * 100) / 100;
      const totalCount = s.counts.reduce((a, b) => a + b, 0);
      const totalBillable = Math.round(s.billableAmounts.reduce((a, b) => a + b, 0) * 100) / 100;

      projects.push({ id: cat.id, name: cat.name, color: cat.color, amount: totalAmount, tax: totalTax, count: totalCount, billableAmount: totalBillable });
      series.push({ id: cat.id, name: cat.name, color: cat.color, currency: null, amounts: s.amounts, taxes: s.taxes, counts: s.counts, billableAmounts: s.billableAmounts });
    }

    return NextResponse.json({ period, groupBy, start: start.toISOString(), end: end.toISOString(), labels, projects, series });
  }

  // Get all projects the user is a member of
  const memberships = await prisma.projectMember.findMany({
    where: { userId: session.user.id },
    include: {
      project: {
        select: { id: true, name: true, color: true, currency: true },
      },
    },
  });

  const projectIds = memberships.map((m) => m.project.id);

  // Fetch all expenses in the period (user's own + from shared projects)
  const expenses = await prisma.expense.findMany({
    where: {
      date: { gte: start, lt: end },
      OR: [
        { userId: session.user.id },
        ...(projectIds.length > 0 ? [{ projectId: { in: projectIds } }] : []),
      ],
    },
    select: {
      amount: true,
      tax: true,
      billable: true,
      date: true,
      projectId: true,
    },
    orderBy: { date: "asc" },
  });

  const projectMap = new Map(memberships.map((m) => [m.project.id, m.project]));

  // "No project" virtual entry for unassigned expenses
  const NO_PROJECT = { id: "__none__", name: "No Project", color: "#9ca3af", currency: null as string | null };

  // Collect all project ids that appear in expenses (including null → __none__)
  const activeProjectIds = new Set<string>();
  for (const e of expenses) {
    activeProjectIds.add(e.projectId ?? NO_PROJECT.id);
  }

  // Build series and pie data for each active project
  const seriesMap = new Map<string, { amounts: number[]; taxes: number[]; counts: number[]; billableAmounts: number[] }>();
  for (const pid of activeProjectIds) {
    seriesMap.set(pid, {
      amounts: new Array(labels.length).fill(0),
      taxes: new Array(labels.length).fill(0),
      counts: new Array(labels.length).fill(0),
      billableAmounts: new Array(labels.length).fill(0),
    });
  }

  for (const expense of expenses) {
    const pid = expense.projectId ?? NO_PROJECT.id;
    const series = seriesMap.get(pid);
    if (!series) continue;
    const idx = getBucketIndex(period, expense.date, start, end);
    if (idx >= 0 && idx < labels.length) {
      series.amounts[idx] = Math.round((series.amounts[idx] + expense.amount) * 100) / 100;
      series.taxes[idx] = Math.round((series.taxes[idx] + (expense.tax ?? 0)) * 100) / 100;
      series.counts[idx] += 1;
      if (expense.billable) {
        series.billableAmounts[idx] = Math.round((series.billableAmounts[idx] + expense.amount) * 100) / 100;
      }
    }
  }

  const projects: { id: string; name: string; color: string; amount: number; tax: number; count: number; billableAmount: number }[] = [];
  const series: { id: string; name: string; color: string; currency: string | null; amounts: number[]; taxes: number[]; counts: number[]; billableAmounts: number[] }[] = [];

  for (const pid of activeProjectIds) {
    const proj = pid === NO_PROJECT.id ? NO_PROJECT : projectMap.get(pid);
    if (!proj) continue;
    const s = seriesMap.get(pid)!;
    const totalAmount = Math.round(s.amounts.reduce((a, b) => a + b, 0) * 100) / 100;
    const totalTax = Math.round(s.taxes.reduce((a, b) => a + b, 0) * 100) / 100;
    const totalCount = s.counts.reduce((a, b) => a + b, 0);
    const totalBillable = Math.round(s.billableAmounts.reduce((a, b) => a + b, 0) * 100) / 100;

    projects.push({
      id: proj.id,
      name: proj.name,
      color: proj.color,
      amount: totalAmount,
      tax: totalTax,
      count: totalCount,
      billableAmount: totalBillable,
    });

    series.push({
      id: proj.id,
      name: proj.name,
      color: proj.color,
      currency: "currency" in proj ? proj.currency : null,
      amounts: s.amounts,
      taxes: s.taxes,
      counts: s.counts,
      billableAmounts: s.billableAmounts,
    });
  }

  return NextResponse.json({
    period,
    groupBy: "project",
    start: start.toISOString(),
    end: end.toISOString(),
    labels,
    projects,
    series,
  });
}
