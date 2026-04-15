import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import AppSidebar from "@/components/app-sidebar";
import ProjectAnalyticsView from "@/components/project-analytics-view";
import ProjectExpenseAnalyticsView from "@/components/project-expense-analytics-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return { title: `Project Analytics — ${id}` };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const { id } = await params;

  // Verify access
  const membership = await prisma.projectMember.findFirst({
    where: { projectId: id, userId: session.user.id },
    include: { project: { select: { name: true } } },
  });

  if (!membership) {
    redirect("/projects");
  }

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950">
      <AppSidebar user={session.user} />
      <main className="lg:pl-64 pt-14 lg:pt-0">
        <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-5xl space-y-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Link
              href="/projects"
              className="hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              Projects
            </Link>
            <span>/</span>
            <span className="text-gray-700 dark:text-gray-200 font-medium">
              {membership.project.name}
            </span>
            <span>/</span>
            <span className="text-gray-700 dark:text-gray-200 font-medium">Analytics</span>
          </div>

          <ProjectAnalyticsView projectId={id} />
          <ProjectExpenseAnalyticsView projectId={id} />
        </div>
      </main>
    </div>
  );
}
