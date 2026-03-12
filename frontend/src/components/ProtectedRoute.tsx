import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { homePathByRole, loginPathFromPath } from '../lib/constants';
import type { Role } from '../types';
import { LoadingView } from './LoadingView';

export function ProtectedRoute({ roles }: { roles?: Role[] }) {
  const { loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingView text="正在恢复登录状态..." />;
  }

  if (!user) {
    return <Navigate to={loginPathFromPath(location.pathname)} replace state={{ from: location }} />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={homePathByRole[user.role]} replace />;
  }

  return <Outlet />;
}
