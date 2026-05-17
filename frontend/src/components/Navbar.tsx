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
    `text-sm font-medium transition px-3 py-1.5 rounded-full ${
      isActive(to)
        ? 'bg-brand-50 text-brand-700'
        : 'text-stone-600 hover:text-brand-700 hover:bg-stone-100'
    }`;

  const NAV_ITEMS = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/trips',     label: 'My Trips' },
    { to: '/cities',    label: 'Explore' },
  ];

  const initials = (user?.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-white/75 border-b border-stone-200/80">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-7">
          <Link to="/dashboard" className="flex items-center gap-2 group">
            <span className="w-8 h-8 rounded-xl bg-sunset-gradient flex items-center justify-center text-white text-base shadow-glow-sunset group-hover:scale-105 transition">
              ✈
            </span>
            <span className="text-xl font-bold tracking-tight text-gradient-ocean">Traveloop</span>
          </Link>
          <nav className="hidden sm:flex items-center gap-1.5">
            {NAV_ITEMS.map(i => <Link key={i.to} to={i.to} className={navLinkClass(i.to)}>{i.label}</Link>)}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/profile"
            className="hidden sm:flex items-center gap-2.5 hover:opacity-80 transition group"
            title="My Profile"
          >
            <div className="w-9 h-9 rounded-full bg-ocean-gradient flex items-center justify-center text-white text-xs font-bold shadow-glow-brand ring-2 ring-white">
              {initials}
            </div>
            <span className="text-sm font-medium text-stone-700">{user?.name}</span>
          </Link>
          <button
            onClick={handleLogout}
            className="hidden sm:block text-sm px-3.5 py-1.5 border border-stone-300 rounded-full text-stone-600 hover:bg-stone-50 hover:border-stone-400 transition"
          >
            Logout
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setOpen(o => !o)}
            className="sm:hidden p-2 -mr-2 text-stone-600 hover:text-brand-600 transition"
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
        <div className="sm:hidden border-t border-stone-200 bg-white/95 backdrop-blur">
          <nav className="flex flex-col px-4 py-3 space-y-1">
            {NAV_ITEMS.map(i => (
              <Link
                key={i.to}
                to={i.to}
                onClick={closeMenu}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive(i.to) ? 'bg-brand-50 text-brand-700' : 'text-stone-700 hover:bg-stone-50'
                }`}
              >
                {i.label}
              </Link>
            ))}
            <Link
              to="/profile"
              onClick={closeMenu}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                isActive('/profile') ? 'bg-brand-50 text-brand-700' : 'text-stone-700 hover:bg-stone-50'
              }`}
            >
              Profile
            </Link>
            <div className="pt-2 mt-2 border-t border-stone-100 flex items-center justify-between">
              <span className="px-3 text-sm text-stone-500 truncate">{user?.name}</span>
              <button
                onClick={() => { handleLogout(); closeMenu(); }}
                className="text-sm px-3 py-1.5 border border-stone-300 rounded-lg text-stone-600 hover:bg-stone-50 transition"
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
