import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { ProjectRole } from "@/app/generated/prisma/client";

const VALID_ROLES: ProjectRole[] = ["ADMIN", "TRACKER", "READER"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, memberId } = await params;

  const requesterMembership = await prisma.projectMember.findFirst({
    where: { projectId: id, userId: session.user.id },
  });

  if (!requesterMembership) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (requesterMembership.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const targetMembership = await prisma.projectMember.findFirst({
    where: { id: memberId, projectId: id },
  });

  if (!targetMembership) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  // Prevent demoting yourself if you are the only admin
  if (targetMembership.userId === session.user.id) {
    const adminCount = await prisma.projectMember.count({
      where: { projectId: id, role: "ADMIN" },
    });
    if (adminCount <= 1) {
      return NextResponse.json(
        { error: "Cannot change role: you are the only admin of this project" },
        { status: 400 }
      );
    }
  }

  const body = await req.json();
  const { role } = body;

  if (!VALID_ROLES.includes(role)) {
    return NextResponse.json(
      { error: `Role must be one of: ${VALID_ROLES.join(", ")}` },
      { status: 400 }
    );
  }

  const updated = await prisma.projectMember.update({
    where: { id: memberId },
    data: { role },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, memberId } = await params;

  const targetMembership = await prisma.projectMember.findFirst({
    where: { id: memberId, projectId: id },
  });

  if (!targetMembership) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  const isSelf = targetMembership.userId === session.user.id;

  const requesterMembership = await prisma.projectMember.findFirst({
    where: { projectId: id, userId: session.user.id },
  });

  if (!requesterMembership) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const isAdmin = requesterMembership.role === "ADMIN";

  // Users can remove themselves (leave project), admins can remove anyone
  if (!isAdmin && !isSelf) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Prevent the last admin from leaving
  if (targetMembership.role === "ADMIN") {
    const adminCount = await prisma.projectMember.count({
      where: { projectId: id, role: "ADMIN" },
    });
    if (adminCount <= 1) {
      return NextResponse.json(
        {
          error:
            "Cannot remove the last admin. Transfer admin role to another member first.",
        },
        { status: 400 }
      );
    }
  }

  await prisma.projectMember.delete({ where: { id: memberId } });

  return new NextResponse(null, { status: 204 });
}
