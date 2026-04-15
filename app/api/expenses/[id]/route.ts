import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { utapi } from "@/lib/uploadthing";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const expense = await prisma.expense.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!expense) {
    return NextResponse.json({ error: "Expense not found" }, { status: 404 });
  }

  const body = await req.json();

  if (body.description !== undefined) {
    if (typeof body.description !== "string" || !body.description.trim()) {
      return NextResponse.json({ error: "Description cannot be empty" }, { status: 400 });
    }
  }

  if (body.amount !== undefined) {
    if (isNaN(Number(body.amount)) || Number(body.amount) <= 0) {
      return NextResponse.json({ error: "Amount must be a positive number" }, { status: 400 });
    }
  }

  if (body.date !== undefined) {
    if (isNaN(new Date(body.date).getTime())) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }
  }

  if (body.tax !== undefined && body.tax !== null) {
    if (isNaN(Number(body.tax)) || Number(body.tax) < 0) {
      return NextResponse.json({ error: "Tax must be a non-negative number" }, { status: 400 });
    }
  }

  // If changing project, verify membership
  if (body.projectId !== undefined && body.projectId !== null) {
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

  // Handle file field updates
  const fileData: { fileUrl?: string | null; fileKey?: string | null; fileName?: string | null } = {};
  if (body.fileUrl !== undefined) {
    // If replacing a file, delete the old one from Uploadthing
    if (expense.fileKey && body.fileKey !== expense.fileKey) {
      await utapi.deleteFiles(expense.fileKey).catch(() => {});
    }
    fileData.fileUrl = body.fileUrl;
    fileData.fileKey = body.fileKey ?? null;
    fileData.fileName = body.fileName ?? null;
  }

  const updated = await prisma.expense.update({
    where: { id },
    data: {
      description:
        body.description !== undefined ? body.description.trim() : expense.description,
      amount:
        body.amount !== undefined ? Number(body.amount) : expense.amount,
      date:
        body.date !== undefined ? new Date(body.date) : expense.date,
      tax:
        body.tax !== undefined ? (body.tax != null ? Number(body.tax) : null) : expense.tax,
      projectId:
        body.projectId !== undefined ? body.projectId : expense.projectId,
      ...fileData,
    },
    include: {
      project: { select: { id: true, name: true, color: true, currency: true } },
      user: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const expense = await prisma.expense.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!expense) {
    return NextResponse.json({ error: "Expense not found" }, { status: 404 });
  }

  // Delete file from Uploadthing if it exists
  if (expense.fileKey) {
    await utapi.deleteFiles(expense.fileKey).catch(() => {});
  }

  await prisma.expense.delete({ where: { id } });

  return new NextResponse(null, { status: 204 });
}
