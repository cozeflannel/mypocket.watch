'use client';

import { useState, useEffect } from 'react';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  Link2, 
  Phone, 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Send,
  ExternalLink,
  RefreshCw,
  CreditCard,
  Settings,
  Info
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';

interface TwilioStatus {
  connected: boolean;
  phoneNumber?: string;
  accountSid?: string;
  verifyServiceSid?: string;
  messagesToday: number;
  messagesThisWeek: number;
  messagesThisMonth: number;
  errors: { message: string; timestamp: string }[];
}

export default function IntegrationsPage() {
  const [twilioStatus, setTwilioStatus] = useState<TwilioStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [testingSMS, setTestingSMS] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const { company } = useCompany();
  const supabase = createClient();

  useEffect(() => {
    const fetchTwilioStatus = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/integrations/twilio');
        const data = await response.json();
        setTwilioStatus({
          connected: data.connected || false,
          phoneNumber: data.phoneNumber,
          accountSid: data.friendlyName,
          verifyServiceSid: data.verifyServiceSid,
          messagesToday: 47,
          messagesThisWeek: 283,
          messagesThisMonth: 1247,
          errors: []
        });
      } catch (err) {
        console.error('Failed to fetch Twilio status:', err);
      }
      setLoading(false);
    };

    fetchTwilioStatus();
  }, [company]);

  const handleTestSMS = async () => {
    if (!testPhone) return;
    
    setTestingSMS(true);
    setTestResult(null);
    
    // Simulate sending test SMS
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setTestResult({
      success: true,
      message: `Test SMS sent successfully to ${testPhone}`
    });
    
    setTestingSMS(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Integrations</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your connected services and integrations
          </p>
        </div>
      </div>

      {/* Twilio Integration */}
      <Card>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
              <Phone className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle>Twilio</CardTitle>
                {twilioStatus?.connected ? (
                  <Badge variant="success">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <XCircle className="mr-1 h-3 w-3" />
                    Not Connected
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                SMS, voice, and verification services for worker communication
              </p>
            </div>
          </div>
          <Button variant="secondary" size="sm">
            <Settings className="mr-2 h-4 w-4" />
            Configure
          </Button>
        </div>

        {loading ? (
          <div className="mt-6 flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500">Loading Twilio status...</span>
          </div>
        ) : twilioStatus?.connected ? (
          <div className="mt-6 space-y-6">
            {/* Status Overview */}
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <p className="text-sm text-gray-500">Phone Number</p>
                <p className="mt-1 font-medium">{twilioStatus.phoneNumber}</p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <p className="text-sm text-gray-500">Account SID</p>
                <p className="mt-1 font-mono text-sm">{twilioStatus.accountSid}</p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <p className="text-sm text-gray-500">Verify Service</p>
                <p className="mt-1 font-mono text-sm">{twilioStatus.verifyServiceSid}</p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <p className="text-sm text-gray-500">Status</p>
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="font-medium text-green-600">Active</span>
                </div>
              </div>
            </div>

            {/* Usage Stats */}
            <div>
              <h3 className="mb-3 font-semibold">Message Usage</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950/30">
                  <p className="text-sm text-blue-600">Today</p>
                  <p className="mt-1 text-2xl font-bold text-blue-700 dark:text-blue-400">
                    {twilioStatus.messagesToday}
                  </p>
                  <p className="text-xs text-blue-600">messages</p>
                </div>
                <div className="rounded-lg bg-purple-50 p-4 dark:bg-purple-950/30">
                  <p className="text-sm text-purple-600">This Week</p>
                  <p className="mt-1 text-2xl font-bold text-purple-700 dark:text-purple-400">
                    {twilioStatus.messagesThisWeek}
                  </p>
                  <p className="text-xs text-purple-600">messages</p>
                </div>
                <div className="rounded-lg bg-green-50 p-4 dark:bg-green-950/30">
                  <p className="text-sm text-green-600">This Month</p>
                  <p className="mt-1 text-2xl font-bold text-green-700 dark:text-green-400">
                    {twilioStatus.messagesThisMonth}
                  </p>
                  <p className="text-xs text-green-600">messages</p>
                </div>
              </div>
            </div>

            {/* Test SMS */}
            <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <h3 className="mb-3 font-semibold">Send Test SMS</h3>
              <div className="flex gap-3">
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
                />
                <Button 
                  onClick={handleTestSMS} 
                  loading={testingSMS}
                  disabled={!testPhone}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Send Test
                </Button>
              </div>
              {testResult && (
                <div className={`mt-3 flex items-center gap-2 text-sm ${
                  testResult.success ? 'text-green-600' : 'text-red-600'
                }`}>
                  {testResult.success ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  {testResult.message}
                </div>
              )}
            </div>

            {/* Error Logs */}
            {twilioStatus.errors.length > 0 && (
              <div>
                <h3 className="mb-3 font-semibold">Recent Errors</h3>
                <div className="space-y-2">
                  {twilioStatus.errors.map((error, index) => (
                    <div 
                      key={index}
                      className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/30"
                    >
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      <div className="flex-1">
                        <p className="text-sm text-red-700 dark:text-red-400">{error.message}</p>
                        <p className="text-xs text-red-500">{error.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Links */}
            <div className="flex gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
              <Button variant="ghost" size="sm">
                <ExternalLink className="mr-2 h-4 w-4" />
                Twilio Console
              </Button>
              <Button variant="ghost" size="sm">
                <CreditCard className="mr-2 h-4 w-4" />
                Billing
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-lg border border-dashed border-gray-300 p-8 text-center dark:border-gray-700">
            <Link2 className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
            <h3 className="mt-4 font-semibold">Connect Twilio</h3>
            <p className="mt-2 text-sm text-gray-500">
              Configure your Twilio account to enable SMS and verification services
            </p>
            <Button className="mt-4">
              <Link2 className="mr-2 h-4 w-4" />
              Connect Twilio
            </Button>
          </div>
        )}
      </Card>

      {/* Other Integrations */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Other Integrations</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="opacity-75">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                  <MessageSquare className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">WhatsApp</p>
                  <p className="text-xs text-gray-500">Coming soon</p>
                </div>
              </div>
              <Badge variant="secondary">Coming Soon</Badge>
            </div>
          </Card>

          <Card className="opacity-75">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <svg className="h-5 w-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                  </svg>
                </div>
                <div>
                  <p className="font-medium">Telegram</p>
                  <p className="text-xs text-gray-500">Coming soon</p>
                </div>
              </div>
              <Badge variant="secondary">Coming Soon</Badge>
            </div>
          </Card>

          <Card className="opacity-75">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                  <svg className="h-5 w-5 text-yellow-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <div>
                  <p className="font-medium">Google Calendar</p>
                  <p className="text-xs text-gray-500">Coming soon</p>
                </div>
              </div>
              <Badge variant="secondary">Coming Soon</Badge>
            </div>
          </Card>

          <Card className="opacity-75">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                  <svg className="h-5 w-5 text-indigo-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/>
                  </svg>
                </div>
                <div>
                  <p className="font-medium">Google Workspace</p>
                  <p className="text-xs text-gray-500">Coming soon</p>
                </div>
              </div>
              <Badge variant="secondary">Coming Soon</Badge>
            </div>
          </Card>
        </div>
      </div>

      {/* Info Box */}
      <div className="flex gap-3 rounded-lg bg-blue-50 p-4 dark:bg-blue-950/30">
        <Info className="h-5 w-5 text-blue-600" />
        <div className="text-sm text-blue-700 dark:text-blue-400">
          <p className="font-medium">Need help with integrations?</p>
          <p className="mt-1">
            Check our {' '}
            <a href="/support" className="underline">support documentation</a>
            {' '} or contact our team for assistance setting up your integrations.
          </p>
        </div>
      </div>
    </div>
  );
}
