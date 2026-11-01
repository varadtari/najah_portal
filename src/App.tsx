import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'

import type { Role } from './api/types'
import { useAuth } from './auth/session'
import { AppShell } from './components/AppShell'
import { CheckinsPage } from './pages/CheckinsPage'
import { ComingSoonPage } from './pages/ComingSoonPage'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { MembersPage } from './pages/MembersPage'
import { OverduePage } from './pages/OverduePage'
import { SettingsPage } from './pages/SettingsPage'

// Lets through only signed-in users with one of the given roles; others go to login or to
// their own home. The API enforces the same rules, this only keeps people off dead ends.
function RequireRole({ roles }: { roles: Role[] }) {
  const { me, loading } = useAuth()
  const location = useLocation()

  if (loading) return <div className="loading">Loading…</div>
  if (!me) return <Navigate to="/login" replace state={{ from: location }} />
  if (!roles.includes(me.role)) return <Navigate to={me.role === 'superadmin' ? '/admin' : '/'} replace />

  return <Outlet />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<RequireRole roles={['owner', 'staff', 'superadmin']} />}>
        <Route element={<AppShell />}>
          <Route element={<RequireRole roles={['owner', 'staff']} />}>
            <Route index element={<DashboardPage />} />
            <Route path="members" element={<MembersPage />} />
            <Route path="overdue" element={<OverduePage />} />
            <Route path="checkins" element={<CheckinsPage />} />
          </Route>
          <Route element={<RequireRole roles={['owner']} />}>
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route element={<RequireRole roles={['superadmin']} />}>
            <Route path="admin" element={<ComingSoonPage title="Gyms" note="Onboard gyms and track their devices" />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
