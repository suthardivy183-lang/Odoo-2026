import { Link } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const FEATURES = [
  {
    icon: '🗺️',
    title: 'Multi-Stop Itineraries',
    desc: 'Build detailed multi-city routes with arrival and departure dates, activities, and notes — all in one place.',
  },
  {
    icon: '🔀',
    title: 'Route Optimization',
    desc: 'Our algorithm minimizes total travel distance across all your stops — saving you time, money, and miles.',
  },
  {
    icon: '⚡',
    title: 'Real-Time Collaboration',
    desc: 'Every budget update, expense, and itinerary change syncs instantly across your entire travel group.',
  },
  {
    icon: '💰',
    title: 'Smart Budget Tracking',
    desc: 'Activities, lodging, reservations, and group expenses all flow into one unified budget dashboard.',
  },
  {
    icon: '✈️',
    title: 'Reservation Management',
    desc: 'Log flights, hotels, trains, and car rentals with booking references — fully connected to your budget.',
  },
  {
    icon: '💸',
    title: 'Group Expense Splitting',
    desc: 'Split costs fairly across your travel group in 40+ currencies. Know exactly who owes who.',
  },
];

const DESTINATIONS = [
  {
    name: 'Santorini',
    country: 'Greece',
    tag: 'Island Escape',
    img: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&q=80',
  },
  {
    name: 'Tokyo',
    country: 'Japan',
    tag: 'Urban Adventure',
    img: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80',
  },
  {
    name: 'Paris',
    country: 'France',
    tag: 'City of Light',
    img: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800&q=80',
  },
  {
    name: 'Bali',
    country: 'Indonesia',
    tag: 'Tropical Paradise',
    img: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80',
  },
];

const STEPS = [
  { num: '01', title: 'Create Your Trip', desc: 'Set your destination, dates, and total budget in seconds.' },
  { num: '02', title: 'Build Your Itinerary', desc: 'Add stops, activities, lodging, and reservations stop by stop.' },
  { num: '03', title: 'Travel Together', desc: 'Invite your group — budgets and expenses sync live for everyone.' },
];

const STATS = [
  { value: '22+', label: 'Core Features' },
  { value: '40+', label: 'Currencies' },
  { value: '0', label: 'External APIs' },
  { value: '∞', label: 'Adventures' },
];

export default function LandingPage() {
  const { user } = useContext(AuthContext);

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">

      {/* ── Navbar ──────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-4"
        style={{ background: 'linear-gradient(to bottom, rgba(2,6,23,0.95), transparent)' }}>
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl font-black tracking-tight">
            <span className="text-white">Travel</span>
            <span className="text-amber-400">oop</span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          {user ? (
            <Link to="/dashboard"
              className="bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold px-5 py-2 rounded-full text-sm transition-all">
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login"
                className="text-slate-300 hover:text-white text-sm font-medium transition px-3 py-2">
                Sign in
              </Link>
              <Link to="/signup"
                className="bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold px-5 py-2 rounded-full text-sm transition-all">
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1920&q=85"
            alt="Travel"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(135deg, rgba(2,6,23,0.85) 0%, rgba(15,23,42,0.70) 50%, rgba(2,6,23,0.90) 100%)' }} />
        </div>

        {/* Hero content */}
        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto pt-20">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm text-amber-300 font-medium mb-8">
            ✈️ Built for the Odoo × Parul University Hackathon 2026
          </div>

          <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6">
            Plan smarter
            <br />
            <span className="text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(135deg, #f59e0b, #fbbf24, #fcd34d)' }}>
              journeys together
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            Multi-city itineraries, real-time group collaboration, smart budget tracking,
            and route optimization — all in one beautiful workspace.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/signup"
              className="w-full sm:w-auto px-8 py-4 rounded-full font-bold text-lg text-slate-900 transition-all transform hover:scale-105 shadow-lg shadow-amber-400/30"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #fbbf24)' }}>
              Start Planning Free
            </Link>
            <Link to="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-full font-bold text-lg text-white border border-white/30 backdrop-blur-sm hover:bg-white/10 transition-all">
              Sign In
            </Link>
          </div>

          {/* Scroll indicator */}
          <div className="mt-20 flex flex-col items-center gap-2 animate-bounce">
            <span className="text-slate-400 text-xs uppercase tracking-widest">Explore</span>
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </section>

      {/* ── Stats bar ───────────────────────────────────────────────── */}
      <section className="relative z-10 -mt-1"
        style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
        <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {STATS.map(s => (
            <div key={s.label}>
              <p className="text-4xl font-black text-slate-900">{s.value}</p>
              <p className="text-slate-800 text-sm font-semibold mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────── */}
      <section className="py-24 px-6"
        style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-amber-400 font-semibold text-sm uppercase tracking-widest mb-3">Everything you need</p>
            <h2 className="text-4xl md:text-5xl font-black text-white">
              Built for real travelers
            </h2>
            <p className="text-slate-400 mt-4 text-lg max-w-xl mx-auto">
              Every feature built from scratch — no external APIs, no shortcuts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(f => (
              <div key={f.title}
                className="group rounded-2xl p-6 border border-white/10 hover:border-amber-400/40 transition-all duration-300 cursor-default"
                style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(12px)' }}>
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="text-white font-bold text-lg mb-2 group-hover:text-amber-400 transition-colors">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Destinations ────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-slate-950">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-amber-400 font-semibold text-sm uppercase tracking-widest mb-3">Explore the world</p>
            <h2 className="text-4xl md:text-5xl font-black text-white">
              Where will you go next?
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {DESTINATIONS.map(d => (
              <div key={d.name} className="group relative rounded-2xl overflow-hidden aspect-[3/4] cursor-pointer">
                <img
                  src={d.img}
                  alt={d.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0"
                  style={{ background: 'linear-gradient(to top, rgba(2,6,23,0.9) 0%, rgba(2,6,23,0.2) 60%, transparent 100%)' }} />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <span className="inline-block text-xs font-semibold text-amber-400 bg-amber-400/15 border border-amber-400/30 rounded-full px-3 py-1 mb-2">
                    {d.tag}
                  </span>
                  <h3 className="text-white font-black text-xl leading-tight">{d.name}</h3>
                  <p className="text-slate-400 text-sm">{d.country}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────── */}
      <section className="py-24 px-6"
        style={{ background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-amber-400 font-semibold text-sm uppercase tracking-widest mb-3">Simple by design</p>
            <h2 className="text-4xl md:text-5xl font-black text-white">
              How it works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((step, i) => (
              <div key={step.num} className="relative text-center md:text-left">
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-px bg-gradient-to-r from-amber-400/50 to-transparent" />
                )}
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl font-black text-2xl text-slate-900 mb-5"
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                  {step.num}
                </div>
                <h3 className="text-white font-bold text-xl mb-3">{step.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Full-width CTA ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1488085061387-422e29b40080?w=1920&q=80"
          alt="Travel the world"
          className="w-full h-96 object-cover"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6"
          style={{ background: 'rgba(2,6,23,0.75)' }}>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
            Your next adventure
            <br />
            <span className="text-amber-400">starts here.</span>
          </h2>
          <p className="text-slate-300 text-lg mb-8 max-w-md">
            Join travelers who plan smarter, spend wiser, and explore together.
          </p>
          <Link to="/signup"
            className="px-10 py-4 rounded-full font-black text-lg text-slate-900 transition-all transform hover:scale-105 shadow-xl shadow-amber-400/40"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #fbbf24)' }}>
            Create Free Account
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="bg-slate-950 border-t border-white/10 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-xl font-black">
              <span className="text-white">Travel</span>
              <span className="text-amber-400">oop</span>
            </span>
            <p className="text-slate-500 text-sm mt-1">Odoo × Parul University Hackathon 2026</p>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <Link to="/login" className="hover:text-white transition">Sign In</Link>
            <Link to="/signup" className="hover:text-white transition">Get Started</Link>
            <a href="https://github.com/suthardivy183-lang/Odoo-2026"
              target="_blank" rel="noreferrer"
              className="hover:text-white transition">GitHub</a>
          </div>
          <p className="text-slate-600 text-xs">
            Built with ☕ by Divy & Shivam · 2 people · 8 hours
          </p>
        </div>
      </footer>

    </div>
  );
}
