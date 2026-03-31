'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import ChatWindow from './ChatWindow';
import ActionConfirmationCard from './ActionConfirmationCard';
import { useMagicWanda } from '@/hooks/useMagicWanda';

export default function MagicWandaApp() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const {
    messages,
    isLoading,
    error,
    pendingAction,
    sendMessage,
    confirmAction,
    rejectAction,
    startNewConversation,
  } = useMagicWanda();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/magic-wanda/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-neutral-400">Loading...</div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-neutral-800 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
            <span className="text-sm font-bold text-white">W</span>
          </div>
          <div>
            <h1 className="text-white font-semibold text-sm">Magic Wanda</h1>
            <p className="text-neutral-500 text-xs">
              {(session as { tenantName?: string }).tenantName || 'Your CRM Assistant'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={startNewConversation}
            className="text-xs text-purple-400 hover:text-purple-300 px-2 py-1 rounded"
          >
            New Chat
          </button>
          <Link
            href="/magic-wanda/settings"
            className="text-xs text-neutral-500 hover:text-neutral-300 px-2 py-1 rounded"
          >
            Settings
          </Link>
          <span className="text-neutral-500 text-xs hidden sm:inline">{session.user?.email}</span>
          <button
            onClick={() => signOut({ callbackUrl: '/magic-wanda/login' })}
            className="text-xs text-neutral-500 hover:text-neutral-300 px-2 py-1 rounded"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Chat */}
      <main className="flex-1 flex flex-col max-w-3xl w-full mx-auto">
        <ChatWindow
          messages={messages}
          isLoading={isLoading}
          onSend={sendMessage}
          error={error}
        />
        {pendingAction && (
          <ActionConfirmationCard
            action={pendingAction}
            onConfirm={confirmAction}
            onReject={rejectAction}
            isLoading={isLoading}
          />
        )}
      </main>
    </div>
  );
}
