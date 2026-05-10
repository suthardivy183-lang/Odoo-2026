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

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const { user }           = useAuth();
  const [trips, setTrips]  = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]  = useState('');

  useEffect(() => {
    api.get('/api/trips')
      .then(res => setTrips(res.data.data.trips))
      .catch(() => setError('Failed to load trips'))
      .finally(() => setLoading(false));
  }, []);

  const upcoming  = trips.filter(t => new Date(t.start_date) > new Date());
  const active    = trips.filter(t => t.status === 'active');
  const totalBudget = trips.reduce((s, t) => s + Number(t.total_budget || 0), 0);
  const recent    = [...trips].sort((a, b) =>
    new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
  ).slice(0, 4);

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
            + New Trip
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          <StatCard label="Total Trips"    value={trips.length} />
          <StatCard label="Upcoming"       value={upcoming.length} />
          <StatCard label="Active"         value={active.length} />
          <StatCard label="Total Budget"   value={`$${totalBudget.toLocaleString()}`} sub="across all trips" />
        </div>

        {/* Recent Trips */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Recent trips</h2>
          {trips.length > 4 && (
            <Link to="/trips" className="text-sm text-indigo-600 hover:underline">View all</Link>
          )}
        </div>

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 h-52 animate-pulse" />
            ))}
          </div>
        )}

        {error && <p className="text-red-500 text-sm">{error}</p>}

        {!loading && trips.length === 0 && (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recent.map(t => <TripCard key={t.id} trip={t} />)}
          </div>
        )}

        {/* Quick links */}
        {!loading && trips.length > 0 && (
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link to="/cities" className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition flex items-center gap-3">
              <span className="text-2xl">🏙️</span>
              <div>
                <p className="font-semibold text-gray-800 text-sm">Explore Cities</p>
                <p className="text-xs text-gray-400">Browse 25 destinations</p>
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
        )}
      </main>
    </div>
  );
}
