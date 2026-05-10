import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage       from './pages/LoginPage';
import SignupPage      from './pages/SignupPage';
import DashboardPage   from './pages/DashboardPage';
import TripsPage       from './pages/TripsPage';
import CreateTripPage  from './pages/CreateTripPage';
import TripDetailPage  from './pages/TripDetailPage';
import ProtectedRoute  from './components/ProtectedRoute';

const P = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>{children}</ProtectedRoute>
);

export default function App() {
  return (
    <Routes>
      <Route path="/login"     element={<LoginPage />} />
      <Route path="/signup"    element={<SignupPage />} />

      <Route path="/dashboard"  element={<P><DashboardPage /></P>} />
      <Route path="/trips"      element={<P><TripsPage /></P>} />
      <Route path="/trips/new"  element={<P><CreateTripPage /></P>} />
      <Route path="/trips/:id"  element={<P><TripDetailPage /></P>} />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
