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

  const entry = await prisma.timeEntry.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!entry) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  const body = await req.json();

  const startTime = body.startTime ? new Date(body.startTime) : entry.startTime;

  let endTime: Date | null;
  if (body.endTime !== undefined) {
    endTime = body.endTime ? new Date(body.endTime) : null;
  } else {
    endTime = entry.endTime;
  }

  const duration =
    startTime && endTime
      ? Math.floor((endTime.getTime() - startTime.getTime()) / 1000)
      : null;

  const updated = await prisma.timeEntry.update({
    where: { id },
    data: {
      description:
        body.description !== undefined ? body.description : entry.description,
      projectId:
        body.projectId !== undefined ? body.projectId : entry.projectId,
      startTime,
      endTime,
      duration,
    },
    include: { project: { select: { id: true, name: true, color: true } } },
  });

  return NextResponse.json(updated);
}
