/**
 * Skeleton loading placeholders — shown while products are being fetched.
 * Matches the shape of ProductCard exactly.
 */
export default function ProductSkeleton() {
  return (
    <div className="flex flex-col bg-white rounded-2xl overflow-hidden border border-border-soft animate-pulse">
      {/* Image placeholder */}
      <div className="w-full aspect-square bg-cream" />

      {/* Content placeholder */}
      <div className="flex flex-col p-4 gap-3">
        <div className="h-4 bg-border-soft rounded-full w-3/4" />
        <div className="h-3 bg-border-soft rounded-full w-1/2" />
        <div className="h-3 bg-border-soft rounded-full w-1/3 mt-1" />

        <div className="flex items-center justify-between pt-3 border-t border-border-soft mt-1">
          <div className="h-5 bg-border-soft rounded-full w-20" />
          <div className="w-9 h-9 bg-border-soft rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/** Render N skeleton cards in a grid */
export function ProductSkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductSkeleton key={i} />
      ))}
    </div>
  );
}
