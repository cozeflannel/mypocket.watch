import { Metadata } from 'next';
import { Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy - MyPocketWatch',
  description: 'MyPocketWatch Privacy Policy - How we collect, use, and protect your data.',
};

export default function PrivacyPolicy() {
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
          <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
          <p className="mt-2 text-sm text-gray-500">Last updated: February 18, 2026</p>

          <div className="mt-8 space-y-8 text-sm text-gray-700">
            <section>
              <h2 className="text-lg font-semibold text-gray-900">1. Introduction</h2>
              <p className="mt-2">
                MyPocketWatch (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our time tracking and workforce management platform.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900">2. Information We Collect</h2>
              <p className="mt-2">We collect the following types of information:</p>
              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>
                  <strong>Account Information:</strong> Company name, administrator email, phone number, and business address when you create an account.
                </li>
                <li>
                  <strong>Worker Information:</strong> Worker names, phone numbers, email addresses, job positions, hire dates, hourly rates, and scheduling preferences.
                </li>
                <li>
                  <strong>Time Tracking Data:</strong> Clock in/out times, location data (if enabled), break durations, and time entry notes.
                </li>
                <li>
                  <strong>Communication Data:</strong> SMS messages, WhatsApp messages, and other communications sent through our platform.
                </li>
                <li>
                  <strong>Usage Data:</strong> How you interact with our platform, including page visits, features used, and device information.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900">3. How We Use Your Information</h2>
              <p className="mt-2">We use the information we collect to:</p>
              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>Provide and maintain our time tracking and workforce management services</li>
                <li>Process and track worker time entries and schedules</li>
                <li>Send scheduled reminders and notifications to workers</li>
                <li>Generate payroll reports and calculations</li>
                <li>Verify worker identity through phone verification</li>
                <li>Communicate with you about your account and provide customer support</li>
                <li>Improve our services and develop new features</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900">4. Information Sharing & Disclosure</h2>
              <p className="mt-2">We may share your information with:</p>
              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>
                  <strong>Service Providers:</strong> Third-party vendors who help us operate our platform, including cloud hosting (Supabase), SMS delivery (Twilio), and email services.
                </li>
                <li>
                  <strong>Business Transfers:</strong> If we undergo a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.
                </li>
                <li>
                  <strong>Legal Requirements:</strong> When required by law, regulation, or legal process, or to protect our rights, safety, or property.
                </li>
              </ul>
              <p className="mt-3">
                <strong>We do not sell your personal information to third parties.</strong>
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900">5. Data Security</h2>
              <p className="mt-2">
                We implement appropriate technical and organizational security measures to protect your information against unauthorized access, alteration, disclosure, or destruction. These measures include:
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>Encryption of data in transit and at rest</li>
                <li>Secure authentication and authorization controls</li>
                <li>Regular security audits and vulnerability testing</li>
                <li>Access controls limiting employee access to personal information</li>
                <li>Employee training on data protection and privacy</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900">6. Data Retention</h2>
              <p className="mt-2">
                We retain your information for as long as your account is active or as needed to provide you services. We will retain and use your information as necessary to:
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>Comply with our legal obligations</li>
                <li>Resolve disputes</li>
                <li>Enforce our agreements</li>
              </ul>
              <p className="mt-3">
                After account deletion, we may retain certain information in anonymized form for analytics purposes.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900">7. Your Rights</h2>
              <p className="mt-2">You have the following rights regarding your personal information:</p>
              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
                <li><strong>Correction:</strong> Request correction of inaccurate personal information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal information, subject to legal retention requirements</li>
                <li><strong>Data Portability:</strong> Request a copy of your data in a structured, machine-readable format</li>
                <li><strong>Opt-Out:</strong> Opt-out of certain data uses, including marketing communications</li>
              </ul>
              <p className="mt-3">
                To exercise these rights, please contact us at support@mypocketwatch.com.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900">8. Third-Party Services</h2>
              <p className="mt-2">
                Our platform uses third-party services that may have access to your information:
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>
                  <strong>Supabase</strong> - Cloud database and authentication services
                </li>
                <li>
                  <strong>Twilio</strong> - SMS, voice, and messaging services for worker communications
                </li>
                <li>
                  <strong>Vercel</strong> - Platform hosting and deployment
                </li>
              </ul>
              <p className="mt-3">
                These providers have their own privacy policies governing their use of your information.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900">9. Children's Privacy</h2>
              <p className="mt-2">
                Our services are not intended for use by individuals under the age of 16. We do not knowingly collect personal information from children under 16. If you become aware that a child has provided us with personal information, please contact us.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900">10. Changes to This Policy</h2>
              <p className="mt-2">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date. We encourage you to review this Privacy Policy periodically for any changes.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900">11. Contact Us</h2>
              <p className="mt-2">
                If you have any questions about this Privacy Policy or our data practices, please contact us:
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
