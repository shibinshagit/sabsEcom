import { Skeleton } from "@/components/ui/skeleton"

function PillRow() {
  return (
    <div className="flex gap-2 overflow-hidden">
      <Skeleton className="h-6 w-14 shrink-0 rounded-full bg-white/25" />
      <Skeleton className="h-6 w-20 shrink-0 rounded-full bg-white/25" />
      <Skeleton className="h-6 w-16 shrink-0 rounded-full bg-white/25" />
      <Skeleton className="h-6 w-24 shrink-0 rounded-full bg-white/25" />
    </div>
  )
}

export function NavbarSkeleton() {
  return (
    <nav
      className="sticky top-0 z-40 shadow-lg bg-gradient-to-r from-neutral-500 via-neutral-600 to-neutral-500 dark:from-neutral-700 dark:via-neutral-800 dark:to-neutral-700"
      style={{ top: "var(--banner-height, 0px)" }}
      role="status"
      aria-label="Loading navigation"
    >
      {/* Desktop */}
      <div className="hidden lg:block">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4 gap-4">
            <div className="flex items-center gap-8 flex-1 min-w-0">
              <Skeleton className="h-14 w-44 shrink-0 rounded-xl bg-white/30" />
              <Skeleton className="h-11 flex-1 max-w-2xl rounded-full bg-white/30" />
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Skeleton className="h-11 w-24 rounded-full bg-white/30" />
              <Skeleton className="h-11 w-11 rounded-full bg-white/30" />
              <Skeleton className="h-11 w-11 rounded-full bg-white/30" />
              <Skeleton className="h-11 w-11 rounded-full bg-white/30" />
            </div>
          </div>
          <div className="flex gap-2 overflow-hidden">
            <Skeleton className="h-10 w-36 shrink-0 rounded-full bg-white/25" />
            <Skeleton className="h-10 w-28 shrink-0 rounded-full bg-white/25" />
            <Skeleton className="h-10 w-32 shrink-0 rounded-full bg-white/25" />
            <Skeleton className="h-10 w-24 shrink-0 rounded-full bg-white/25" />
          </div>
        </div>
      </div>

      {/* Tablet */}
      <div className="hidden md:block lg:hidden">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3 gap-2">
            <Skeleton className="h-12 w-36 rounded-xl bg-white/30" />
            <div className="flex items-center gap-2 shrink-0">
              <Skeleton className="h-10 w-16 rounded-full bg-white/30" />
              <Skeleton className="h-10 w-10 rounded-full bg-white/30" />
              <Skeleton className="h-10 w-10 rounded-full bg-white/30" />
              <Skeleton className="h-10 w-10 rounded-full bg-white/30" />
            </div>
          </div>
          <Skeleton className="h-10 w-full rounded-full mb-3 bg-white/30" />
          <PillRow />
        </div>
      </div>

      {/* Mobile */}
      <div className="block md:hidden">
        <div className="px-4 py-3">
          <div className="grid grid-cols-3 items-center gap-2 mb-3">
            <Skeleton className="h-9 w-9 rounded-md justify-self-start bg-white/30" />
            <Skeleton className="h-11 w-28 rounded-lg justify-self-center bg-white/30" />
            <div className="flex justify-end gap-2 min-w-0">
              <Skeleton className="h-8 w-14 rounded-md bg-white/30" />
              <Skeleton className="h-8 w-8 rounded-full bg-white/30" />
            </div>
          </div>
          <Skeleton className="h-10 w-full rounded-lg mb-3 bg-white/30" />
          <PillRow />
        </div>
      </div>
    </nav>
  )
}
