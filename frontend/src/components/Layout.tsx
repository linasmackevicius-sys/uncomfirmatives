import { NavLink, Outlet } from 'react-router-dom'
import { useState } from 'react'
import { GROUP_LABELS, type EntryGroup } from '../types'

const groups: EntryGroup[] = ['incoming_control', 'production', 'client']

export default function Layout() {
  const [entriesOpen, setEntriesOpen] = useState(true)

  return (
    <div className="app">
      <header className="titlebar">
        <h1>UNCOMFIRMATIVES</h1>
      </header>
      <div className="app-body">
        <nav className="sidebar">
          <NavLink to="/" end className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}>
            <span className="sidebar-icon">&#9632;</span>
            Dashboard
          </NavLink>

          <button
            className={`sidebar-item sidebar-section${entriesOpen ? ' open' : ''}`}
            onClick={() => setEntriesOpen(!entriesOpen)}
          >
            <span className="sidebar-chevron">{entriesOpen ? '▾' : '▸'}</span>
            Entries
          </button>

          {entriesOpen && (
            <div className="sidebar-children">
              <NavLink to="/entries" end className={({ isActive }) => `sidebar-item child${isActive ? ' active' : ''}`}>
                All Entries
              </NavLink>
              {groups.map((g) => (
                <NavLink
                  key={g}
                  to={`/entries/${g}`}
                  className={({ isActive }) => `sidebar-item child${isActive ? ' active' : ''}`}
                >
                  {GROUP_LABELS[g]}
                </NavLink>
              ))}
            </div>
          )}
        </nav>
        <main className="main">
          <Outlet />
        </main>
      </div>
      <footer className="statusbar">
        Uncomfirmatives v0.1.0
      </footer>
    </div>
  )
}
