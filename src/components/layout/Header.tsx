'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Bell, Sun, Moon } from 'lucide-react';

export function Header() {
  const [now, setNow] = useState(new Date());
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setDarkMode(isDark);
  }, []);

  const toggleDark = () => {
    document.documentElement.classList.toggle('dark');
    setDarkMode(!darkMode);
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 dark:border-gray-800 dark:bg-gray-950">
      <div className="flex items-center gap-4 pl-12 lg:pl-0">
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {format(now, 'EEEE, MMMM d, yyyy')}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {format(now, 'h:mm a')}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={toggleDark}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
        <button className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800">
          <Bell className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
