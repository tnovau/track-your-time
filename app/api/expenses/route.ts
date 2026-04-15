import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { Prisma } from "@/app/generated/prisma/client";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const projectFilter = searchParams.get("projectId");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  const where: Prisma.ExpenseWhereInput = {};

  if (projectFilter === "none") {
    where.projectId = null;
  } else if (projectFilter) {
    // For shared projects, show all members' expenses
    const membership = await prisma.projectMember.findFirst({
      where: { projectId: projectFilter, userId: session.user.id },
    });
    if (membership) {
      where.projectId = projectFilter;
    } else {
      where.projectId = projectFilter;
      where.userId = session.user.id;
    }
  } else {
    where.userId = session.user.id;
  }

  if (dateFrom || dateTo) {
    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (dateFrom) dateFilter.gte = new Date(dateFrom);
    if (dateTo) dateFilter.lte = new Date(dateTo);
    where.date = dateFilter;
  }

  // If no project filter or filtering by "none", scope to current user
  if (!projectFilter || projectFilter === "none") {
    where.userId = session.user.id;
  }

  const expenses = await prisma.expense.findMany({
    where,
    include: {
      project: { select: { id: true, name: true, color: true, currency: true } },
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { date: "desc" },
    take: 100,
  });

  return NextResponse.json(expenses);
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  if (!body.description || typeof body.description !== "string" || !body.description.trim()) {
    return NextResponse.json({ error: "Description is required" }, { status: 400 });
  }

  if (body.amount == null || isNaN(Number(body.amount)) || Number(body.amount) <= 0) {
    return NextResponse.json({ error: "Amount must be a positive number" }, { status: 400 });
  }

  if (!body.date || isNaN(new Date(body.date).getTime())) {
    return NextResponse.json({ error: "Valid date is required" }, { status: 400 });
  }

  if (body.tax !== undefined && body.tax !== null) {
    if (isNaN(Number(body.tax)) || Number(body.tax) < 0) {
      return NextResponse.json({ error: "Tax must be a non-negative number" }, { status: 400 });
    }
  }

  // If assigning to a project, verify membership with ADMIN or TRACKER role
  if (body.projectId) {
    const membership = await prisma.projectMember.findFirst({
      where: { projectId: body.projectId, userId: session.user.id },
    });
    if (!membership) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    if (membership.role === "READER") {
      return NextResponse.json({ error: "Readers cannot add expenses" }, { status: 403 });
    }
  }

  const expense = await prisma.expense.create({
    data: {
      description: body.description.trim(),
      amount: Number(body.amount),
      tax: body.tax != null ? Number(body.tax) : null,
      date: new Date(body.date),
      userId: session.user.id,
      projectId: body.projectId ?? null,
      fileUrl: body.fileUrl ?? null,
      fileKey: body.fileKey ?? null,
      fileName: body.fileName ?? null,
    },
    include: {
      project: { select: { id: true, name: true, color: true, currency: true } },
      user: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json(expense, { status: 201 });
}
