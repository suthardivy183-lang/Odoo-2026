import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';

function DashboardPlaceholder() {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-bold text-indigo-600">Traveloop</h1>
      <p className="text-gray-600">Welcome, <strong>{user?.name}</strong>! Dashboard coming soon.</p>
      <button onClick={logout} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition">
        Logout
      </button>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login"   element={<LoginPage />} />
      <Route path="/signup"  element={<SignupPage />} />
      <Route path="/dashboard" element={
        <ProtectedRoute><DashboardPlaceholder /></ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
