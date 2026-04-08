import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import ProjectManager from "@/components/project-manager";
import SignOutButton from "@/components/sign-out-button";
import DashboardNav from "@/components/dashboard-nav";

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

      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        <ProjectManager />
      </main>
    </div>
  );
}
