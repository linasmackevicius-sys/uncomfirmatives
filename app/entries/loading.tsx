export default function Loading() {
  return (
    <div className="skeleton-page">
      <div className="skeleton-toolbar" />
      <div className="skeleton-table">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="skeleton-row" />
        ))}
      </div>
    </div>
  );
}
