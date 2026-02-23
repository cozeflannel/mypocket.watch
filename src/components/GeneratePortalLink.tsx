'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Link2, Copy, Check } from 'lucide-react';

interface GeneratePortalLinkProps {
  workerId: string;
  workerName: string;
}

export function GeneratePortalLink({ workerId, workerName }: GeneratePortalLinkProps) {
  const [loading, setLoading] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generateLink = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/workers/${workerId}/portal-link`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.url) {
        setLink(data.url);
      }
    } catch (err) {
      console.error('Failed to generate link:', err);
    }
    setLoading(false);
  };

  const copyLink = () => {
    if (link) {
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (link) {
    return (
      <div className="flex items-center gap-2">
        <input
          readOnly
          value={link}
          className="w-48 rounded border px-2 py-1 text-xs dark:bg-gray-800"
        />
        <Button size="sm" variant="outline" onClick={copyLink}>
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        </Button>
      </div>
    );
  }

  return (
    <Button size="sm" variant="outline" onClick={generateLink} disabled={loading}>
      <Link2 className="mr-1 h-3 w-3" />
      {loading ? 'Generating...' : 'Portal Link'}
    </Button>
  );
}
