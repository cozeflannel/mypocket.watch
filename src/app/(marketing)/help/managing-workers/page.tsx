import { Metadata } from 'next';
import { Clock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Managing Workers - MyPocketWatch Help Center',
  description: 'Learn how to add, edit, and manage workers.',
};

export default function ManagingWorkers() {
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
          <h1 className="text-3xl font-bold text-gray-900">Managing Workers</h1>
          <p className="mt-2 text-gray-600">Complete guide to adding, editing, and organizing workers.</p>

          <div className="mt-8 space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-gray-900">Adding Workers</h2>
              <p className="mt-2 text-gray-600">
                Use our guided workflow to add workers with all the information you need:
              </p>
              <ol className="mt-3 list-decimal space-y-2 pl-6 text-gray-600">
                <li>Go to <strong>Staff → Worker</strong></li>
                <li>Click <strong>Add Worker</strong></li>
                <li>Complete the 4-step wizard:
                  <ul className="mt-2 list-disc pl-6">
                    <li><strong>Step 1:</strong> Enter name, phone, email, position, hire date, and hourly rate</li>
                    <li><strong>Step 2:</strong> Assign to a manager and/or team</li>
                    <li><strong>Step 3:</strong> Choose a schedule template or create custom hours</li>
                    <li><strong>Step 4:</strong> Review and confirm</li>
                  </ul>
                </li>
              </ol>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">Required vs Optional Fields</h2>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="pb-2 text-left font-medium">Field</th>
                      <th className="pb-2 text-left font-medium">Required</th>
                      <th className="pb-2 text-left font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody className="space-y-2">
                    <tr>
                      <td className="py-2">First Name</td>
                      <td className="py-2 text-red-600">Yes</td>
                      <td className="py-2">Worker's first name</td>
                    </tr>
                    <tr>
                      <td className="py-2">Last Name</td>
                      <td className="py-2 text-red-600">Yes</td>
                      <td className="py-2">Worker's last name</td>
                    </tr>
                    <tr>
                      <td className="py-2">Phone</td>
                      <td className="py-2 text-red-600">Yes</td>
                      <td className="py-2">Used for SMS clock in/out and verification</td>
                    </tr>
                    <tr>
                      <td className="py-2">Email</td>
                      <td className="py-2 text-green-600">No</td>
                      <td className="py-2">Worker's email address</td>
                    </tr>
                    <tr>
                      <td className="py-2">Position</td>
                      <td className="py-2 text-green-600">No</td>
                      <td className="py-2">Job title or role</td>
                    </tr>
                    <tr>
                      <td className="py-2">Hire Date</td>
                      <td className="py-2 text-green-600">No</td>
                      <td className="py-2">Defaults to today, can be changed</td>
                    </tr>
                    <tr>
                      <td className="py-2">Hourly Rate</td>
                      <td className="py-2 text-green-600">No</td>
                      <td className="py-2">Used for payroll calculations</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">Phone Verification</h2>
              <p className="mt-2 text-gray-600">
                When you add a worker, they'll receive an SMS with a verification code. They must verify their phone number before they can clock in. This ensures the phone number is valid and belongs to them.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">Worker Status</h2>
              <p className="mt-2 text-gray-600">
                Workers can be either <strong>Active</strong> or <strong>Inactive</strong>:
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-6 text-gray-600">
                <li><strong>Active:</strong> Can clock in, view schedules, appear in reports</li>
                <li><strong>Inactive:</strong> Cannot clock in, hidden from active lists</li>
              </ul>
              <p className="mt-3 text-gray-600">
                Inactive workers remain in the system for historical payroll records.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">Organizing Workers</h2>
              <p className="mt-2 text-gray-600">
                You can organize workers in two ways:
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-6 text-gray-600">
                <li><strong>Manager Assignment:</strong> Set who each worker reports to</li>
                <li><strong>Teams:</strong> Group workers into teams (Staff → Team)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">Editing Workers</h2>
              <p className="mt-2 text-gray-600">
                Click on any worker in the list to view their details and make edits. You can update:
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-6 text-gray-600">
                <li>Contact information</li>
                <li>Position and pay rate</li>
                <li>Manager assignment</li>
                <li>Team memberships</li>
              </ul>
            </section>
          </div>
        </article>
      </main>
    </div>
  );
}
