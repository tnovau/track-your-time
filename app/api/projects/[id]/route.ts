import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

async function getAdminMembership(projectId: string, userId: string) {
  return prisma.projectMember.findFirst({
    where: { projectId, userId, role: "ADMIN" },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const membership = await getAdminMembership(id, session.user.id);
  if (!membership) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const body = await req.json();

  if (body.name !== undefined && typeof body.name === "string" && !body.name.trim()) {
    return NextResponse.json({ error: "Project name cannot be empty" }, { status: 400 });
  }

  if (body.color !== undefined && !/^#[0-9a-fA-F]{6}$/.test(body.color)) {
    return NextResponse.json({ error: "Invalid color format" }, { status: 400 });
  }

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
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

  // Only the project owner (ADMIN who created the project) can delete it
  const project = await prisma.project.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  await prisma.project.delete({ where: { id } });

  return new NextResponse(null, { status: 204 });
}

