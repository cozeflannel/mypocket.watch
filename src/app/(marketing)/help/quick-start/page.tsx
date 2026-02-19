import { Metadata } from 'next';
import { Clock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Quick Start Guide - MyPocketWatch Help Center',
  description: 'Get started with MyPocketWatch in minutes.',
};

export default function QuickStartGuide() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-6 py-4">
          <Clock className="h-6 w-6 text-blue-600" />
          <span className="text-lg font-bold text-gray-900">My Pocket Watch</span>
          <span className="mx-2 text-gray-300">|</span>
          <Link href="/support" className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Back to Help Center
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <article className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900">Quick Start Guide</h1>
          <p className="mt-2 text-gray-600">Learn how to set up your account and start tracking time in minutes.</p>

          <div className="mt-8 space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-gray-900">1. Create Your Account</h2>
              <p className="mt-2 text-gray-600">
                Sign up for MyPocketWatch using your email address. You'll receive a confirmation email to verify your account.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">2. Set Up Your Company</h2>
              <p className="mt-2 text-gray-600">
                After logging in, you'll be prompted to create your company profile:
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-6 text-gray-600">
                <li>Company name</li>
                <li>Timezone (affects scheduling and time tracking)</li>
                <li>Pay period type (weekly, biweekly, monthly)</li>
                <li>Overtime rules</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">3. Add Your First Worker</h2>
              <p className="mt-2 text-gray-600">
                Navigate to <strong>Staff → Worker</strong> and click <strong>Add Worker</strong>. Use our guided workflow to:
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-6 text-gray-600">
                <li>Enter worker details (name, phone, email)</li>
                <li>Set their position and hourly rate</li>
                <li>Assign them to a manager</li>
                <li>Set up their schedule</li>
              </ul>
              <div className="mt-4 rounded-lg bg-blue-50 p-4 dark:bg-blue-950/30">
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  <strong>Tip:</strong> Workers will receive an SMS to verify their phone number before they can clock in.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">4. Create Schedules</h2>
              <p className="mt-2 text-gray-600">
                Go to the <strong>Calendar</strong> page to assign shifts:
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-6 text-gray-600">
                <li>Click <strong>Add Shift</strong> or click the + button on any day</li>
                <li>Select the worker</li>
                <li>Choose date, start time, and end time</li>
                <li>Add break duration and any notes</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">5. Workers Clock In/Out</h2>
              <p className="mt-2 text-gray-600">
                Workers can clock in/out using these methods:
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-6 text-gray-600">
                <li><strong>SMS:</strong> Send "IN" or "OUT" to your Twilio number</li>
                <li><strong>Worker Portal:</strong> Log in to clock in/out manually</li>
                <li><strong>Admin:</strong> Add time entries from the Live Status page</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">6. Run Payroll</h2>
              <p className="mt-2 text-gray-600">
                Navigate to <strong>Payroll</strong> to:
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-6 text-gray-600">
                <li>View pay periods</li>
                <li>Review time entries</li>
                <li>See overtime calculations</li>
                <li>Export reports</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">Need Help?</h2>
              <p className="mt-2 text-gray-600">
                Visit our <Link href="/support" className="text-blue-600 hover:underline">Support page</Link> for FAQs, knowledge base articles, or to contact support.
              </p>
            </section>
          </div>
        </article>
      </main>
    </div>
  );
}
