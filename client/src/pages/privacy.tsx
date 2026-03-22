import { Link } from "wouter";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Privacy() {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <div className="relative flex flex-1 flex-col overflow-hidden">
        <div className="pointer-events-none absolute inset-0 rg-grid opacity-40" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_circle_at_15%_0%,hsl(var(--primary)/0.20),transparent_60%),radial-gradient(900px_circle_at_85%_20%,hsl(var(--accent)/0.18),transparent_55%),radial-gradient(800px_circle_at_50%_90%,hsl(var(--foreground)/0.06),transparent_60%)]" />

        <header className="relative">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <Link href="/">
              <div className="flex items-center gap-3 cursor-pointer">
                <div className="grid size-11 place-items-center rounded-2xl border border-border/80 bg-card/60 shadow-sm backdrop-blur">
                  <Logo className="size-6 text-primary" />
                </div>
                <div className="leading-tight">
                  <div className="rg-title text-base font-semibold">Pocket Garage</div>
                </div>
              </div>
            </Link>
            <ThemeToggle />
          </div>
        </header>

        <main className="relative flex-1 px-4 pb-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <Link href="/">
              <Button variant="ghost" className="mb-4 gap-1.5 rounded-xl px-2 text-muted-foreground hover:text-foreground">
                <ChevronLeft className="size-4" />
                Back
              </Button>
            </Link>

            <div className="rg-noise rounded-[28px] border border-border/70 bg-card/40 p-6 shadow-md backdrop-blur md:p-10">
              <h1 className="rg-title text-2xl font-bold sm:text-3xl">Privacy Policy</h1>
              <p className="mt-2 text-sm text-muted-foreground">Last updated: March 22, 2026</p>

              <div className="mt-8 space-y-6 text-sm leading-relaxed text-foreground/90">
                <section>
                  <h2 className="text-base font-semibold text-foreground">1. What we collect</h2>
                  <p className="mt-2">When you sign in with Google, we receive and store your <strong>name</strong>, <strong>email address</strong>, and <strong>profile picture</strong>. We also store data you enter in the app: vehicle details, service records, fuel logs, build notes, uploaded documents (insurance, PUC certificates), and your preferences (currency, timezone).</p>
                </section>

                <section>
                  <h2 className="text-base font-semibold text-foreground">2. Why we collect it</h2>
                  <p className="mt-2">Your data is used solely to provide and improve the Pocket Garage service — tracking your vehicles, services, documents, and fuel efficiency. We do not use your data for advertising, profiling, or any purpose unrelated to the app.</p>
                </section>

                <section>
                  <h2 className="text-base font-semibold text-foreground">3. Where we store it</h2>
                  <p className="mt-2">Application data is stored in a PostgreSQL database hosted by <strong>Supabase</strong>. Uploaded files (documents) are stored in Supabase Storage. The application server runs on <strong>Microsoft Azure App Service</strong> (Central India region).</p>
                </section>

                <section>
                  <h2 className="text-base font-semibold text-foreground">4. Third-party sharing</h2>
                  <p className="mt-2">We do <strong>not</strong> sell, rent, or share your personal data with any third parties. Your data is only shared with other users if you explicitly use the vehicle sharing feature.</p>
                </section>

                <section>
                  <h2 className="text-base font-semibold text-foreground">5. Cookies</h2>
                  <p className="mt-2">We use a single session cookie (<code className="rounded bg-muted px-1 py-0.5">connect.sid</code>) to keep you signed in. We do not use tracking cookies, analytics cookies, or third-party cookies.</p>
                </section>

                <section>
                  <h2 className="text-base font-semibold text-foreground">6. Data retention</h2>
                  <p className="mt-2">Your data is retained for as long as your account exists. If you delete your account, all associated data (vehicles, service records, fuel logs, documents, and notifications) is permanently deleted.</p>
                </section>

                <section>
                  <h2 className="text-base font-semibold text-foreground">7. Your rights</h2>
                  <p className="mt-2">You have the right to:</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    <li><strong>Export your data</strong> — download all your data as a JSON file from the profile page.</li>
                    <li><strong>Delete your account</strong> — permanently remove your account and all associated data from the profile page.</li>
                    <li><strong>Access your data</strong> — view all stored data within the app at any time.</li>
                  </ul>
                  <p className="mt-2">These rights apply under India's Digital Personal Data Protection Act (DPDPA) and the EU's General Data Protection Regulation (GDPR).</p>
                </section>

                <section>
                  <h2 className="text-base font-semibold text-foreground">8. Security</h2>
                  <p className="mt-2">All connections use HTTPS encryption. Authentication is handled via Google OAuth 2.0. Session data is stored server-side. We follow industry-standard practices to protect your data.</p>
                </section>

                <section>
                  <h2 className="text-base font-semibold text-foreground">9. Contact</h2>
                  <p className="mt-2">If you have questions about this privacy policy or your data, contact us at <a href="mailto:support@pocketgarage.club" className="text-primary underline underline-offset-2">support@pocketgarage.club</a>.</p>
                </section>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
