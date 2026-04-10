import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Image from "next/image";
import SignInButtons from "@/components/sign-in-buttons";
import Link from "next/link";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackURL?: string }>;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const params = await searchParams;
  const callbackURL = params.callbackURL;

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-background p-8 overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-400/10 dark:bg-indigo-400/5 rounded-full blur-3xl" />
      </div>
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-4">
          <Link href="/" className="inline-flex items-center gap-2 justify-center">
            <Image src="/icon.svg" alt="" width={32} height={32} />
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Sign in to your Track Your Time account
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-background/80 backdrop-blur-sm p-6 shadow-lg shadow-gray-200/50 dark:shadow-none">
          <SignInButtons callbackURL={callbackURL} />
        </div>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          By signing in, you agree to our <Link className="underline hover:text-gray-900 dark:hover:text-gray-100 transition-colors" href="/terms-of-service">Terms of Service</Link> and <Link className="underline hover:text-gray-900 dark:hover:text-gray-100 transition-colors" href="/privacy-policy">Privacy Policy</Link>.
        </p>
      </div>
    </main>
  );
}
