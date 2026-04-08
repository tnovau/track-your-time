import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import SignOutButton from "@/components/sign-out-button";
import DashboardNav from "@/components/dashboard-nav";
import ProjectAnalyticsView from "@/components/project-analytics-view";
import Link from "next/link";

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
    <div className="min-h-screen bg-background">
      <header className="border-b border-gray-200 dark:border-gray-800">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <h1 className="text-xl font-semibold">Track Your Time</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {session.user.name ?? session.user.email}
            </span>
            <SignOutButton />
          </div>
        </div>
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pb-2">
          <DashboardNav />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 space-y-4">
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
      </main>
    </div>
  );
}
