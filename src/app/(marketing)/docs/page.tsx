import { Metadata } from 'next';
import { Clock } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

export const metadata: Metadata = {
  title: 'Technical Documentation - MyPocketWatch',
  description: 'Technical documentation for developers and administrators.',
};

export default function TechnicalDocs() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-4">
          <Clock className="h-6 w-6 text-blue-600" />
          <span className="text-lg font-bold text-gray-900">My Pocket Watch</span>
          <span className="ml-4 text-sm text-gray-500">/ Technical Documentation</span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Technical Documentation</h1>
          <p className="mt-2 text-gray-600">
            Complete technical reference for MyPocketWatch platform
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-4">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="sticky top-6 space-y-1">
              <a href="#architecture" className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
                Architecture
              </a>
              <a href="#tech-stack" className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
                Tech Stack
              </a>
              <a href="#database" className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
                Database Schema
              </a>
              <a href="#api" className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
                API Reference
              </a>
              <a href="#authentication" className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
                Authentication
              </a>
              <a href="#environment" className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
                Environment Variables
              </a>
              <a href="#deployment" className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
                Deployment
              </a>
              <a href="#security" className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
                Security
              </a>
            </nav>
          </div>

          {/* Content */}
          <div className="lg:col-span-3 space-y-12">
            {/* Architecture */}
            <section id="architecture" className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900">Architecture Overview</h2>
              <p className="mt-4 text-gray-600">
                MyPocketWatch is a multi-tenant SaaS platform built on a modern, cloud-native architecture designed for scalability, security, and reliability.
              </p>
              
              <div className="mt-6">
                <h3 className="text-lg font-semibold">High-Level Architecture</h3>
                <div className="mt-4 rounded-lg bg-gray-50 p-6 dark:bg-gray-900">
                  <pre className="text-sm font-mono text-gray-700 dark:text-gray-300">
{`┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │   Web    │  │  Admin   │  │ Worker   │  │  Marketing   │  │
│  │  Portal  │  │  Portal  │  │  Portal  │  │    Pages     │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬───────┘  │
└───────┼─────────────┼─────────────┼───────────────┼──────────┘
        │             │             │               │
        └─────────────┴──────┬──────┴───────────────┘
                             │
                    ┌────────▼────────┐
                    │  Next.js API   │
                    │   Routes       │
                    └────────┬────────┘
                             │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌──────▼──────┐    ┌─────────▼───────┐   ┌────────▼────────┐
│  Supabase   │    │     Twilio     │   │   External     │
│  (Database) │    │  (SMS/Verify)  │   │   APIs         │
└─────────────┘    └─────────────────┘   └─────────────────┘`}
                  </pre>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-semibold">Multi-Tenancy</h3>
                <p className="mt-2 text-gray-600">
                  MyPocketWatch uses a shared database with row-level security (RLS) to ensure data isolation between companies. Each company has a unique <code>company_id</code> that ties all their data together.
                </p>
              </div>
            </section>

            {/* Tech Stack */}
            <section id="tech-stack" className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900">Technology Stack</h2>
              
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-gray-200 p-4">
                  <h3 className="font-semibold">Frontend</h3>
                  <ul className="mt-2 space-y-1 text-sm text-gray-600">
                    <li>• Next.js 16 (App Router)</li>
                    <li>• React 19</li>
                    <li>• TypeScript</li>
                    <li>• Tailwind CSS</li>
                    <li>• Lucide React (icons)</li>
                    <li>• date-fns</li>
                  </ul>
                </div>
                
                <div className="rounded-lg border border-gray-200 p-4">
                  <h3 className="font-semibold">Backend</h3>
                  <ul className="mt-2 space-y-1 text-sm text-gray-600">
                    <li>• Next.js API Routes</li>
                    <li>• Server Components</li>
                    <li>• Supabase Edge Functions (future)</li>
                  </ul>
                </div>
                
                <div className="rounded-lg border border-gray-200 p-4">
                  <h3 className="font-semibold">Database & Auth</h3>
                  <ul className="mt-2 space-y-1 text-sm text-gray-600">
                    <li>• Supabase (PostgreSQL)</li>
                    <li>• Row-Level Security</li>
                    <li>• Supabase Auth</li>
                    <li>• JWT Tokens</li>
                  </ul>
                </div>
                
                <div className="rounded-lg border border-gray-200 p-4">
                  <h3 className="font-semibold">Infrastructure</h3>
                  <ul className="mt-2 space-y-1 text-sm text-gray-600">
                    <li>• Vercel (Hosting)</li>
                    <li>• Twilio (SMS/Verify)</li>
                    <li>• GitHub (CI/CD)</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Database Schema */}
            <section id="database" className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900">Database Schema</h2>
              <p className="mt-4 text-gray-600">
                MyPocketWatch uses PostgreSQL with Supabase. Below are the main tables and their relationships.
              </p>
              
              <div className="mt-6 space-y-6">
                <div>
                  <h3 className="font-semibold">Core Tables</h3>
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="pb-2 text-left font-medium">Table</th>
                          <th className="pb-2 text-left font-medium">Description</th>
                        </tr>
                      </thead>
                      <tbody className="space-y-2">
                        <tr>
                          <td className="py-2 font-mono text-blue-600">companies</td>
                          <td className="py-2">Tenant organizations</td>
                        </tr>
                        <tr>
                          <td className="py-2 font-mono text-blue-600">admin_users</td>
                          <td className="py-2">Admin/manager accounts</td>
                        </tr>
                        <tr>
                          <td className="py-2 font-mono text-blue-600">workers</td>
                          <td className="py-2">Employee records</td>
                        </tr>
                        <tr>
                          <td className="py-2 font-mono text-blue-600">team_hierarchy</td>
                          <td className="py-2">Team assignments</td>
                        </tr>
                        <tr>
                          <td className="py-2 font-mono text-blue-600">schedules</td>
                          <td className="py-2">Work schedules</td>
                        </tr>
                        <tr>
                          <td className="py-2 font-mono text-blue-600">time_entries</td>
                          <td className="py-2">Clock in/out records</td>
                        </tr>
                        <tr>
                          <td className="py-2 font-mono text-blue-600">payroll_periods</td>
                          <td className="py-2">Pay period definitions</td>
                        </tr>
                        <tr>
                          <td className="py-2 font-mono text-blue-600">payroll_entries</td>
                          <td className="py-2">Payroll line items</td>
                        </tr>
                        <tr>
                          <td className="py-2 font-mono text-blue-600">notifications</td>
                          <td className="py-2">System notifications</td>
                        </tr>
                        <tr>
                          <td className="py-2 font-mono text-blue-600">message_logs</td>
                          <td className="py-2">SMS/WhatsApp messages</td>
                        </tr>
                        <tr>
                          <td className="py-2 font-mono text-blue-600">audit_logs</td>
                          <td className="py-2">Change tracking</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold">ERD Key Relationships</h3>
                  <div className="mt-3 rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
                    <pre className="text-sm font-mono text-gray-700 dark:text-gray-300">
{`companies (1) ────── (N) admin_users
companies (1) ────── (N) workers  
companies (1) ────── (N) team_hierarchy
companies (1) ────── (N) schedules
companies (1) ────── (N) time_entries
companies (1) ────── (N) payroll_periods

workers (1) ────── (N) schedules
workers (1) ────── (N) time_entries
workers (1) ────── (N) team_hierarchy (as lead)
workers (1) ────── (N) team_hierarchy (as member)

admin_users (1) ────── (N) audit_logs`}
                    </pre>
                  </div>
                </div>
              </div>
            </section>

            {/* API Reference */}
            <section id="api" className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900">API Reference</h2>
              <p className="mt-4 text-gray-600">
                All API endpoints require authentication via Supabase JWT. Include the token in the Authorization header.
              </p>
              
              <div className="mt-6 space-y-6">
                <div>
                  <h3 className="font-semibold">Workers</h3>
                  <div className="mt-3 space-y-4">
                    <div className="rounded-lg border border-gray-200 p-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="success">GET</Badge>
                        <code className="text-sm">/api/workers</code>
                      </div>
                      <p className="mt-2 text-sm text-gray-600">List all workers for the company</p>
                    </div>
                    
                    <div className="rounded-lg border border-gray-200 p-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="primary">POST</Badge>
                        <code className="text-sm">/api/workers</code>
                      </div>
                      <p className="mt-2 text-sm text-gray-600">Create a new worker</p>
                      <div className="mt-2 rounded bg-gray-50 p-2 dark:bg-gray-900">
                        <pre className="text-xs">
{`{
  "first_name": "string",
  "last_name": "string", 
  "phone": "string",
  "email": "string?",
  "hourly_rate": "number?",
  "position": "string?",
  "hire_date": "YYYY-MM-DD"
}`}
                        </pre>
                      </div>
                    </div>
                    
                    <div className="rounded-lg border border-gray-200 p-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="warning">PUT</Badge>
                        <code className="text-sm">/api/workers/[id]</code>
                      </div>
                      <p className="mt-2 text-sm text-gray-600">Update a worker</p>
                    </div>
                    
                    <div className="rounded-lg border border-gray-200 p-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive">DELETE</Badge>
                        <code className="text-sm">/api/workers/[id]</code>
                      </div>
                      <p className="mt-2 text-sm text-gray-600">Delete a worker</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold">Teams</h3>
                  <div className="mt-3 space-y-4">
                    <div className="rounded-lg border border-gray-200 p-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="success">GET</Badge>
                        <code className="text-sm">/api/teams</code>
                      </div>
                      <p className="mt-2 text-sm text-gray-600">List all teams</p>
                    </div>
                    
                    <div className="rounded-lg border border-gray-200 p-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="primary">POST</Badge>
                        <code className="text-sm">/api/teams</code>
                      </div>
                      <p className="mt-2 text-sm text-gray-600">Add worker to team</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold">Schedules</h3>
                  <div className="mt-3 space-y-4">
                    <div className="rounded-lg border border-gray-200 p-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="success">GET</Badge>
                        <code className="text-sm">/api/schedules</code>
                      </div>
                      <p className="mt-2 text-sm text-gray-600">List schedules (supports ?worker_id=, ?start=, ?end=)</p>
                    </div>
                    
                    <div className="rounded-lg border border-gray-200 p-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="primary">POST</Badge>
                        <code className="text-sm">/api/schedules</code>
                      </div>
                      <p className="mt-2 text-sm text-gray-600">Create a schedule</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold">Time Entries</h3>
                  <div className="mt-3 space-y-4">
                    <div className="rounded-lg border border-gray-200 p-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="success">GET</Badge>
                        <code className="text-sm">/api/time-entries</code>
                      </div>
                      <p className="mt-2 text-sm text-gray-600">List time entries (supports filters)</p>
                    </div>
                    
                    <div className="rounded-lg border border-gray-200 p-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="primary">POST</Badge>
                        <code className="text-sm">/api/time-entries</code>
                      </div>
                      <p className="mt-2 text-sm text-gray-600">Clock in or add entry</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Authentication */}
            <section id="authentication" className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900">Authentication</h2>
              
              <div className="mt-6 space-y-4">
                <div>
                  <h3 className="font-semibold">How Auth Works</h3>
                  <p className="mt-2 text-gray-600">
                    MyPocketWatch uses Supabase Auth for user authentication. Sessions are managed via JWT tokens stored in HTTP-only cookies.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold">Auth Flow</h3>
                  <ol className="mt-2 list-decimal space-y-2 pl-5 text-gray-600">
                    <li>User signs up or logs in via email/password or OAuth</li>
                    <li>Supabase issues a JWT access token</li>
                    <li>Token is stored in a secure cookie</li>
                    <li>API routes verify the token and extract company context</li>
                    <li>Row-level security (RLS) policies enforce data isolation</li>
                  </ol>
                </div>
                
                <div>
                  <h3 className="font-semibold">API Authentication</h3>
                  <p className="mt-2 text-gray-600">
                    All protected API routes use <code>getAuthContext()</code> to verify the token and extract:
                  </p>
                  <div className="mt-2 rounded bg-gray-50 p-3 dark:bg-gray-900">
                    <pre className="text-sm">
{`{
  supabase: SupabaseClient,
  company: Company,
  adminUser: AdminUser,
  session: Session
}`}
                    </pre>
                  </div>
                </div>
              </div>
            </section>

            {/* Environment Variables */}
            <section id="environment" className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900">Environment Variables</h2>
              
              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="pb-3 text-left font-medium">Variable</th>
                      <th className="pb-3 text-left font-medium">Required</th>
                      <th className="pb-3 text-left font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody className="space-y-3">
                    <tr>
                      <td className="py-2 font-mono text-blue-600">NEXT_PUBLIC_SUPABASE_URL</td>
                      <td className="py-2"><Badge variant="destructive">Yes</Badge></td>
                      <td className="py-2">Supabase project URL</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-mono text-blue-600">NEXT_PUBLIC_SUPABASE_ANON_KEY</td>
                      <td className="py-2"><Badge variant="destructive">Yes</Badge></td>
                      <td className="py-2">Supabase anon key</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-mono text-blue-600">SUPABASE_SERVICE_ROLE_KEY</td>
                      <td className="py-2"><Badge variant="destructive">Yes</Badge></td>
                      <td className="py-2">Service role key (server-side only)</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-mono text-blue-600">NEXT_PUBLIC_APP_URL</td>
                      <td className="py-2"><Badge variant="default">No</Badge></td>
                      <td className="py-2">App URL for OAuth redirects</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-mono text-blue-600">TWILIO_ACCOUNT_SID</td>
                      <td className="py-2"><Badge variant="default">No</Badge></td>
                      <td className="py-2">Twilio Account SID</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-mono text-blue-600">TWILIO_AUTH_TOKEN</td>
                      <td className="py-2"><Badge variant="default">No</Badge></td>
                      <td className="py-2">Twilio Auth Token</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-mono text-blue-600">TWILIO_VERIFY_SERVICE_SID</td>
                      <td className="py-2"><Badge variant="default">No</Badge></td>
                      <td className="py-2">Twilio Verify Service SID</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Deployment */}
            <section id="deployment" className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900">Deployment</h2>
              
              <div className="mt-6 space-y-4">
                <div>
                  <h3 className="font-semibold">Production Deployment</h3>
                  <ol className="mt-2 list-decimal space-y-2 pl-5 text-gray-600">
                    <li>Push code to GitHub</li>
                    <li>Vercel auto-deploys from main branch</li>
                    <li>Set environment variables in Vercel dashboard</li>
                    <li>Configure custom domain (optional)</li>
                  </ol>
                </div>
                
                <div>
                  <h3 className="font-semibold">Database Setup</h3>
                  <ol className="mt-2 list-decimal space-y-2 pl-5 text-gray-600">
                    <li>Create Supabase project</li>
                    <li>Run migrations in <code>supabase/migrations/</code></li>
                    <li>Configure RLS policies</li>
                    <li>Set up OAuth providers (Google, etc.)</li>
                  </ol>
                </div>

                <div>
                  <h3 className="font-semibold">Twilio Setup</h3>
                  <ol className="mt-2 list-decimal space-y-2 pl-5 text-gray-600">
                    <li>Create Twilio account</li>
                    <li>Get Account SID and Auth Token</li>
                    <li>Create Verify Service for phone verification</li>
                    <li>Add Privacy Policy URL in Twilio console</li>
                    <li>Add environment variables</li>
                  </ol>
                </div>
              </div>
            </section>

            {/* Security */}
            <section id="security" className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900">Security</h2>
              
              <div className="mt-6 space-y-4">
                <div>
                  <h3 className="font-semibold">Data Protection</h3>
                  <ul className="mt-2 list-disc space-y-2 pl-5 text-gray-600">
                    <li>All data encrypted in transit (TLS) and at rest (Supabase)</li>
                    <li>Row-level security (RLS) enforces tenant isolation</li>
                    <li>HTTP-only cookies for session management</li>
                    <li>CSRF protection via Next.js</li>
                    <li>Input validation on all API endpoints</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold">Security Headers</h3>
                  <div className="mt-2 rounded bg-gray-50 p-3 dark:bg-gray-900">
                    <pre className="text-sm">
{`X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'`}
                    </pre>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold">Audit Logging</h3>
                  <p className="mt-2 text-gray-600">
                    All significant actions are logged to the <code>audit_logs</code> table including:
                  </p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-gray-600">
                    <li>Worker creation/deletion</li>
                    <li>Time entry modifications</li>
                    <li>Schedule changes</li>
                    <li>Payroll period closures</li>
                    <li>Admin user actions</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold">What We Don't Store</h3>
                  <p className="mt-2 text-gray-600">
                    Per security requirements, we never store:
                  </p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-gray-600">
                    <li>Credit card or banking details</li>
                    <li>Social Security Numbers (SSN)</li>
                    <li>Raw authentication credentials</li>
                  </ul>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 border-t border-gray-200 pt-6">
          <p className="text-center text-sm text-gray-500">
            © 2026 MyPocketWatch. All rights reserved.
          </p>
        </div>
      </main>
    </div>
  );
}
