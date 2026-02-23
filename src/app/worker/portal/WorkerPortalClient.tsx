'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Calendar, LogOut, Loader2, Link2 } from 'lucide-react';

interface WorkerSession {
  worker: {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
    position: string | null;
  };
  company: {
    id: string;
    name: string;
  };
  googleCalendar: {
    connected: boolean;
    email?: string;
    connectedAt?: string;
  };
}

export default function WorkerPortalPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const gcalStatus = searchParams.get('gcal');
  const error = searchParams.get('error');

  const [session, setSession] = useState<WorkerSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Show status messages from OAuth redirect
  useEffect(() => {
    if (gcalStatus === 'connected') {
      setMessage({ type: 'success', text: 'Google Calendar connected successfully!' });
    } else if (error) {
      const errorMessages: Record<string, string> = {
        db_error: 'Failed to save connection. Please try again.',
        oauth_failed: 'Google authentication failed. Please try again.',
      };
      setMessage({ type: 'error', text: errorMessages[error] || 'Something went wrong.' });
    }
  }, [gcalStatus, error]);

  const loadSession = useCallback(async () => {
    try {
      const res = await fetch('/api/worker/session');
      if (res.ok) {
        const data = await res.json();
        setSession(data);
        setLoading(false);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    async function init() {
      // First try existing session
      const hasSession = await loadSession();
      if (hasSession) return;

      // If we have a token, activate it
      if (token) {
        setActivating(true);
        try {
          const res = await fetch('/api/worker/activate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
          });
          if (res.ok) {
            await loadSession();
          } else {
            setMessage({ type: 'error', text: 'Invalid or expired link. Ask your admin for a new one.' });
          }
        } catch {
          setMessage({ type: 'error', text: 'Something went wrong. Please try again.' });
        }
        setActivating(false);
      }

      setLoading(false);
    }
    init();
  }, [token, loadSession]);

  if (loading || activating) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-gray-600">{activating ? 'Activating your portal...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border p-8 text-center">
          <Link2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Worker Portal</h1>
          {message ? (
            <div className={`p-3 rounded-lg mb-4 ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
              {message.text}
            </div>
          ) : (
            <p className="text-gray-600">
              You need a portal link from your admin to access this page.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              👋 Hi, {session.worker.first_name}
            </h1>
            <p className="text-sm text-gray-500">{session.company.name}</p>
          </div>
          <button
            onClick={() => {
              document.cookie = 'pw_worker_session=; path=/; max-age=0';
              window.location.reload();
            }}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-6 mt-6">
        {/* Status messages */}
        {message && (
          <div className={`p-4 rounded-lg flex items-start gap-3 ${
            message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
            )}
            <p className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {message.text}
            </p>
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Profile</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">Name</span>
              <span className="font-medium">{session.worker.first_name} {session.worker.last_name}</span>
            </div>
            {session.worker.position && (
              <div className="flex justify-between">
                <span className="text-gray-500">Position</span>
                <span className="font-medium">{session.worker.position}</span>
              </div>
            )}
            {session.worker.email && (
              <div className="flex justify-between">
                <span className="text-gray-500">Email</span>
                <span className="font-medium">{session.worker.email}</span>
              </div>
            )}
            {session.worker.phone && (
              <div className="flex justify-between">
                <span className="text-gray-500">Phone</span>
                <span className="font-medium">{session.worker.phone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Google Calendar Connection */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Google Calendar</h2>
          </div>

          {session.googleCalendar.connected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded-lg">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Connected</span>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p>Google account: <span className="font-medium">{session.googleCalendar.email}</span></p>
                {session.googleCalendar.connectedAt && (
                  <p>Connected on: {new Date(session.googleCalendar.connectedAt).toLocaleDateString()}</p>
                )}
              </div>
              <p className="text-sm text-gray-500">
                Your scheduled shifts will automatically appear on your Google Calendar.
              </p>
              <a
                href="/api/auth/google/worker"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Calendar className="w-4 h-4" />
                Reconnect
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600">
                Connect your Google Calendar to automatically see your shifts on your calendar.
              </p>
              <a
                href="/api/auth/google/worker"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Calendar className="w-5 h-5" />
                Connect Google Calendar
              </a>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
