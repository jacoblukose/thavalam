import { Link } from "wouter";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Terms() {
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
              <h1 className="rg-title text-2xl font-bold sm:text-3xl">Terms of Service</h1>
              <p className="mt-2 text-sm text-muted-foreground">Last updated: March 22, 2026</p>

              <div className="mt-8 space-y-6 text-sm leading-relaxed text-foreground/90">
                <section>
                  <h2 className="text-base font-semibold text-foreground">1. Acceptance</h2>
                  <p className="mt-2">By using Pocket Garage ("the Service"), you agree to these terms. If you do not agree, please do not use the Service.</p>
                </section>

                <section>
                  <h2 className="text-base font-semibold text-foreground">2. Description of Service</h2>
                  <p className="mt-2">Pocket Garage is a vehicle management tool that lets you track service history, fuel logs, modifications, and documents. The Service is provided free of charge.</p>
                </section>

                <section>
                  <h2 className="text-base font-semibold text-foreground">3. Account</h2>
                  <p className="mt-2">You sign in using your Google account. You are responsible for maintaining the security of your Google account. You must not share your session or allow unauthorized access to your account.</p>
                </section>

                <section>
                  <h2 className="text-base font-semibold text-foreground">4. Acceptable use</h2>
                  <p className="mt-2">You agree not to:</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    <li>Use the Service for any unlawful purpose.</li>
                    <li>Upload malicious files or content.</li>
                    <li>Attempt to access other users' data without authorization.</li>
                    <li>Abuse the Service in a way that degrades performance for others.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-base font-semibold text-foreground">5. Your data</h2>
                  <p className="mt-2">You retain ownership of all data you enter into Pocket Garage. We do not claim any rights over your content. See our <Link href="/privacy" className="text-primary underline underline-offset-2">Privacy Policy</Link> for details on how we handle your data.</p>
                </section>

                <section>
                  <h2 className="text-base font-semibold text-foreground">6. Availability</h2>
                  <p className="mt-2">We aim to keep Pocket Garage available at all times, but we do not guarantee uninterrupted service. The Service may be temporarily unavailable for maintenance, updates, or due to circumstances beyond our control.</p>
                </section>

                <section>
                  <h2 className="text-base font-semibold text-foreground">7. Limitation of liability</h2>
                  <p className="mt-2">Pocket Garage is provided "as is" without warranties of any kind, express or implied. We are not liable for any data loss, damages, or issues arising from the use of the Service. You are responsible for maintaining your own backups of important vehicle information.</p>
                </section>

                <section>
                  <h2 className="text-base font-semibold text-foreground">8. Termination</h2>
                  <p className="mt-2">You may delete your account at any time from the profile page. We reserve the right to suspend or terminate accounts that violate these terms.</p>
                </section>

                <section>
                  <h2 className="text-base font-semibold text-foreground">9. Changes to these terms</h2>
                  <p className="mt-2">We may update these terms from time to time. Continued use of the Service after changes constitutes acceptance of the updated terms.</p>
                </section>

                <section>
                  <h2 className="text-base font-semibold text-foreground">10. Contact</h2>
                  <p className="mt-2">For questions about these terms, contact us at <a href="mailto:support@pocketgarage.club" className="text-primary underline underline-offset-2">support@pocketgarage.club</a>.</p>
                </section>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
