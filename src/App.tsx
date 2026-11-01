import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'

import type { Role } from './api/types'
import { useAuth } from './auth/session'
import { AppShell } from './components/AppShell'
import { ComingSoonPage } from './pages/ComingSoonPage'
import { LoginPage } from './pages/LoginPage'

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
            <Route index element={<ComingSoonPage title="Dashboard" note="Members, revenue and overdue at a glance" />} />
            <Route path="members" element={<ComingSoonPage title="Members" note="Everyone enrolled at your gym" />} />
            <Route path="overdue" element={<ComingSoonPage title="Overdue" note="Members who need a reminder" />} />
          </Route>
          <Route element={<RequireRole roles={['owner']} />}>
            <Route path="settings" element={<ComingSoonPage title="Settings" note="Plans, staff and access rules" />} />
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
