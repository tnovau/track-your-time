import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Read the Terms of Service for Track Your Time.",
  robots: { index: true, follow: true },
};

export default function TermsOfServicePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-foreground">
      <Link
        href="/"
        className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
      >
        ← Back to home
      </Link>

      <h1 className="mt-6 text-4xl font-bold tracking-tight">Terms of Service</h1>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        Last updated: April 2025
      </p>

      <div className="mt-10 space-y-8 text-gray-700 dark:text-gray-300 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-foreground">1. Acceptance of Terms</h2>
          <p className="mt-3">
            By accessing or using <strong>Track Your Time</strong> (&ldquo;the
            Service&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;),
            you agree to be bound by these Terms of Service (&ldquo;Terms&rdquo;).
            If you do not agree to these Terms, please do not use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">2. Description of Service</h2>
          <p className="mt-3">
            Track Your Time is a time-tracking web application that allows you to
            log work sessions, manage projects, and analyse how you spend your
            time. The Service is provided free of charge and is subject to change
            at any time without notice.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">3. User Accounts</h2>
          <ul className="mt-3 list-disc pl-6 space-y-2">
            <li>
              You must sign in via a supported OAuth provider (Google or GitHub)
              to use the Service.
            </li>
            <li>
              You are responsible for maintaining the confidentiality of your
              account credentials and for all activity that occurs under your
              account.
            </li>
            <li>
              You must notify us immediately of any unauthorised use of your
              account.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">4. Acceptable Use</h2>
          <p className="mt-3">You agree not to:</p>
          <ul className="mt-3 list-disc pl-6 space-y-2">
            <li>Use the Service for any unlawful purpose or in violation of any regulations.</li>
            <li>Attempt to gain unauthorised access to other users&apos; data.</li>
            <li>Reverse-engineer, decompile, or otherwise attempt to derive the source code of the Service.</li>
            <li>Introduce malware, viruses, or other harmful code.</li>
            <li>Use automated means (bots, scrapers, etc.) to access or interact with the Service without our written consent.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">5. Intellectual Property</h2>
          <p className="mt-3">
            The Service and its original content (excluding content you submit)
            are and will remain the exclusive property of Track Your Time and its
            contributors. The source code is available under the licence specified
            in the{" "}
            <a
              href="https://github.com/tnovau/track-your-time"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              GitHub repository
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">6. Your Content</h2>
          <p className="mt-3">
            You retain ownership of any data you create using the Service (time
            entries, project names, etc.). By using the Service you grant us a
            limited licence to store and process that data solely for the purpose
            of providing the Service to you.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">7. Privacy</h2>
          <p className="mt-3">
            Your use of the Service is also governed by our{" "}
            <Link
              href="/privacy-policy"
              className="underline hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              Privacy Policy
            </Link>
            , which is incorporated into these Terms by reference.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">8. Disclaimers</h2>
          <p className="mt-3">
            The Service is provided &ldquo;as is&rdquo; and &ldquo;as
            available&rdquo; without warranties of any kind, either express or
            implied, including but not limited to implied warranties of
            merchantability, fitness for a particular purpose, or
            non-infringement. We do not warrant that the Service will be
            uninterrupted, error-free, or completely secure.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">9. Limitation of Liability</h2>
          <p className="mt-3">
            To the fullest extent permitted by law, Track Your Time shall not be
            liable for any indirect, incidental, special, consequential, or
            punitive damages, or any loss of data, revenue, or profits, arising
            out of or in connection with your use of the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">10. Termination</h2>
          <p className="mt-3">
            We reserve the right to suspend or terminate your access to the
            Service at any time, with or without cause or notice. You may delete
            your account at any time by contacting us.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">11. Changes to These Terms</h2>
          <p className="mt-3">
            We may revise these Terms at any time. Changes will be effective when
            posted. Your continued use of the Service after changes are posted
            constitutes your acceptance of the revised Terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">12. Governing Law</h2>
          <p className="mt-3">
            These Terms are governed by and construed in accordance with
            applicable law. Any disputes arising from these Terms or the Service
            shall be resolved through good-faith negotiation or, where required,
            through the competent courts.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">13. Contact</h2>
          <p className="mt-3">
            If you have any questions about these Terms, please open an issue in
            the{" "}
            <a
              href="https://github.com/tnovau/track-your-time"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              GitHub repository
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
