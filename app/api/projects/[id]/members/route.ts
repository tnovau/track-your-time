import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { ProjectRole } from "@/app/generated/prisma/client";

const VALID_ROLES: ProjectRole[] = ["ADMIN", "TRACKER", "READER"];

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const requesterMembership = await prisma.projectMember.findFirst({
    where: { projectId: id, userId: session.user.id },
  });

  if (!requesterMembership) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const members = await prisma.projectMember.findMany({
    where: { projectId: id },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(members);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const requesterMembership = await prisma.projectMember.findFirst({
    where: { projectId: id, userId: session.user.id },
  });

  if (!requesterMembership) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (requesterMembership.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { email, role } = body;

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const roleToAssign: ProjectRole = VALID_ROLES.includes(role) ? role : "READER";

  const invitedUser = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  if (!invitedUser) {
    return NextResponse.json(
      { error: "No user found with that email address" },
      { status: 404 }
    );
  }

  if (invitedUser.id === session.user.id) {
    return NextResponse.json(
      { error: "You are already a member of this project" },
      { status: 400 }
    );
  }

  const existing = await prisma.projectMember.findFirst({
    where: { projectId: id, userId: invitedUser.id },
  });

  if (existing) {
    return NextResponse.json(
      { error: "User is already a member of this project" },
      { status: 409 }
    );
  }

  const member = await prisma.projectMember.create({
    data: {
      projectId: id,
      userId: invitedUser.id,
      role: roleToAssign,
    },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
  });

  return NextResponse.json(member, { status: 201 });
}
