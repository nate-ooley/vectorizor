'use client';

import { Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

function SettingsContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/magic-wanda/login');
    }
  }, [status, router]);

  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    if (success === 'connected') {
      setStatusMessage({ type: 'success', text: 'GoHighLevel connected successfully!' });
    } else if (error) {
      const errorMessages: Record<string, string> = {
        missing_params: 'Authorization failed — missing parameters.',
        invalid_state: 'Authorization failed — invalid state.',
        token_exchange_failed: 'Failed to connect GoHighLevel. Please try again.',
      };
      setStatusMessage({ type: 'error', text: errorMessages[error] || 'An error occurred.' });
    }
  }, [searchParams]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-neutral-400">Loading...</div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="border-b border-neutral-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/magic-wanda" className="text-neutral-500 hover:text-neutral-300">
            &larr; Back to Chat
          </Link>
          <h1 className="text-white font-semibold text-sm">Settings</h1>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-8 space-y-8">
        {statusMessage && (
          <div
            className={`px-4 py-3 rounded-lg text-sm ${
              statusMessage.type === 'success'
                ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                : 'bg-red-500/10 border border-red-500/30 text-red-400'
            }`}
          >
            {statusMessage.text}
          </div>
        )}

        {/* GHL Connection */}
        <section>
          <h2 className="text-white font-semibold mb-1">GoHighLevel Connection</h2>
          <p className="text-neutral-500 text-sm mb-4">
            Connect your GHL account to let Magic Wanda access your contacts, calendars, messages, and invoices.
          </p>
          <a
            href="/api/magic-wanda/ghl/authorize"
            className="inline-block py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Connect GoHighLevel
          </a>
        </section>

        {/* Account Info */}
        <section>
          <h2 className="text-white font-semibold mb-1">Account</h2>
          <div className="bg-neutral-900 rounded-lg p-4 space-y-2">
            <div className="flex text-sm">
              <span className="text-neutral-500 w-28">Email</span>
              <span className="text-neutral-300">{session.user?.email}</span>
            </div>
            <div className="flex text-sm">
              <span className="text-neutral-500 w-28">Name</span>
              <span className="text-neutral-300">{session.user?.name || 'Not set'}</span>
            </div>
            <div className="flex text-sm">
              <span className="text-neutral-500 w-28">Organization</span>
              <span className="text-neutral-300">
                {(session as { tenantName?: string }).tenantName || 'Not set'}
              </span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
          <div className="text-neutral-400">Loading...</div>
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
