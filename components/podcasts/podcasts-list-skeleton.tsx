export function PodcastsListSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="border rounded-lg overflow-hidden">
          <div className="aspect-square bg-muted animate-pulse" />
          <div className="p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div className="h-5 bg-muted rounded animate-pulse w-3/4" />
              <div className="h-5 bg-muted rounded animate-pulse w-12" />
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
              <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
            </div>
            <div className="flex gap-2 mt-4">
              <div className="h-9 bg-muted rounded animate-pulse flex-1" />
              <div className="h-9 bg-muted rounded animate-pulse flex-1" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}