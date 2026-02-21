import { Suspense } from 'react';
import WorkerPortalClient from './WorkerPortalClient';

function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-500">Loading...</p>
      </div>
    </div>
  );
}

export default function WorkerPortalPage() {
  return (
    <Suspense fallback={<Loading />}>
      <WorkerPortalClient />
    </Suspense>
  );
}
