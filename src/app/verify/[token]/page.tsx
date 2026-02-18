'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MapPin, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function VerifyLocationPage() {
  const { token } = useParams();
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'locating' | 'success' | 'error' | 'denied'>('idle');
  const [message, setMessage] = useState('');
  const [returnLink, setReturnLink] = useState('');

  const handleVerify = () => {
    setStatus('locating');
    if (!navigator.geolocation) {
      setStatus('error');
      setMessage('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const res = await fetch(`/api/verify/${token}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            }),
          });

          const data = await res.json();
          if (res.ok) {
            setStatus('success');
            setMessage(data.message);
            setReturnLink(data.returnUrl);
          } else {
            setStatus('error');
            setMessage(data.error || 'Verification failed. You might be out of range.');
          }
        } catch (err) {
          setStatus('error');
          setMessage('Network error. Please try again.');
        }
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setStatus('denied');
        } else {
          setStatus('error');
          setMessage('Failed to get location. Please ensure GPS is enabled.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-sm dark:bg-gray-900 text-center">
        {status === 'idle' && (
          <>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
              <MapPin className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Verify Your Location</h1>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              We need to confirm you are on site to clock in.
            </p>
            <Button onClick={handleVerify} className="mt-6 w-full" size="lg">
              Allow Location Access
            </Button>
          </>
        )}

        {status === 'locating' && (
          <div className="py-8">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">Getting your location...</p>
          </div>
        )}

        {status === 'success' && (
          <>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Success!</h1>
            <p className="mt-2 text-gray-500 dark:text-gray-400">{message}</p>
            {returnLink && (
              <Button asChild className="mt-6 w-full" variant="outline">
                <a href={returnLink}>Return to Chat</a>
              </Button>
            )}
          </>
        )}

        {(status === 'error' || status === 'denied') && (
          <>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
              <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {status === 'denied' ? 'Access Denied' : 'Verification Failed'}
            </h1>
            <p className="mt-2 text-red-600 dark:text-red-400">
              {status === 'denied'
                ? 'Please enable location permissions in your browser settings to continue.'
                : message}
            </p>
            <Button onClick={() => window.location.reload()} className="mt-6 w-full" variant="secondary">
              Try Again
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
