import type { ReactNode } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'

import { useAuth } from '../auth/session'
import { BuildingIcon, ClockIcon, DashboardIcon, MembersIcon, SettingsIcon } from './Icons'
import { Logo } from './Logo'

type NavItem = { to: string; label: string; icon: ReactNode; end?: boolean }

function navItemsFor(role: string): NavItem[] {
  if (role === 'superadmin') {
    return [{ to: '/admin', label: 'Gyms', icon: <BuildingIcon />, end: true }]
  }

  const items: NavItem[] = [
    { to: '/', label: 'Dashboard', icon: <DashboardIcon />, end: true },
    { to: '/members', label: 'Members', icon: <MembersIcon /> },
    { to: '/overdue', label: 'Overdue', icon: <ClockIcon /> },
  ]
  if (role === 'owner') items.push({ to: '/settings', label: 'Settings', icon: <SettingsIcon /> })
  return items
}

const navClass = ({ isActive }: { isActive: boolean }) => (isActive ? 'nav active' : 'nav')

// Sidebar on desktop, bottom tab bar on phones, as in the prototype.
export function AppShell() {
  const { me, logout } = useAuth()
  const navigate = useNavigate()

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
          <Outlet />
        </main>
      </div>

      <nav className="tabbar" aria-label="Main navigation">
        {items.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => (isActive ? 'active' : '')}>
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>
    </>
  )
}
