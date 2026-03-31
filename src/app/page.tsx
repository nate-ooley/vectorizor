import Link from "next/link";

export default function Home() {
  return (
    <div className="font-sans min-h-screen bg-neutral-950 text-white">
      <main className="max-w-4xl mx-auto px-4 py-20">
        <h1 className="text-4xl font-bold tracking-tight mb-2">Dev Projects Portal</h1>
        <p className="text-neutral-400 mb-12">Tools and utilities for developers.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/vectorizer"
            className="group rounded-xl border border-neutral-800 bg-neutral-900 p-6 hover:border-blue-600 hover:bg-neutral-900/80 transition-colors"
          >
            <div className="flex items-center gap-3 mb-3">
              <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
              </svg>
              <h2 className="text-lg font-semibold group-hover:text-blue-400 transition-colors">
                Image to SVG Vectorizer
              </h2>
            </div>
            <p className="text-sm text-neutral-400">
              Convert raster images to 100% pure vector SVG files. Scales infinitely with crisp edges at any size.
            </p>
          </Link>

          <Link
            href="/magic-wanda"
            className="group rounded-xl border border-neutral-800 bg-neutral-900 p-6 hover:border-purple-600 hover:bg-neutral-900/80 transition-colors"
          >
            <div className="flex items-center gap-3 mb-3">
              <svg className="w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
              </svg>
              <h2 className="text-lg font-semibold group-hover:text-purple-400 transition-colors">
                Magic Wanda
              </h2>
            </div>
            <p className="text-sm text-neutral-400">
              AI-powered GoHighLevel assistant. Chat or talk to manage contacts, calendars, messages, and invoices.
            </p>
          </Link>
        </div>
      </main>
    </div>
  );
}
