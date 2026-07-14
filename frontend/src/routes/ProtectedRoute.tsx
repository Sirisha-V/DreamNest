import { Navigate, Outlet } from 'react-router-dom';
import { clearStoredSession, isStoredSessionValid } from '../lib/auth';

const ProtectedRoute = () => {
  const hasValidSession = isStoredSessionValid();
  if (!hasValidSession) {
    clearStoredSession();
  }

  return hasValidSession ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
