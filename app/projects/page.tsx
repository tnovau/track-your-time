import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import AppSidebar from "@/components/app-sidebar";
import ProjectManager from "@/components/project-manager";

export const metadata = {
  title: "Projects",
};

export default async function ProjectsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950">
      <AppSidebar user={session.user} />
      <main className="lg:pl-64 pt-14 lg:pt-0">
        <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-5xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Create and manage your projects
            </p>
          </div>
          <ProjectManager />
        </div>
      </main>
    </div>
  );
}
