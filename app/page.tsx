import type { Metadata } from "next";
import Link from "next/link";

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

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-8">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold tracking-tight">
            Track Your Time
          </h1>
          <p className="text-xl text-gray-500 dark:text-gray-400">
            A simple, powerful time tracking tool. Log your work, manage
            projects, and gain insights into how you spend your time.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/sign-in"
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-6 py-3 text-base font-semibold text-white hover:bg-indigo-500 transition-colors"
          >
            Get Started
          </Link>
          <Link
            href="/sign-in"
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 dark:border-gray-700 px-6 py-3 text-base font-semibold hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
          >
            Sign In
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8">
          {[
            {
              title: "Track Time",
              description:
                "Start and stop timers with one click. Add descriptions and assign entries to projects.",
            },
            {
              title: "Manage Projects",
              description:
                "Organise your work into colour-coded projects for easy categorisation.",
            },
            {
              title: "Gain Insights",
              description:
                "Review your time log and understand where your hours go.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-gray-200 dark:border-gray-800 p-6 text-left space-y-2"
            >
              <h3 className="font-semibold text-lg">{feature.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
