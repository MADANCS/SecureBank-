export function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="space-y-4">
        <div className="flex justify-center gap-2">
          <div className="h-3 w-3 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="h-3 w-3 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="h-3 w-3 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>
        <p className="text-sm text-slate-500 text-center">Loading...</p>
      </div>
    </div>
  );
}

export function SkeletonCard({ count = 1 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm animate-pulse">
          <div className="h-3 w-16 bg-slate-200 rounded"></div>
          <div className="mt-3 h-5 w-32 bg-slate-200 rounded"></div>
          <div className="mt-4 h-3 w-24 bg-slate-200 rounded"></div>
          <div className="mt-2 h-6 w-40 bg-slate-200 rounded"></div>
        </div>
      ))}
    </>
  );
}

export default LoadingState;
