import { Navigate, Outlet, useLocation } from 'react-router-dom';

/** API routes require a JWT from POST /api/auth/login (stored as accessToken). */
function clearAuthSession() {
  const AUTH_STORAGE_KEYS = ['accessToken', 'authToken', 'userId', 'email', 'fullName'];
  for (const key of AUTH_STORAGE_KEYS) {
    localStorage.removeItem(key);
  }
}

export function ProtectedRoute() {
  const location = useLocation();
  const hasSession = !!(localStorage.getItem('accessToken') || localStorage.getItem('authToken'));
  if (!hasSession) {
    clearAuthSession();
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}
