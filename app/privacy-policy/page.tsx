import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Learn how Track Your Time collects, uses, and protects your personal data.",
  robots: { index: true, follow: true },
};

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-foreground">
      <Link
        href="/"
        className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
      >
        ← Back to home
      </Link>

      <h1 className="mt-6 text-4xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        Last updated: April 2025
      </p>

      <div className="mt-10 space-y-8 text-gray-700 dark:text-gray-300 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-foreground">1. Introduction</h2>
          <p className="mt-3">
            Welcome to <strong>Track Your Time</strong> (&ldquo;we&rdquo;,
            &ldquo;our&rdquo;, &ldquo;us&rdquo;). We are committed to protecting
            your personal data and respecting your privacy. This Privacy Policy
            explains what information we collect, why we collect it, and how we
            use it in accordance with the General Data Protection Regulation
            (GDPR) and other applicable data-protection laws.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">2. What Data We Collect</h2>
          <ul className="mt-3 list-disc pl-6 space-y-2">
            <li>
              <strong>Account information</strong> – name, email address, and
              profile picture provided by your OAuth provider (Google or GitHub)
              when you sign in.
            </li>
            <li>
              <strong>Usage data</strong> – time entries, project names, and
              other content you create while using the service.
            </li>
            <li>
              <strong>Technical data</strong> – IP address, browser type,
              operating system, and pages visited, collected automatically for
              analytics and security purposes.
            </li>
            <li>
              <strong>Cookies</strong> – small text files placed on your device
              to keep you signed in and to analyse how the site is used (see
              Section 5 for details).
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">3. How We Use Your Data</h2>
          <ul className="mt-3 list-disc pl-6 space-y-2">
            <li>To provide, operate, and improve the service.</li>
            <li>To authenticate you and keep your account secure.</li>
            <li>To analyse usage patterns and improve performance.</li>
            <li>To comply with legal obligations.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">4. Legal Basis for Processing</h2>
          <p className="mt-3">
            We process your data on the following legal bases under GDPR:
          </p>
          <ul className="mt-3 list-disc pl-6 space-y-2">
            <li>
              <strong>Contract</strong> – processing is necessary to provide the
              service you have signed up for.
            </li>
            <li>
              <strong>Consent</strong> – for non-essential cookies and analytics
              (you can withdraw consent at any time via the cookie banner).
            </li>
            <li>
              <strong>Legitimate interests</strong> – for security monitoring and
              fraud prevention.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">5. Cookies</h2>
          <p className="mt-3">
            We use the following types of cookies:
          </p>
          <ul className="mt-3 list-disc pl-6 space-y-2">
            <li>
              <strong>Strictly necessary cookies</strong> – required for
              authentication and core functionality. These cannot be disabled.
            </li>
            <li>
              <strong>Analytics cookies</strong> – help us understand how
              visitors interact with the site (e.g. Vercel Analytics). These are
              only set if you click &ldquo;Accept All&rdquo; in the cookie
              banner.
            </li>
          </ul>
          <p className="mt-3">
            You can change your cookie preferences at any time by clearing your
            browser&apos;s local storage for this site or by using the banner
            that appears on your first visit.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">6. Data Retention</h2>
          <p className="mt-3">
            We retain your data for as long as your account is active or as
            needed to provide the service. You may request deletion of your
            account and all associated data at any time by contacting us.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">7. Your Rights</h2>
          <p className="mt-3">
            Under GDPR you have the right to:
          </p>
          <ul className="mt-3 list-disc pl-6 space-y-2">
            <li>Access the personal data we hold about you.</li>
            <li>Request correction of inaccurate data.</li>
            <li>Request erasure of your data (&ldquo;right to be forgotten&rdquo;).</li>
            <li>Object to or restrict processing of your data.</li>
            <li>Data portability – receive your data in a machine-readable format.</li>
            <li>Withdraw consent at any time without affecting prior processing.</li>
          </ul>
          <p className="mt-3">
            To exercise any of these rights please contact us at the email
            address listed below.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">8. Third-Party Services</h2>
          <p className="mt-3">
            We use the following third-party services that may process your data:
          </p>
          <ul className="mt-3 list-disc pl-6 space-y-2">
            <li>
              <strong>Google OAuth / GitHub OAuth</strong> – for authentication.
              Their respective privacy policies apply.
            </li>
            <li>
              <strong>Vercel</strong> – our hosting provider. See{" "}
              <a
                href="https://vercel.com/legal/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                Vercel&apos;s Privacy Policy
              </a>
              .
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">9. Changes to This Policy</h2>
          <p className="mt-3">
            We may update this Privacy Policy from time to time. We will notify
            you of significant changes by posting a notice on the site. Your
            continued use of the service after changes are posted constitutes
            your acceptance of the revised policy.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">10. Contact Us</h2>
          <p className="mt-3">
            If you have any questions about this Privacy Policy or wish to
            exercise your data rights, please open an issue in the{" "}
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
