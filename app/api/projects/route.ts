import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const memberships = await prisma.projectMember.findMany({
    where: { userId: session.user.id },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          description: true,
          color: true,
          currency: true,
          hourlyRate: true,
          userId: true,
          createdAt: true,
        },
      },
    },
    orderBy: { project: { createdAt: "desc" } },
  });

  const projects = memberships.map((m) => ({
    ...m.project,
    role: m.role,
  }));

  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const project = await prisma.project.create({
    data: {
      name: body.name,
      description: body.description ?? null,
      color: body.color ?? "#6366f1",
      currency: body.currency ?? null,
      hourlyRate: body.hourlyRate != null ? Number(body.hourlyRate) : null,
      userId: session.user.id,
      members: {
        create: {
          userId: session.user.id,
          role: "ADMIN",
        },
      },
    },
  });

  return NextResponse.json(project, { status: 201 });
}

