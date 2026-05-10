import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage       from './pages/LoginPage';
import SignupPage      from './pages/SignupPage';
import DashboardPage   from './pages/DashboardPage';
import TripsPage       from './pages/TripsPage';
import CreateTripPage  from './pages/CreateTripPage';
import TripDetailPage  from './pages/TripDetailPage';
import CitiesPage      from './pages/CitiesPage';
import CityDetailPage  from './pages/CityDetailPage';
import BudgetPage      from './pages/BudgetPage';
import ChecklistPage   from './pages/ChecklistPage';
import NotesPage       from './pages/NotesPage';
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

      <Route path="/cities"     element={<P><CitiesPage /></P>} />
      <Route path="/cities/:id" element={<P><CityDetailPage /></P>} />

      <Route path="/trips/:id/budget"    element={<P><BudgetPage /></P>} />
      <Route path="/trips/:id/checklist" element={<P><ChecklistPage /></P>} />
      <Route path="/trips/:id/notes"     element={<P><NotesPage /></P>} />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
