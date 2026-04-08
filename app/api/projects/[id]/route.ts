import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Fetch the project with the caller's membership in one query
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      members: {
        where: { userId: session.user.id },
        take: 1,
      },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const membership = project.members[0];
  if (!membership || membership.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();

  if (body.name !== undefined && typeof body.name === "string" && !body.name.trim()) {
    return NextResponse.json({ error: "Project name cannot be empty" }, { status: 400 });
  }

  if (body.color !== undefined && !/^#[0-9a-fA-F]{6}$/.test(body.color)) {
    return NextResponse.json({ error: "Invalid color format" }, { status: 400 });
  }

  const updated = await prisma.project.update({
    where: { id },
    data: {
      name: body.name !== undefined ? body.name.trim() : project.name,
      description:
        body.description !== undefined
          ? body.description?.trim() || null
          : project.description,
      color: body.color !== undefined ? body.color : project.color,
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

  // Only the project owner (original creator) can delete the project
  const project = await prisma.project.findUnique({ where: { id } });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (project.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.project.delete({ where: { id } });

  return new NextResponse(null, { status: 204 });
}


