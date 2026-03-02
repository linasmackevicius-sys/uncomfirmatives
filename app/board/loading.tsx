export default function Loading() {
  return (
    <div className="skeleton-page">
      <div className="skeleton-columns">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="skeleton-column">
            <div className="skeleton-card" />
            <div className="skeleton-card" />
            <div className="skeleton-card" />
          </div>
        ))}
      </div>
    </div>
  );
}
