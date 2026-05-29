import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/app/admin/')({ component: AdminPage })

function AdminPage() {
  return (
    <div className="admin-overview">
      <header className="admin-overview-head">
        <h1 className="admin-catalog-title">Overview</h1>
        <p className="admin-overview-lead">Operate jobs, moderation, narrator catalog, and costs.</p>
      </header>
      <div className="admin-overview-grid">
        <Link to="/app/admin/jobs" className="admin-overview-card">
          <span className="admin-mono admin-overview-label">Jobs</span>
          <span className="admin-overview-value">Queue</span>
          <span className="admin-overview-detail">Inspect, retry, cancel.</span>
        </Link>
        <Link to="/app/admin/moderation" className="admin-overview-card">
          <span className="admin-mono admin-overview-label">Moderation</span>
          <span className="admin-overview-value">Review</span>
          <span className="admin-overview-detail">Approve or reject generated posts &amp; images.</span>
        </Link>
        <Link to="/app/admin/narrators" className="admin-overview-card">
          <span className="admin-mono admin-overview-label">Narrators</span>
          <span className="admin-overview-value">Catalog</span>
          <span className="admin-overview-detail">Create and edit AI personas.</span>
        </Link>
        <Link to="/app/admin/art-styles" className="admin-overview-card">
          <span className="admin-mono admin-overview-label">Art styles</span>
          <span className="admin-overview-value">Looks</span>
          <span className="admin-overview-detail">Image prompt suffixes and catalog status.</span>
        </Link>
        <Link to="/app/admin/traits" className="admin-overview-card">
          <span className="admin-mono admin-overview-label">Traits</span>
          <span className="admin-overview-value">Fragments</span>
          <span className="admin-overview-detail">Voice fragments for narrator prompts.</span>
        </Link>
        <Link to="/app/admin/costs" className="admin-overview-card">
          <span className="admin-mono admin-overview-label">Costs</span>
          <span className="admin-overview-value">Spend</span>
          <span className="admin-overview-detail">Provider spend drilldowns.</span>
        </Link>
      </div>
    </div>
  )
}
