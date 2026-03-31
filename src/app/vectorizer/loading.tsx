export default function VectorizerLoading() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="mb-8">
          <div className="h-8 w-72 bg-neutral-800 rounded animate-pulse" />
          <div className="h-5 w-96 bg-neutral-800 rounded animate-pulse mt-3" />
        </div>
        <div className="h-48 bg-neutral-900 border-2 border-dashed border-neutral-700 rounded-xl animate-pulse" />
      </div>
    </main>
  );
}
