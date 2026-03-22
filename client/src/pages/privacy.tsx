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
                  <h2 className="text-base font-semibold text-foreground">1. Introduction</h2>
                  <p className="mt-2">This Privacy Policy ("Policy") describes how Pocket Garage ("We", "Us", "Our"), accessible at pocketgarage.club, collects, uses, stores, and protects your information. By accessing or using Pocket Garage, you agree to be bound by this Policy. If you do not agree, please do not use the Service.</p>
                </section>

                <section>
                  <h2 className="text-base font-semibold text-foreground">2. Eligibility</h2>
                  <p className="mt-2">You must be at least <strong>18 years of age</strong> to use this Service. By using Pocket Garage, you represent and warrant that you are 18 years or older and legally competent to enter into this agreement. We do not knowingly collect data from anyone under 18. If we become aware that a user is under 18, we will promptly delete their account and all associated data.</p>
                </section>

                <section>
                  <h2 className="text-base font-semibold text-foreground">3. What we collect</h2>
                  <p className="mt-2"><strong>Personal data you provide:</strong> When you sign in with Google, we receive and store your <strong>name</strong>, <strong>email address</strong>, and <strong>profile picture</strong>. We also store data you enter in the app: vehicle details, service records, fuel logs, build notes, uploaded documents (insurance, PUC certificates), and your preferences (currency, timezone).</p>
                  <p className="mt-2"><strong>Automatically collected data:</strong> When you use the Service, our servers may automatically log certain information, including your IP address, browser type, device type, operating system, and access timestamps. This data is collected for security, debugging, and service improvement purposes.</p>
                </section>

                <section>
                  <h2 className="text-base font-semibold text-foreground">4. Why we collect it</h2>
                  <p className="mt-2">Your data is used to:</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    <li>Provide and operate the Pocket Garage service — tracking your vehicles, services, documents, and fuel efficiency.</li>
                    <li>Authenticate your identity and maintain your session.</li>
                    <li>Improve, personalise, and develop the Service.</li>
                    <li>Communicate with you about your account or service updates.</li>
                    <li>Comply with legal obligations and enforce our terms.</li>
                  </ul>
                  <p className="mt-2">We may in the future use your data to deliver relevant advertisements, offer premium features, or integrate with third-party services. If and when such changes occur, this Policy will be updated accordingly, and any additional consent required will be obtained before such use.</p>
                </section>

                <section>
                  <h2 className="text-base font-semibold text-foreground">5. Where we store it</h2>
                  <p className="mt-2">Application data is stored in a PostgreSQL database hosted by <strong>Supabase</strong>. Uploaded files (documents) are stored in Supabase Storage. The application server runs on <strong>Microsoft Azure App Service</strong> (Central India region). Your data may be transferred to and processed in locations outside your jurisdiction where our service providers operate. We ensure appropriate safeguards are in place for any such transfers.</p>
                </section>

                <section>
                  <h2 className="text-base font-semibold text-foreground">6. Third-party sharing</h2>
                  <p className="mt-2">We do <strong>not</strong> sell or rent your personal data. Your data may be shared in the following limited circumstances:</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    <li><strong>With other users</strong> — only if you explicitly use the vehicle sharing feature.</li>
                    <li><strong>Service providers</strong> — with trusted third-party providers (e.g., hosting, authentication) who process data on our behalf and are bound by confidentiality obligations.</li>
                    <li><strong>Legal requirements</strong> — if required by law, regulation, court order, or governmental authority.</li>
                    <li><strong>Business transfers</strong> — in the event of a merger, acquisition, or sale of assets, your data may be transferred to the successor entity.</li>
                  </ul>
                  <p className="mt-2">We may in the future partner with third-party services for vehicle data, payments, or advertising. Any such sharing will be disclosed in an updated version of this Policy.</p>
                </section>

                <section>
                  <h2 className="text-base font-semibold text-foreground">7. Cookies</h2>
                  <p className="mt-2">We use a single session cookie (<code className="rounded bg-muted px-1 py-0.5">connect.sid</code>) to keep you signed in. We do not use tracking cookies, analytics cookies, or third-party cookies. If we introduce additional cookies in the future, this Policy will be updated and appropriate consent will be obtained.</p>
                </section>

                <section>
                  <h2 className="text-base font-semibold text-foreground">8. Consent and withdrawal</h2>
                  <p className="mt-2">By using Pocket Garage, you consent to the collection, use, and processing of your data as described in this Policy. You may <strong>withdraw your consent</strong> at any time by deleting your account from the profile page or by contacting us at <a href="mailto:support@pocketgarage.club" className="text-primary underline underline-offset-2">support@pocketgarage.club</a>. Withdrawal of consent is not retroactive and does not affect the lawfulness of processing carried out before the withdrawal.</p>
                </section>

                <section>
                  <h2 className="text-base font-semibold text-foreground">9. Data retention</h2>
                  <p className="mt-2">Your data is retained for as long as your account exists or as required by applicable law. If you delete your account or withdraw consent, all associated data (vehicles, service records, fuel logs, documents, and notifications) is permanently deleted, unless retention is required by law.</p>
                </section>

                <section>
                  <h2 className="text-base font-semibold text-foreground">10. Your rights</h2>
                  <p className="mt-2">Under India's Digital Personal Data Protection Act (DPDPA) and other applicable privacy laws, you have the right to:</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    <li><strong>Access your data</strong> — view all stored data within the app at any time.</li>
                    <li><strong>Export your data</strong> — download all your data as a JSON file from the profile page.</li>
                    <li><strong>Correct your data</strong> — request correction of inaccurate or incomplete data.</li>
                    <li><strong>Delete your account</strong> — permanently remove your account and all associated data from the profile page.</li>
                    <li><strong>Withdraw consent</strong> — withdraw your consent for data processing at any time.</li>
                    <li><strong>Grievance redressal</strong> — raise a complaint with our Grievance Officer (see below).</li>
                    <li><strong>Nominate</strong> — in the event of death or incapacity, nominate another person to exercise your rights.</li>
                  </ul>
                  <p className="mt-2">To exercise any of these rights, contact us at <a href="mailto:support@pocketgarage.club" className="text-primary underline underline-offset-2">support@pocketgarage.club</a>.</p>
                </section>

                <section>
                  <h2 className="text-base font-semibold text-foreground">11. Security</h2>
                  <p className="mt-2">All connections use HTTPS encryption. Authentication is handled via Google OAuth 2.0. Session data is stored server-side. We adopt appropriate technical, administrative, and organisational measures to protect your data against unauthorised access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.</p>
                </section>

                <section>
                  <h2 className="text-base font-semibold text-foreground">12. Changes to this policy</h2>
                  <p className="mt-2">We may update this Policy from time to time. The updated version will be posted on this page with a revised "Last updated" date. Continued use of the Service after changes constitutes acceptance of the updated Policy. We encourage you to review this page periodically.</p>
                </section>

                <section>
                  <h2 className="text-base font-semibold text-foreground">13. Grievance redressal</h2>
                  <p className="mt-2">If you have any questions, concerns, or grievances about this Policy or the handling of your personal data, you may contact our Grievance Officer:</p>
                  <p className="mt-2"><strong>Grievance Officer, Pocket Garage</strong><br />Email: <a href="mailto:support@pocketgarage.club" className="text-primary underline underline-offset-2">support@pocketgarage.club</a></p>
                  <p className="mt-2">We shall endeavour to address your grievance within 30 days of receipt, or within such timelines as prescribed under applicable law.</p>
                </section>

                <section>
                  <h2 className="text-base font-semibold text-foreground">14. Governing law</h2>
                  <p className="mt-2">This Policy shall be governed by and construed in accordance with the laws of India. Any disputes arising under this Policy shall be subject to the exclusive jurisdiction of the courts in Kerala, India.</p>
                </section>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
