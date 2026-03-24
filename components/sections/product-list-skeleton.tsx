import { Skeleton } from "@/components/ui/skeleton"

export function ProductListSkeleton() {
  return (
    <section
      className="px-4 py-6 max-w-7xl mx-auto"
      role="status"
      aria-label="Loading products"
    >
      <div className="flex flex-wrap gap-2 mb-6">
        <Skeleton className="h-9 w-28 rounded-full" />
        <Skeleton className="h-9 w-24 rounded-full" />
        <Skeleton className="h-9 w-32 rounded-full" />
        <Skeleton className="h-9 w-20 rounded-full" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-3 rounded-xl border border-border/60 bg-card p-3">
            <Skeleton className="aspect-square w-full rounded-lg" />
            <Skeleton className="h-4 w-[85%]" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
        ))}
      </div>
    </section>
  )
}
