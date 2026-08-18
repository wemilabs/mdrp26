import { Skeleton } from "@/components/ui/skeleton";

export function RefractContentSkeleton() {
  return (
    <>
      <div>
        {[0, 1, 2].map((i) => (
          <div key={i} className="mb-6">
            <Skeleton className="mb-3 h-5 w-40 rounded" />
            <div className="grid grid-cols-2 gap-3.5">
              {[0, 1, 2, 3].map((j) => (
                <div key={j}>
                  <Skeleton className="mb-1 h-3 w-20 rounded" />
                  <Skeleton className="h-9 w-full rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        ))}
        <Skeleton className="mt-6 h-32 w-full rounded-2xl" />
      </div>

      <div className="lg:sticky lg:top-5 lg:self-start space-y-4">
        <div className="rounded-2xl border border-prism-border bg-white p-6 shadow-sm">
          <Skeleton className="h-3 w-44 rounded" />
          <Skeleton className="mt-1.5 h-11 w-32 rounded-lg" />
          <Skeleton className="mt-2 h-6 w-24 rounded-full" />
          <Skeleton className="mt-3 h-2 w-full rounded-full" />
          <div className="my-4 h-px bg-prism-border" />
          <Skeleton className="mb-2.5 h-3.5 w-40 rounded" />
          <div className="space-y-2.5">
            {[0, 1, 2, 3].map((i) => (
              <div key={i}>
                <Skeleton className="mb-1 h-3 w-full rounded" />
                <Skeleton className="h-1.5 w-full rounded-full" />
              </div>
            ))}
          </div>
          <div className="my-4 h-px bg-prism-border" />
          <Skeleton className="mb-2 h-3.5 w-28 rounded" />
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="mt-5 h-11 w-full rounded-xl" />
          <Skeleton className="mt-2.5 h-10 w-full rounded-xl" />
        </div>
        <div className="rounded-2xl border border-prism-border bg-white p-5 shadow-sm">
          <Skeleton className="h-4 w-28 rounded" />
          <Skeleton className="mt-3 h-8 w-40 rounded-lg" />
          <div className="mt-4 space-y-3.5">
            {[0, 1, 2].map((i) => (
              <div key={i}>
                <Skeleton className="mb-1 h-3 w-full rounded" />
                <Skeleton className="h-1.5 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export function SpectrumContentSkeleton() {
  return (
    <>
      <div className="mt-6 flex justify-end">
        <Skeleton className="h-9 w-56 rounded-lg" />
      </div>
      <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-prism-border bg-white p-5 shadow-sm"
          >
            <Skeleton className="mb-3 h-4 w-48 rounded" />
            <Skeleton className="h-57.5 w-full rounded-lg" />
          </div>
        ))}
      </div>
      <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-prism-border bg-white p-5 shadow-sm"
          >
            <Skeleton className="mb-3 h-4 w-56 rounded" />
            <div className="divide-y divide-prism-card">
              {[0, 1, 2].map((j) => (
                <div
                  key={j}
                  className="flex items-center justify-between py-2.5"
                >
                  <Skeleton className="h-4 w-40 rounded" />
                  <Skeleton className="h-5 w-16 rounded" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export function BatchContentSkeleton() {
  return (
    <>
      <div className="mb-6 mt-5 flex flex-wrap items-center gap-2.5">
        <Skeleton className="h-9 w-40 rounded-lg" />
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
    </>
  );
}
