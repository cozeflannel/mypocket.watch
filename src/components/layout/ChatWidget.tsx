'use client';

import { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ChatWidget() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Chat Panel */}
      {open && (
        <div className="fixed bottom-20 right-6 z-50 flex h-96 w-80 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 bg-blue-600 px-4 py-3 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-white" />
              <span className="text-sm font-semibold text-white">PocketWatch Assistant</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-full p-1 text-white/80 hover:bg-white/20 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages area */}
          <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
            <div className="rounded-full bg-blue-50 p-3 dark:bg-blue-950/30">
              <MessageCircle className="h-8 w-8 text-blue-500" />
            </div>
            <p className="mt-3 text-sm font-medium text-gray-700 dark:text-gray-300">
              AI Assistant Coming Soon
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Ask questions about your team, schedules, payroll, and more.
            </p>
          </div>

          {/* Input area (placeholder) */}
          <div className="border-t border-gray-200 p-3 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <input
                disabled
                placeholder="Type a message..."
                className="flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-400 dark:border-gray-700 dark:bg-gray-800"
              />
              <button
                disabled
                className="rounded-full bg-blue-600 p-2 text-white opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-all hover:bg-blue-700 hover:scale-105 active:scale-95',
          open && 'bg-gray-600 hover:bg-gray-700'
        )}
        title="Chat with PocketWatch"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </>
  );
}
