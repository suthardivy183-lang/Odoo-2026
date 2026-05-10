import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><span className="text-gray-500">Loading…</span></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
