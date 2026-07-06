import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  const token = localStorage.getItem('dreamnest_token');
  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
