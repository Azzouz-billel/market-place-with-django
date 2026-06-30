export default function Stars({ rating, className }: { rating: number; className?: string }) {
  const filled = Math.round(rating);
  return (
    <span aria-label={`${rating} out of 5 stars`} className={className}>
      <span aria-hidden="true" className="text-accent">{"★".repeat(filled)}</span>
      <span aria-hidden="true" className="text-muted">{"★".repeat(5 - filled)}</span>
    </span>
  );
}
