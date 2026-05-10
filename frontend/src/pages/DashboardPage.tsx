import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import TripCard from '../components/TripCard';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

interface Trip {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  status: 'draft' | 'active' | 'completed';
  total_budget?: number;
  stop_count: number;
  estimated_cost?: number;
  cover_photo?: string;
  is_public: boolean;
}

interface City {
  id: number;
  name: string;
  country: string;
  region?: string;
  image_url?: string;
  popularity_score: number;
  cost_index: number;
}

function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-5 ${accent ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-200'}`}>
      <p className={`text-sm ${accent ? 'text-indigo-200' : 'text-gray-500'}`}>{label}</p>
      <p className={`text-2xl font-bold mt-1 ${accent ? 'text-white' : 'text-gray-800'}`}>{value}</p>
      {sub && <p className={`text-xs mt-0.5 ${accent ? 'text-indigo-300' : 'text-gray-400'}`}>{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const { user }            = useAuth();
  const [trips, setTrips]   = useState<Trip[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading]       = useState(true);
  const [citiesLoading, setCitiesLoading] = useState(true);
  const [error, setError]   = useState('');

  useEffect(() => {
    api.get('/api/trips')
      .then(res => setTrips(res.data.data.trips))
      .catch(() => setError('Failed to load trips'))
      .finally(() => setLoading(false));

    api.get('/api/cities')
      .then(res => {
        const sorted = [...res.data.data.cities]
          .sort((a: City, b: City) => b.popularity_score - a.popularity_score)
          .slice(0, 4);
        setCities(sorted);
      })
      .catch(() => {})
      .finally(() => setCitiesLoading(false));
  }, []);

  const upcoming    = trips.filter(t => new Date(t.start_date) > new Date());
  const active      = trips.filter(t => t.status === 'active');
  const totalBudget = trips.reduce((s, t) => s + Number(t.total_budget || 0), 0);
  const totalSpend  = trips.reduce((s, t) => s + Number(t.estimated_cost || 0), 0);
  const overBudget  = trips.filter(t => Number(t.estimated_cost || 0) > Number(t.total_budget || 0) && Number(t.total_budget || 0) > 0);
  const budgetPct   = totalBudget > 0 ? Math.min(100, Math.round((totalSpend / totalBudget) * 100)) : 0;

  const recent = [...trips]
    .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Hey, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p className="text-gray-500 text-sm mt-1">Here's what's happening with your trips</p>
          </div>
          <Link
            to="/trips/new"
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
          >
            + Plan New Trip
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Trips"  value={trips.length} />
          <StatCard label="Upcoming"     value={upcoming.length} sub={upcoming.length > 0 ? `next: ${new Date(upcoming[0]?.start_date).toLocaleDateString('en-US',{month:'short',day:'numeric'})}` : undefined} />
          <StatCard label="Active"       value={active.length} />
          <StatCard label="Total Budget" value={`$${totalBudget.toLocaleString()}`} sub="across all trips" accent />
        </div>

        {/* Budget Highlights */}
        {!loading && trips.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
            <h2 className="text-base font-semibold text-gray-800 mb-4">💰 Budget Highlights</h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-5">
              <div>
                <p className="text-xs text-gray-400 mb-1">Total budget set</p>
                <p className="text-xl font-bold text-gray-800">${totalBudget.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Estimated spend</p>
                <p className={`text-xl font-bold ${totalSpend > totalBudget && totalBudget > 0 ? 'text-red-600' : 'text-gray-800'}`}>
                  ${totalSpend.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Remaining</p>
                <p className={`text-xl font-bold ${totalBudget - totalSpend < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {totalBudget > 0 ? `$${Math.abs(totalBudget - totalSpend).toLocaleString()}` : '—'}
                </p>
              </div>
            </div>

            {totalBudget > 0 && (
              <>
                <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                  <span>Budget utilisation</span>
                  <span className={budgetPct >= 100 ? 'text-red-500 font-semibold' : ''}>{budgetPct}%</span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${budgetPct >= 100 ? 'bg-red-500' : budgetPct >= 80 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                    style={{ width: `${budgetPct}%` }}
                  />
                </div>
              </>
            )}

            {overBudget.length > 0 && (
              <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg">
                <p className="text-xs font-semibold text-red-700 mb-1">⚠️ Over-budget trips ({overBudget.length})</p>
                <div className="flex flex-wrap gap-2">
                  {overBudget.map(t => (
                    <Link key={t.id} to={`/trips/${t.id}/budget`} className="text-xs text-red-600 hover:underline">
                      {t.name} →
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recent Trips */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Recent trips</h2>
          {trips.length > 4 && (
            <Link to="/trips" className="text-sm text-indigo-600 hover:underline">View all →</Link>
          )}
        </div>

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 h-52 animate-pulse" />
            ))}
          </div>
        )}

        {error && <p className="text-red-500 text-sm mb-8">{error}</p>}

        {!loading && trips.length === 0 && (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-200 mb-10">
            <p className="text-5xl mb-4">🗺️</p>
            <h3 className="text-lg font-semibold text-gray-700">No trips yet</h3>
            <p className="text-gray-400 text-sm mt-1 mb-5">Start planning your first adventure</p>
            <Link
              to="/trips/new"
              className="inline-block bg-indigo-600 text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-indigo-700 transition"
            >
              Create your first trip
            </Link>
          </div>
        )}

        {!loading && recent.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {recent.map(t => <TripCard key={t.id} trip={t} />)}
          </div>
        )}

        {/* Recommended Destinations */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">🌍 Recommended Destinations</h2>
            <Link to="/cities" className="text-sm text-indigo-600 hover:underline">Browse all →</Link>
          </div>

          {citiesLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[1,2,3,4].map(i => <div key={i} className="bg-white rounded-xl border border-gray-200 h-36 animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {cities.map(city => (
                <Link
                  key={city.id}
                  to={`/cities/${city.id}`}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition group"
                >
                  {city.image_url ? (
                    <div className="h-24 overflow-hidden">
                      <img
                        src={city.image_url}
                        alt={city.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                  ) : (
                    <div className="h-24 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                      <span className="text-3xl">🏙️</span>
                    </div>
                  )}
                  <div className="p-3">
                    <p className="text-sm font-semibold text-gray-800 truncate">{city.name}</p>
                    <p className="text-xs text-gray-400 truncate">{city.country}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">
                        ★ {city.popularity_score}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        Cost {Number(city.cost_index).toFixed(1)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link to="/cities" className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition flex items-center gap-3">
            <span className="text-2xl">🏙️</span>
            <div>
              <p className="font-semibold text-gray-800 text-sm">Explore Cities</p>
              <p className="text-xs text-gray-400">Browse destinations</p>
            </div>
          </Link>
          <Link to="/trips" className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition flex items-center gap-3">
            <span className="text-2xl">📋</span>
            <div>
              <p className="font-semibold text-gray-800 text-sm">All Trips</p>
              <p className="text-xs text-gray-400">{trips.length} trip{trips.length !== 1 ? 's' : ''} planned</p>
            </div>
          </Link>
          <Link to="/trips/new" className="bg-indigo-50 rounded-xl border border-indigo-200 p-5 hover:shadow-md transition flex items-center gap-3">
            <span className="text-2xl">✈️</span>
            <div>
              <p className="font-semibold text-indigo-700 text-sm">Plan a Trip</p>
              <p className="text-xs text-indigo-400">Start from scratch</p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
