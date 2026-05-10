import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const location         = useLocation();
  const [open, setOpen]  = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };
  const closeMenu    = () => setOpen(false);

  const isActive = (to: string) =>
    to === '/dashboard'
      ? location.pathname === '/dashboard'
      : location.pathname.startsWith(to);

  const navLinkClass = (to: string) =>
    `text-sm font-medium transition ${
      isActive(to) ? 'text-indigo-600' : 'text-gray-600 hover:text-indigo-600'
    }`;

  const NAV_ITEMS = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/trips',     label: 'My Trips' },
    { to: '/cities',    label: 'Explore' },
  ];

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="text-xl font-bold text-indigo-600">Traveloop</Link>
          <nav className="hidden sm:flex items-center gap-5">
            {NAV_ITEMS.map(i => <Link key={i.to} to={i.to} className={navLinkClass(i.to)}>{i.label}</Link>)}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-sm text-gray-500">{user?.name}</span>
          <button
            onClick={handleLogout}
            className="hidden sm:block text-sm px-3 py-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition"
          >
            Logout
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setOpen(o => !o)}
            className="sm:hidden p-2 -mr-2 text-gray-600 hover:text-indigo-600 transition"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 6l12 12M6 18L18 6" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu drawer */}
      {open && (
        <div className="sm:hidden border-t border-gray-100 bg-white">
          <nav className="flex flex-col px-4 py-3 space-y-1">
            {NAV_ITEMS.map(i => (
              <Link
                key={i.to}
                to={i.to}
                onClick={closeMenu}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive(i.to) ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {i.label}
              </Link>
            ))}
            <div className="pt-2 mt-2 border-t border-gray-100 flex items-center justify-between">
              <span className="px-3 text-sm text-gray-500 truncate">{user?.name}</span>
              <button
                onClick={() => { handleLogout(); closeMenu(); }}
                className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition"
              >
                Logout
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
