export default function Loading() {
  return (
    <div className="flex flex-col gap-8">
      <div className="h-9 w-48 animate-pulse rounded-base bg-card" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="aspect-square animate-pulse rounded-base bg-card" />
        ))}
      </div>
    </div>
  );
}
