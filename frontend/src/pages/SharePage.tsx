import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

interface SharedActivity {
  id: string;
  activity_id: number;
  name: string;
  type: string;
  duration_hours?: number;
  scheduled_date?: string;
  scheduled_time?: string;
  effective_cost: number;
}

interface SharedStop {
  id: string;
  stop_order: number;
  city_id: number;
  city_name: string;
  country: string;
  region?: string;
  image_url?: string;
  arrival_date: string;
  departure_date: string;
  notes?: string;
  activities: SharedActivity[];
}

interface SharedTrip {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  cover_photo?: string;
  total_budget?: number;
  status: 'draft' | 'active' | 'completed';
  public_slug: string;
  owner_name: string;
  stops: SharedStop[];
}

const TYPE_EMOJI: Record<string, string> = {
  sightseeing: '🏛️', food: '🍽️', adventure: '🧗', culture: '🎭',
  shopping: '🛍️', nightlife: '🌃', nature: '🌳', wellness: '🧘',
};

const fmt = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

export default function SharePage() {
  const { slug }         = useParams<{ slug: string }>();
  const { user }         = useAuth();
  const navigate         = useNavigate();

  const [trip, setTrip]   = useState<SharedTrip | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const [copying, setCopying]   = useState(false);
  const [copyDone, setCopyDone] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);

  useEffect(() => {
    api.get(`/api/public/trips/${slug}`)
      .then(r => setTrip(r.data.data.trip))
      .catch(e => setError(e.response?.data?.message || 'Trip not found'))
      .finally(() => setLoading(false));
  }, [slug]);

  const pageUrl = window.location.href;

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(pageUrl);
    setUrlCopied(true);
    setTimeout(() => setUrlCopied(false), 2000);
  };

  const handleCopyTrip = async () => {
    if (!user) { navigate(`/signup?redirect=${encodeURIComponent(window.location.pathname)}`); return; }
    setCopying(true);
    try {
      const res = await api.post(`/api/public/trips/${slug}/copy`);
      setCopyDone(true);
      setTimeout(() => navigate(`/trips/${res.data.data.trip.id}`), 1200);
    } catch {
      setCopying(false);
    }
  };

  const shareWhatsApp = () => {
    const text = trip ? `Check out this trip: ${trip.name} 🌍\n${pageUrl}` : pageUrl;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const shareTwitter = () => {
    const text = trip ? `Planning a trip: ${trip.name} via @Traveloop` : 'Check out this trip!';
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(pageUrl)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <span className="text-gray-400 text-sm">Loading trip…</span>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 text-center">
        <p className="text-6xl mb-4">😕</p>
        <h2 className="text-xl font-semibold text-gray-700">{error || 'Trip not found'}</h2>
        <p className="text-sm text-gray-500 mt-2">The link may be broken or the trip is no longer public.</p>
        <Link to="/" className="mt-5 text-indigo-600 hover:underline text-sm">Go to Traveloop</Link>
      </div>
    );
  }

  const totalActivityCost = trip.stops
    .flatMap(s => s.activities)
    .reduce((s, a) => s + Number(a.effective_cost || 0), 0);

  const totalActivities = trip.stops.reduce((s, x) => s + x.activities.length, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-indigo-600">Traveloop</Link>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-xs text-gray-400">Public itinerary · view only</span>
            {user ? (
              <Link to="/dashboard" className="text-sm text-indigo-600 hover:underline font-medium">My Trips →</Link>
            ) : (
              <Link to="/signup" className="text-sm px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium">
                Sign up free
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">

        {/* Social share bar */}
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <span className="text-xs text-gray-500 font-medium mr-1">Share:</span>

          <button
            onClick={handleCopyUrl}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition text-gray-700"
          >
            {urlCopied ? '✓ Copied!' : '🔗 Copy link'}
          </button>

          <button
            onClick={shareWhatsApp}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-green-300 rounded-lg hover:bg-green-50 transition text-green-700"
          >
            💬 WhatsApp
          </button>

          <button
            onClick={shareTwitter}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-sky-300 rounded-lg hover:bg-sky-50 transition text-sky-700"
          >
            𝕏 Twitter
          </button>

          <div className="ml-auto">
            <button
              onClick={handleCopyTrip}
              disabled={copying || copyDone}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
                copyDone
                  ? 'bg-green-600 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-60'
              }`}
            >
              {copyDone ? '✓ Copied to your trips!' : copying ? 'Copying…' : '📋 Copy this trip'}
            </button>
          </div>
        </div>

        {!user && (
          <div className="mb-5 px-4 py-3 bg-indigo-50 border border-indigo-100 rounded-xl text-sm text-indigo-700 flex items-center justify-between gap-3">
            <span>Want to plan a similar trip? Copy this itinerary to your account.</span>
            <Link to={`/signup?redirect=${encodeURIComponent(window.location.pathname)}`} className="font-semibold underline whitespace-nowrap">
              Sign up free →
            </Link>
          </div>
        )}

        {/* Trip header card */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6">
          {trip.cover_photo && (
            <div className="h-48 sm:h-60 overflow-hidden">
              <img src={trip.cover_photo} alt={trip.name} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="p-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">{trip.name}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {fmt(trip.start_date)} → {fmt(trip.end_date)} · by <strong>{trip.owner_name}</strong>
            </p>
            {trip.description && (
              <p className="text-sm text-gray-600 leading-relaxed mt-4">{trip.description}</p>
            )}

            <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-gray-100 text-center">
              <div>
                <p className="text-xs text-gray-400">Stops</p>
                <p className="text-lg font-semibold text-gray-800">{trip.stops.length}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Activities</p>
                <p className="text-lg font-semibold text-gray-800">{totalActivities}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Activity cost</p>
                <p className="text-lg font-semibold text-gray-800">${totalActivityCost.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Itinerary */}
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Itinerary</h2>

        {trip.stops.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 py-12 text-center">
            <p className="text-3xl mb-2">📍</p>
            <p className="text-sm text-gray-500">No stops planned yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {trip.stops.map((stop, idx) => (
              <article key={stop.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="flex items-start gap-4 p-5">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white text-sm font-bold flex items-center justify-center">
                      {idx + 1}
                    </div>
                    {idx < trip.stops.length - 1 && (
                      <div className="w-px flex-1 bg-gray-200 my-2" style={{ minHeight: '40px' }} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800">
                      {stop.city_name}<span className="text-gray-400">, {stop.country}</span>
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {fmt(stop.arrival_date)} → {fmt(stop.departure_date)}
                    </p>
                    {stop.notes && (
                      <p className="text-xs text-gray-500 italic mt-2">{stop.notes}</p>
                    )}

                    {stop.activities.length > 0 && (
                      <ul className="mt-4 space-y-2">
                        {stop.activities.map(a => (
                          <li key={a.id} className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg">
                            <span className="text-lg">{TYPE_EMOJI[a.type] || '📌'}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">{a.name}</p>
                              <p className="text-xs text-gray-500">
                                {a.scheduled_date
                                  ? `${fmt(a.scheduled_date)}${a.scheduled_time ? ' · ' + a.scheduled_time : ''}`
                                  : 'Unscheduled'}
                                {a.duration_hours ? ` · ${a.duration_hours}h` : ''}
                              </p>
                            </div>
                            <span className="text-xs font-semibold text-gray-700">
                              ${Number(a.effective_cost).toLocaleString()}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* CTA footer */}
        <div className="mt-10 bg-indigo-600 rounded-2xl p-6 text-center text-white">
          <p className="text-lg font-bold mb-1">Inspired by this trip?</p>
          <p className="text-sm text-indigo-200 mb-4">Copy it to your account and make it your own.</p>
          <button
            onClick={handleCopyTrip}
            disabled={copying || copyDone}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-white text-indigo-700 font-semibold rounded-xl hover:bg-indigo-50 transition disabled:opacity-60"
          >
            {copyDone ? '✓ Trip copied!' : copying ? 'Copying…' : '📋 Copy this trip'}
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Plan your own trip on{' '}
          <Link to="/signup" className="text-indigo-600 hover:underline font-medium">Traveloop</Link>
        </p>
      </main>
    </div>
  );
}
