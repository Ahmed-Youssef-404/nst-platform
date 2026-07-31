import { cn } from "@/lib/utils"

/**
 * Base skeleton block. Uses a diagonal gold-tinted shimmer sweep (defined in
 * globals.css as `--animate-shimmer-sweep`) instead of a flat pulse — reads
 * as "loading something polished" rather than a placeholder gray box, and
 * the gold tint ties it back to the brand in both light and dark mode.
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "relative overflow-hidden rounded-md bg-muted",
        "before:absolute before:inset-0 before:content-[''] before:bg-gradient-to-r before:from-transparent before:via-[#2e3c49] before:to-transparent before:animate-shimmer-sweep",
        className
      )}
      {...props}
    />
  )
}

/**
 * One or more skeleton text lines. The last line is shortened by default to
 * mimic natural paragraph wrapping instead of a uniform block of bars.
 */
function SkeletonText({
  lines = 1,
  className,
  lastLineWidth = "60%",
}: {
  lines?: number
  className?: string
  lastLineWidth?: string
}) {
  return (
    <div data-slot="skeleton-text" className={cn("flex flex-col gap-2", className)}>
      {Array.from({ length: lines }).map((_, i) => {
        const isLast = i === lines - 1 && lines > 1
        return (
          <Skeleton
            key={i}
            className="h-4 w-full"
            style={isLast ? { width: lastLineWidth } : undefined}
          />
        )
      })}
    </div>
  )
}

/** Circular skeleton for avatars/icons. */
function SkeletonAvatar({
  className,
  size = "size-10",
}: {
  className?: string
  size?: string
}) {
  return (
    <Skeleton data-slot="skeleton-avatar" className={cn("shrink-0 rounded-full", size, className)} />
  )
}

/**
 * A common "card" loading shape: avatar + title/subtitle line, then a couple
 * of body lines. Covers the majority of dashboard card skeletons without
 * hand-rolling the layout on every page.
 */
function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      data-slot="skeleton-card"
      className={cn("rounded-xl border border-border bg-card p-4", className)}
    >
      <div className="flex items-center gap-3">
        <SkeletonAvatar />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
      <SkeletonText lines={2} className="mt-4" />
    </div>
  )
}

/** A single table/list row skeleton — fixed columns of varying width. */
function SkeletonRow({ columns = 4, className }: { columns?: number; className?: string }) {
  return (
    <div data-slot="skeleton-row" className={cn("flex items-center gap-4", className)}>
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("h-4", i === 0 ? "w-1/4" : "flex-1")}
        />
      ))}
    </div>
  )
}

export { Skeleton, SkeletonText, SkeletonAvatar, SkeletonCard, SkeletonRow }