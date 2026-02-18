import Link from 'next/link';
import { Clock, CheckCircle, Users, Calendar, TrendingUp, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-950/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">My Pocket Watch</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/auth/login">
                <Button variant="secondary">Sign In</Button>
              </Link>
              <Link href="/auth/signup">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h1 className="text-5xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl lg:text-7xl">
              Stop losing hours.<br />
              <span className="text-blue-600">Start tracking them.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 dark:text-gray-400">
              No more scattered timesheets. No more payroll headaches. No more wondering who&apos;s working where.
              Just simple, accurate time tracking that actually works.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link href="/auth/signup">
                <Button size="lg" className="text-lg">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="#story">
                <Button size="lg" variant="outline" className="text-lg">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* The Story - Problem/Solution */}
      <section id="story" className="bg-white px-4 py-20 dark:bg-gray-900 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-16 lg:grid-cols-2 lg:gap-24">
            {/* The Problem */}
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-red-100 px-4 py-2 text-sm font-medium text-red-700 dark:bg-red-950 dark:text-red-300">
                The Old Way
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                You shouldn&apos;t need a degree in spreadsheets to run payroll.
              </h2>
              <div className="mt-8 space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-950">
                      <span className="text-xl">😤</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Chasing down timesheets every week
                    </h3>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      Friday afternoon: &quot;Did you submit your hours? No? Can you send them now? What about last Tuesday?&quot;
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-950">
                      <span className="text-xl">📝</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Workers frustrated by clunky systems
                    </h3>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      &quot;I logged in today but the system was down. Can I text you my hours instead?&quot;
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-950">
                      <span className="text-xl">💸</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Hours vanish into thin air
                    </h3>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      Overtime you didn&apos;t budget for. Missing clock-outs. Duplicates. Errors that cost you money.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* The Solution */}
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-700 dark:bg-green-950 dark:text-green-300">
                The New Way
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                What if it just... worked?
              </h2>
              <div className="mt-8 space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Workers clock in with a text
                    </h3>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      SMS, WhatsApp, Telegram, Messenger - use whatever they already have. No app to download. No login to forget.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      You see who&apos;s working, right now
                    </h3>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      Live dashboard. No guessing. No calling around. Just open your phone and know.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Payroll that takes minutes, not hours
                    </h3>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      Export to Excel. Generate paystubs. Done. Spend Friday afternoon doing literally anything else.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Everything you need. Nothing you don&apos;t.
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
              Built for real businesses with real workers doing real work.
            </p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                Multi-Channel Clock-In
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                SMS, WhatsApp, Telegram, Messenger. Workers use what they prefer.
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950">
                <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                Live Status Dashboard
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                See who&apos;s clocked in, how long they&apos;ve been working, and where they are.
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950">
                <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                Smart Scheduling
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Create schedules, send reminders, sync with Google Calendar.
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950">
                <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                Automated Payroll
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Calculate hours, generate paystubs, export to your accounting system.
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950">
                <CheckCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                No App Required
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Workers don&apos;t download anything. Just text to clock in.
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950">
                <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                Audit Trail
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Every change tracked. Compliance-ready. Peace of mind included.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-600 px-4 py-20 dark:bg-blue-700 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold text-white">
            Ready to stop losing time?
          </h2>
          <p className="mt-4 text-xl text-blue-100">
            Join businesses that are done with spreadsheet hell.
          </p>
          <div className="mt-10">
            <Link href="/auth/signup">
              <Button size="lg" variant="secondary" className="text-lg">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-sm text-blue-200">
            No credit card required. Setup in under 5 minutes.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white px-4 py-12 dark:border-gray-800 dark:bg-gray-950 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">My Pocket Watch</span>
            </div>
            <p className="text-sm text-gray-500">© {new Date().getFullYear()} My Pocket Watch. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
