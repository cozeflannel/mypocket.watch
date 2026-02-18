import { Metadata } from 'next';
import { Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service - MyPocketWatch',
  description: 'MyPocketWatch Terms of Service - Terms and conditions for using our platform.',
};

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-6 py-4">
          <Clock className="h-6 w-6 text-blue-600" />
          <span className="text-lg font-bold text-gray-900">My Pocket Watch</span>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
          <p className="mt-2 text-sm text-gray-500">Last updated: February 18, 2026</p>

          <div className="mt-8 space-y-8 text-sm text-gray-700">
            <section>
              <h2 className="text-lg font-semibold text-gray-900">1. Acceptance of Terms</h2>
              <p className="mt-2">
                By accessing and using MyPocketWatch (&quot;the Service&quot;), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by these terms, please do not use this Service.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900">2. Description of Service</h2>
              <p className="mt-2">
                MyPocketWatch is a multi-tenant SaaS platform that provides time tracking, workforce management, scheduling, and payroll services for businesses. The Service includes web-based time clocks, schedule management, worker communication tools, and reporting features.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900">3. User Accounts and Registration</h2>
              <p className="mt-2">To use the Service, you must create an account. You agree to:</p>
              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>Provide accurate and complete registration information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Promptly update any changes to your information</li>
                <li>Accept responsibility for all activities that occur under your account</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900">4. Employer Responsibilities</h2>
              <p className="mt-2">As an employer using the Service, you agree to:</p>
              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>Comply with all applicable labor laws and regulations</li>
                <li>Obtain necessary consents from workers for time tracking</li>
                <li>Accurately classify workers under applicable employment laws</li>
                <li>Ensure fair compensation practices including overtime calculations</li>
                <li>Maintain appropriate records as required by law</li>
                <li>Use the Service only for lawful business purposes</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900">5. Worker Data and Privacy</h2>
              <p className="mt-2">
                You acknowledge that the Service involves processing personal data of your workers, including but not limited to names, phone numbers, location data, and time records. You are responsible for:
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>Obtaining necessary consents from workers</li>
                <li>Complying with applicable data protection laws (e.g., GDPR, CCPA)</li>
                <li>Providing workers with required privacy notices</li>
                <li>Allowing workers to access, correct, or delete their data</li>
              </ul>
              <p className="mt-3">
                Our processing of worker data is governed by our <a href="/privacy" className="text-blue-600 underline">Privacy Policy</a>.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900">6. Subscription and Payment</h2>
              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>Subscription fees are billed in advance on a monthly or annual basis</li>
                <li>All fees are non-refundable unless otherwise stated</li>
                <li>You may cancel your subscription at any time</li>
                <li>We reserve the right to modify subscription fees with 30 days notice</li>
                <li>All payments are processed through secure third-party providers</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900">7. Acceptable Use</h2>
              <p className="mt-2">You agree not to use the Service to:</p>
              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe upon the rights of others</li>
                <li>Upload or transmit viruses or malicious code</li>
                <li>Interfere with the operation of the Service</li>
                <li>Attempt to gain unauthorized access to the Service</li>
                <li>Use the Service for any illegal or unethical purpose</li>
                <li>Harass, abuse, or harm others</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900">8. Intellectual Property</h2>
              <p className="mt-2">
                The Service and all content, features, and functionality are owned by MyPocketWatch and are protected by copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute, sell, or lease any part of the Service without our prior written consent.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900">9. Disclaimer of Warranties</h2>
              <p className="mt-2">
                THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR COMPLETELY SECURE.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900">10. Limitation of Liability</h2>
              <p className="mt-2">
                IN NO EVENT SHALL MyPocketWatch BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM YOUR USE OF THE SERVICE. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID FOR THE SERVICE IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900">11. Indemnification</h2>
              <p className="mt-2">
                You agree to indemnify, defend, and hold harmless MyPocketWatch and its officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, or expenses (including reasonable attorneys&apos; fees) arising out of or relating to your use of the Service, your violation of these Terms, or your violation of any rights of a third party.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900">12. Termination</h2>
              <p className="mt-2">
                We may terminate or suspend your account immediately, without prior notice or liability, for any reason, including breach of these Terms. Upon termination, your right to use the Service will immediately cease. You may also terminate your account at any time by contacting us.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900">13. Governing Law</h2>
              <p className="mt-2">
                These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, without regard to its conflict of law provisions. Any dispute arising from these Terms shall be subject to the exclusive jurisdiction of the state and federal courts located in Delaware.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900">14. Changes to Terms</h2>
              <p className="mt-2">
                We reserve the right to modify these Terms at any time. We will provide notice of material changes by posting the new Terms on this page and updating the &quot;Last updated&quot; date. Your continued use of the Service after such changes constitutes acceptance of the new Terms.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900">15. Third-Party Services</h2>
              <p className="mt-2">
                The Service may include third-party services, including but not limited to Twilio for SMS communications, Supabase for database services, and Vercel for hosting. We are not responsible for the privacy practices or content of these third-party services.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900">16. Communication Terms</h2>
              <p className="mt-2">
                By using the Service, you agree to receive communications from us via email, SMS, or through the platform. These communications may include service announcements, administrative messages, and promotional materials. You may opt out of promotional communications at any time.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900">17. Severability</h2>
              <p className="mt-2">
                If any provision of these Terms is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary so that these Terms shall otherwise remain in full force and effect.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900">18. Entire Agreement</h2>
              <p className="mt-2">
                These Terms constitute the entire agreement between you and MyPocketWatch regarding the Service and supersede all prior agreements, understandings, or arrangements, whether oral or written.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900">19. Contact Us</h2>
              <p className="mt-2">
                If you have any questions about these Terms, please contact us:
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li><strong>Email:</strong> support@mypocketwatch.com</li>
                <li><strong>Website:</strong> https://mypocketwatch.com</li>
              </ul>
            </section>
          </div>

          {/* Footer */}
          <div className="mt-12 border-t border-gray-200 pt-6">
            <p className="text-center text-xs text-gray-500">
              © 2026 MyPocketWatch. All rights reserved.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
