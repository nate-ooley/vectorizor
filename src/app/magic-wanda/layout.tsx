'use client';

import { SessionProvider } from 'next-auth/react';

export default function MagicWandaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider basePath="/api/magic-wanda/auth">
      {children}
    </SessionProvider>
  );
}
