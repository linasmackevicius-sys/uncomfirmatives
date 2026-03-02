export default function Loading() {
  return (
    <div className="skeleton-page">
      <div className="skeleton-grid">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="skeleton-card" />
        ))}
      </div>
      <div className="skeleton-block skeleton-block--lg" />
    </div>
  );
}
