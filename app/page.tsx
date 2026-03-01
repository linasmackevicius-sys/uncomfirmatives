import { getStats, listEntries } from "@/lib/entries";
import type { EntryGroup } from "@/lib/types";
import { GROUP_LABELS } from "@/lib/types";
import StatusBadge from "@/components/status-badge";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const [stats, recent] = await Promise.all([
    getStats(),
    listEntries({ page: 1, page_size: 5 }),
  ]);

  return (
    <div>
      <h2 className="page-title">Dashboard</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="label">Total Entries</div>
          <div className="value">{stats.total}</div>
        </div>
        <div className="stat-card">
          <div className="label">Open</div>
          <div className="value" style={{ color: "var(--info)" }}>
            {stats.by_status.open ?? 0}
          </div>
        </div>
        <div className="stat-card">
          <div className="label">In Progress</div>
          <div className="value" style={{ color: "var(--warning)" }}>
            {stats.by_status.in_progress ?? 0}
          </div>
        </div>
        <div className="stat-card">
          <div className="label">Resolved</div>
          <div className="value" style={{ color: "var(--success)" }}>
            {stats.by_status.resolved ?? 0}
          </div>
        </div>
        <div className="stat-card">
          <div className="label">Critical</div>
          <div className="value" style={{ color: "var(--error)" }}>
            {stats.by_severity.critical ?? 0}
          </div>
        </div>
        <div className="stat-card">
          <div className="label">Major</div>
          <div className="value" style={{ color: "var(--warning)" }}>
            {stats.by_severity.major ?? 0}
          </div>
        </div>
      </div>

      {stats.by_group && (
        <>
          <h3 className="section-title">BY GROUP</h3>
          <div className="stats-grid">
            {(
              ["incoming_control", "production", "client"] as EntryGroup[]
            ).map((g) => (
              <div className="stat-card" key={g}>
                <div className="label">{GROUP_LABELS[g]}</div>
                <div className="value">{stats.by_group[g] ?? 0}</div>
              </div>
            ))}
          </div>
        </>
      )}

      <h3 className="section-title">RECENT ENTRIES</h3>
      {recent.data.length === 0 ? (
        <div className="empty">
          <p>No entries yet. Go to Entries to create one.</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Group</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Assigned To</th>
              </tr>
            </thead>
            <tbody>
              {recent.data.map((e) => (
                <tr key={e.id}>
                  <td>{e.title}</td>
                  <td>
                    {GROUP_LABELS[e.group as EntryGroup] || e.group}
                  </td>
                  <td>
                    <span className={`severity-${e.severity}`}>
                      {e.severity}
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={e.status} />
                  </td>
                  <td>
                    {e.assigned_to || (
                      <span style={{ color: "var(--text-muted)" }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
