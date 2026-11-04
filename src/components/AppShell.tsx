import type { ReactNode } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'

import { useDashboard } from '../api/queries'
import { useAuth } from '../auth/session'
import { LiveEventsProvider } from '../live/LiveEventsProvider'
import { BuildingIcon, CheckinIcon, ClockIcon, DashboardIcon, MembersIcon, SettingsIcon } from './Icons'
import { Logo } from './Logo'

type NavItem = { to: string; label: string; icon: ReactNode; end?: boolean; badge?: boolean }

function navItemsFor(role: string): NavItem[] {
  if (role === 'superadmin') {
    return [{ to: '/admin', label: 'Gyms', icon: <BuildingIcon />, end: true }]
  }

  const items: NavItem[] = [
    { to: '/', label: 'Dashboard', icon: <DashboardIcon />, end: true },
    { to: '/checkins', label: 'Check-ins', icon: <CheckinIcon /> },
    { to: '/members', label: 'Members', icon: <MembersIcon /> },
    { to: '/overdue', label: 'Overdue', icon: <ClockIcon />, badge: true },
  ]
  if (role === 'owner') items.push({ to: '/settings', label: 'Settings', icon: <SettingsIcon /> })
  return items
}

// The overdue badge reuses the dashboard query, so it costs no extra request on most screens.
// The superadmin has no gym, so it is never fetched for them.
function useOverdueCount(enabled: boolean): number {
  const { data } = useDashboard(enabled)
  return data?.overdueMembers ?? 0
}

const navClass = ({ isActive }: { isActive: boolean }) => (isActive ? 'nav active' : 'nav')

// Sidebar on desktop, bottom tab bar on phones, as in the prototype.
export function AppShell() {
  const { me, logout } = useAuth()
  const navigate = useNavigate()
  const hasGym = me !== null && me.role !== 'superadmin'
  const overdueCount = useOverdueCount(hasGym)

  if (!me) return null

  const items = navItemsFor(me.role)

  async function signOut() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <>
      <div className="shell">
        <aside className="side" aria-label="Main navigation">
          <Logo />
          {items.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={navClass}>
              {item.icon}
              {item.label}
              {item.badge && overdueCount > 0 && <span className="cnt">{overdueCount}</span>}
            </NavLink>
          ))}
          <div className="glass gymbox">
            <b>{me.gymName ?? 'Najah Admin'}</b>
            <span className="muted">
              {me.name} · {me.role}
            </span>
            <br />
            <button className="ib" style={{ marginTop: 10 }} onClick={signOut}>
              Sign out
            </button>
          </div>
        </aside>
        <main>
          {/* One live stream per signed-in gym user; the superadmin has no gym to follow. */}
          {hasGym ? (
            <LiveEventsProvider>
              <Outlet />
            </LiveEventsProvider>
          ) : (
            <Outlet />
          )}
        </main>
      </div>

      <nav className="tabbar" aria-label="Main navigation">
        {items.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => (isActive ? 'active' : '')}>
            {item.icon}
            {item.label}
            {item.badge && overdueCount > 0 && <span className="dot" aria-label={`${overdueCount} overdue`} />}
          </NavLink>
        ))}
      </nav>
    </>
  )
}
