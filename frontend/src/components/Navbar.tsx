import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const location         = useLocation();

  const handleLogout = () => { logout(); navigate('/login'); };

  const navLink = (to: string, label: string) => (
    <Link
      to={to}
      className={`text-sm font-medium transition ${
        location.pathname.startsWith(to)
          ? 'text-indigo-600'
          : 'text-gray-600 hover:text-indigo-600'
      }`}
    >
      {label}
    </Link>
  );

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="text-xl font-bold text-indigo-600">Traveloop</Link>
          <nav className="hidden sm:flex items-center gap-5">
            {navLink('/dashboard', 'Dashboard')}
            {navLink('/trips', 'My Trips')}
            {navLink('/cities', 'Explore')}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-sm text-gray-500">{user?.name}</span>
          <button
            onClick={handleLogout}
            className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
