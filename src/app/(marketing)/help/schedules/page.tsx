import { Metadata } from 'next';
import { Clock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Creating Schedules - MyPocketWatch Help Center',
  description: 'Learn how to create and manage work schedules.',
};

export default function CreatingSchedules() {
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
          <h1 className="text-3xl font-bold text-gray-900">Creating Schedules</h1>
          <p className="mt-2 text-gray-600">Learn how to create and manage work schedules for your team.</p>

          <div className="mt-8 space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-gray-900">Calendar Views</h2>
              <p className="mt-2 text-gray-600">
                The Calendar page offers three views:
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-6 text-gray-600">
                <li><strong>Month View:</strong> See all shifts for the month at a glance</li>
                <li><strong>Week View:</strong> Detailed view of each day in the week</li>
                <li><strong>Day View:</strong> Hour-by-hour breakdown</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">Adding a Shift</h2>
              <ol className="mt-3 list-decimal space-y-2 pl-6 text-gray-600">
                <li>Go to <strong>Calendar</strong></li>
                <li>Click <strong>Add Shift</strong> (or click the + on any day)</li>
                <li>Select the worker</li>
                <li>Choose the date</li>
                <li>Set start and end times</li>
                <li>Add break duration (optional)</li>
                <li>Add notes if needed</li>
                <li>Click <strong>Create Shift</strong></li>
              </ol>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">Schedule Templates</h2>
              <p className="mt-2 text-gray-600">
                When adding a worker, you can choose from these schedule templates:
              </p>
              <div className="mt-3 space-y-2">
                <div className="rounded-lg border border-gray-200 p-3">
                  <p className="font-medium">Monday - Friday</p>
                  <p className="text-sm text-gray-500">8:00 AM - 5:00 PM</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-3">
                  <p className="font-medium">Monday - Friday (7am-4pm)</p>
                  <p className="text-sm text-gray-500">7:00 AM - 4:00 PM</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-3">
                  <p className="font-medium">Weekend Shift</p>
                  <p className="text-sm text-gray-500">Saturday & Sunday, 9:00 AM - 6:00 PM</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-3">
                  <p className="font-medium">Night Shift</p>
                  <p className="text-sm text-gray-500">Monday - Friday, 10:00 PM - 6:00 AM</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-3">
                  <p className="font-medium">Custom</p>
                  <p className="text-sm text-gray-500">Set your own days and hours</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">Viewing Shift Details</h2>
              <p className="mt-2 text-gray-600">
                Click on any shift in the calendar to see:
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-6 text-gray-600">
                <li>Worker name and position</li>
                <li>Scheduled time</li>
                <li>Break duration</li>
                <li>Notes</li>
                <li>Contact information</li>
              </ul>
              <p className="mt-3 text-gray-600">
                From the shift details, you can also edit or delete the shift.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
              <ul className="mt-3 list-disc space-y-2 pl-6 text-gray-600">
                <li><strong>Navigate months:</strong> Use arrows next to month name</li>
                <li><strong>Jump to today:</strong> Click the today button (future feature)</li>
                <li><strong>Quick add:</strong> Click the + button on any day cell</li>
                <li><strong>View worker:</strong> Click a shift to see worker details</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">Coming Soon</h2>
              <ul className="mt-3 list-disc space-y-2 pl-6 text-gray-600">
                <li><strong>Drag-and-drop:</strong> Drag shifts to reschedule</li>
                <li><strong>Copy shifts:</strong> Copy a shift to another day or worker</li>
                <li><strong>Templates:</strong> Save recurring schedules as templates</li>
                <li><strong>Publish workflow:</strong> Preview and publish schedules</li>
                <li><strong>Worker views:</strong> Workers see their own schedules</li>
              </ul>
            </section>
          </div>
        </article>
      </main>
    </div>
  );
}
