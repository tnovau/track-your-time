import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Track Your Time – Simple & Powerful Time Tracking",
  description:
    "Log your work, manage projects, and gain insights into how you spend your time. Get started for free with Track Your Time.",
  openGraph: {
    title: "Track Your Time – Simple & Powerful Time Tracking",
    description:
      "Log your work, manage projects, and gain insights into how you spend your time. Get started for free.",
  },
  twitter: {
    title: "Track Your Time – Simple & Powerful Time Tracking",
    description:
      "Log your work, manage projects, and gain insights into how you spend your time. Get started for free.",
  },
};

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function FolderIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function ZapIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

const features = [
  {
    icon: ClockIcon,
    title: "One-Click Time Tracking",
    description:
      "Start and stop timers instantly. Add descriptions and assign entries to projects with zero friction.",
  },
  {
    icon: FolderIcon,
    title: "Project Management",
    description:
      "Organise your work into colour-coded projects. Keep everything categorised and easy to find.",
  },
  {
    icon: ChartIcon,
    title: "Powerful Analytics",
    description:
      "Visualise where your time goes with detailed charts and breakdowns across projects and date ranges.",
  },
  {
    icon: UsersIcon,
    title: "Team Collaboration",
    description:
      "Share projects with your team. Assign roles and track time together with admin, tracker, and reader permissions.",
  },
  {
    icon: ShieldIcon,
    title: "Secure & Private",
    description:
      "Your data stays yours. Built with modern authentication and secure-by-default architecture.",
  },
  {
    icon: ZapIcon,
    title: "Fast & Lightweight",
    description:
      "No bloat. A clean, focused interface that loads instantly and stays out of your way.",
  },
];

const steps = [
  {
    step: "1",
    title: "Create a project",
    description:
      "Set up colour-coded projects to categorise your work — client work, side projects, learning, anything.",
  },
  {
    step: "2",
    title: "Track your time",
    description:
      "Hit start when you begin working. Add a description, pick a project, and let the timer run.",
  },
  {
    step: "3",
    title: "Review your insights",
    description:
      "See exactly where your hours went. Filter by project, date range, and more to spot trends.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="border-b border-gray-200 dark:border-gray-800 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/icon.svg" alt="" width={28} height={28} />
            <span className="text-lg font-semibold">Track Your Time</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="hidden sm:inline-flex text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-foreground transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/sign-in"
              className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-indigo-400/10 dark:bg-indigo-400/5 rounded-full blur-3xl" />
        </div>
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-20 pb-24 sm:pt-28 sm:pb-32">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/50 px-4 py-1.5 text-sm text-indigo-700 dark:text-indigo-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
              </span>
              Free to use — no credit card required
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
              Know where your
              <span className="text-indigo-600 dark:text-indigo-400">
                {" "}
                time{" "}
              </span>
              actually goes
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
              A simple, powerful time tracking tool for individuals and teams.
              Log your work, manage projects, and gain actionable insights — all
              in one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
              <Link
                href="/sign-in"
                className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 hover:-translate-y-0.5"
              >
                Start Tracking for Free
                <svg
                  className="ml-2 w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center justify-center rounded-xl border border-gray-300 dark:border-gray-700 px-8 py-3.5 text-base font-semibold hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
              >
                See How It Works
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "100%", label: "Free" },
              { value: "< 1s", label: "Load time" },
              { value: "∞", label: "Projects" },
              { value: "Open", label: "Source" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl sm:text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="max-w-2xl mx-auto text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Everything you need to manage your time
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              No complex setup. No steep learning curve. Just the tools you need
              to understand and improve how you work.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-2xl border border-gray-200 dark:border-gray-800 p-8 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-lg hover:shadow-indigo-50 dark:hover:shadow-indigo-950/20 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center mb-5 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900/50 transition-colors">
                  <feature.icon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gray-50/50 dark:bg-gray-900/50 border-y border-gray-200 dark:border-gray-800">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="max-w-2xl mx-auto text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Up and running in minutes
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Three simple steps to take control of your time.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((item) => (
              <div key={item.step} className="relative text-center space-y-4">
                <div className="mx-auto w-14 h-14 rounded-full bg-indigo-600 text-white text-xl font-bold flex items-center justify-center shadow-lg shadow-indigo-600/25">
                  {item.step}
                </div>
                <h3 className="font-semibold text-xl">{item.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed max-w-xs mx-auto">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits / Checklist */}
      <section>
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Built for people who value their time
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                Whether you&apos;re a freelancer tracking billable hours, a team
                lead managing resources, or someone who just wants to be more
                intentional — Track Your Time adapts to your workflow.
              </p>
            </div>
            <div className="space-y-4">
              {[
                "No credit card required to start",
                "Works on desktop and mobile",
                "Dark mode built in",
                "Share projects with team members",
                "Export-ready time logs",
                "Detailed analytics and charts",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <CheckIcon className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section>
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-24 sm:pb-32">
          <div className="relative rounded-3xl bg-indigo-600 dark:bg-indigo-700 px-8 py-16 sm:px-16 sm:py-20 text-center overflow-hidden">
            <div className="absolute inset-0 -z-0">
              <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500 rounded-full blur-3xl opacity-50" />
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-800 rounded-full blur-3xl opacity-50" />
            </div>
            <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                Ready to take control of your time?
              </h2>
              <p className="text-lg text-indigo-100">
                Join Track Your Time today. Free forever for individuals — no
                strings attached.
              </p>
              <Link
                href="/sign-in"
                className="inline-flex items-center justify-center rounded-xl bg-white text-indigo-600 px-8 py-3.5 text-base font-semibold hover:bg-indigo-50 transition-all shadow-lg hover:-translate-y-0.5"
              >
                Get Started Free
                <svg
                  className="ml-2 w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <Image src="/icon.svg" alt="" width={24} height={24} />
              <span className="text-sm font-semibold">Track Your Time</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
              <Link
                href="/privacy-policy"
                className="hover:text-foreground transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms-of-service"
                className="hover:text-foreground transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                href="/sign-in"
                className="hover:text-foreground transition-colors"
              >
                Sign In
              </Link>
              <a
                href="https://github.com/tnovau/track-your-time"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
                aria-label="GitHub"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                </svg>
              </a>
            </div>
          </div>
          <div className="mt-8 text-center text-sm text-gray-400 dark:text-gray-600">
            © {new Date().getFullYear()} Track Your Time. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
