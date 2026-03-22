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
                  <p className="mt-2">By accessing or using Pocket Garage ("the Service"), operated via pocketgarage.club, you ("You", "Your", "User") agree to be bound by these Terms of Service ("Terms"). If you do not agree, you must discontinue use of the Service immediately. These Terms constitute an electronic record under the Information Technology Act, 2000 and applicable rules thereunder.</p>
                </section>

                <section>
                  <h2 className="text-base font-semibold text-foreground">2. Eligibility</h2>
                  <p className="mt-2">You must be at least <strong>18 years of age</strong> and legally competent to enter into a binding agreement under applicable laws to use this Service. By using Pocket Garage, you represent and warrant that you meet these requirements and that all information you provide is true, complete, and accurate.</p>
                </section>

                <section>
                  <h2 className="text-base font-semibold text-foreground">3. Description of Service</h2>
                  <p className="mt-2">Pocket Garage is a vehicle management tool that lets you track service history, fuel logs, modifications, and documents. The Service is currently provided free of charge. We reserve the right to introduce paid features, subscriptions, or third-party integrations in the future, which will be subject to additional terms communicated at the time of introduction.</p>
                </section>

                <section>
                  <h2 className="text-base font-semibold text-foreground">4. Account</h2>
                  <p className="mt-2">You sign in using your Google account. You are responsible for maintaining the security of your Google account and for all activity that occurs under your account. You must not share your session or allow unauthorised access to your account. You must notify us immediately at <a href="mailto:support@pocketgarage.club" className="text-primary underline underline-offset-2">support@pocketgarage.club</a> if you suspect any unauthorised use of your account.</p>
                </section>

                <section>
                  <h2 className="text-base font-semibold text-foreground">5. Acceptable use</h2>
                  <p className="mt-2">You agree not to:</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    <li>Use the Service for any unlawful, illegal, or unauthorised purpose.</li>
                    <li>Upload malicious files, harmful content, or content that infringes the rights of others.</li>
                    <li>Attempt to access other users' data without authorisation.</li>
                    <li>Abuse the Service in a way that degrades performance for others.</li>
                    <li>Misrepresent your identity or impersonate another person.</li>
                    <li>Reverse engineer, decompile, disassemble, or otherwise attempt to derive the source code of the Service.</li>
                    <li>Use automated systems (bots, scrapers) to access the Service without prior written permission.</li>
                  </ul>
                  <p className="mt-2">We reserve the right to suspend or terminate access to the Service in case of violation of these Terms.</p>
                </section>

                <section>
                  <h2 className="text-base font-semibold text-foreground">6. Your data</h2>
                  <p className="mt-2">You retain ownership of all data you enter into Pocket Garage. We do not claim any rights over your content. You represent and warrant that any data or documents you upload are lawful, accurate, and do not infringe any third-party rights. See our <Link href="/privacy" className="text-primary underline underline-offset-2">Privacy Policy</Link> for details on how we handle your data.</p>
                </section>

                <section>
                  <h2 className="text-base font-semibold text-foreground">7. Intellectual property</h2>
                  <p className="mt-2">All intellectual property rights in the Service, including but not limited to the design, layout, software, branding, logos, graphics, and all other content (excluding user-generated data), are owned by or licensed to Pocket Garage. No right or licence is granted to you except for the limited, non-exclusive, non-transferable right to use the Service in accordance with these Terms. You shall not reproduce, distribute, modify, create derivative works from, or exploit any part of the Service without prior written permission.</p>
                </section>

                <section>
                  <h2 className="text-base font-semibold text-foreground">8. Third-party services</h2>
                  <p className="mt-2">The Service may contain links to or integrations with third-party websites or services (e.g., Google OAuth). We do not control and are not responsible for the content, policies, or practices of any third-party services. Your use of such services is at your own risk, and we encourage you to review their terms and policies before use.</p>
                </section>

                <section>
                  <h2 className="text-base font-semibold text-foreground">9. Availability</h2>
                  <p className="mt-2">We aim to keep Pocket Garage available at all times, but we do not guarantee uninterrupted or error-free service. The Service may be temporarily unavailable for maintenance, updates, or due to circumstances beyond our control. We shall not be liable for any loss or inconvenience caused by such downtime.</p>
                </section>

                <section>
                  <h2 className="text-base font-semibold text-foreground">10. Disclaimer of warranties</h2>
                  <p className="mt-2">Pocket Garage is provided on an "as is" and "as available" basis without warranties of any kind, express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, accuracy, or non-infringement. We do not warrant that the Service will meet your requirements or that any data stored in the Service will be accurate or reliable.</p>
                </section>

                <section>
                  <h2 className="text-base font-semibold text-foreground">11. Limitation of liability</h2>
                  <p className="mt-2">To the maximum extent permitted by applicable law, Pocket Garage and its operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of data, profits, revenue, or business arising from your use of or inability to use the Service. You are responsible for maintaining your own backups of important vehicle information.</p>
                </section>

                <section>
                  <h2 className="text-base font-semibold text-foreground">12. Indemnification</h2>
                  <p className="mt-2">You agree to indemnify, defend, and hold harmless Pocket Garage and its operators from and against any claims, liabilities, damages, losses, costs, or expenses (including reasonable legal fees) arising out of or related to your use of the Service, your violation of these Terms, your violation of any applicable law, or any content you upload to the Service.</p>
                </section>

                <section>
                  <h2 className="text-base font-semibold text-foreground">13. Termination</h2>
                  <p className="mt-2">You may delete your account at any time from the profile page. We reserve the right to suspend or terminate accounts that violate these Terms, without prior notice. Upon termination, your right to use the Service ceases immediately. Provisions that by their nature should survive termination (including intellectual property, limitation of liability, indemnification, and governing law) shall survive.</p>
                </section>

                <section>
                  <h2 className="text-base font-semibold text-foreground">14. Governing law and dispute resolution</h2>
                  <p className="mt-2">These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts in Kerala, India.</p>
                </section>

                <section>
                  <h2 className="text-base font-semibold text-foreground">15. Severability</h2>
                  <p className="mt-2">If any provision of these Terms is held to be invalid, illegal, or unenforceable by a court of competent jurisdiction, the remaining provisions shall continue in full force and effect. Failure by us to enforce any right or provision shall not constitute a waiver of that right or provision.</p>
                </section>

                <section>
                  <h2 className="text-base font-semibold text-foreground">16. Changes to these terms</h2>
                  <p className="mt-2">We reserve the right to modify these Terms at any time. The updated version will be posted on this page with a revised "Last updated" date. Continued use of the Service after changes constitutes acceptance of the updated Terms. We encourage you to review this page periodically.</p>
                </section>

                <section>
                  <h2 className="text-base font-semibold text-foreground">17. Contact</h2>
                  <p className="mt-2">For questions or grievances about these Terms, contact us at <a href="mailto:support@pocketgarage.club" className="text-primary underline underline-offset-2">support@pocketgarage.club</a>.</p>
                </section>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
