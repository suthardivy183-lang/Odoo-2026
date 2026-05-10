import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import TripCard from '../components/TripCard';
import api from '../services/api';

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

type StatusFilter = 'all' | 'draft' | 'active' | 'completed';

const FILTERS: { label: string; value: StatusFilter }[] = [
  { label: 'All',       value: 'all' },
  { label: 'Active',    value: 'active' },
  { label: 'Draft',     value: 'draft' },
  { label: 'Completed', value: 'completed' },
];

export default function TripsPage() {
  const [trips, setTrips]     = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState<StatusFilter>('all');
  const [search, setSearch]   = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    api.get('/api/trips')
      .then(res => setTrips(res.data.data.trips))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await api.delete(`/api/trips/${id}`);
      setTrips(prev => prev.filter(t => t.id !== id));
    } finally {
      setDeleting(null);
    }
  };

  const visible = trips.filter(t => {
    const matchStatus = filter === 'all' || t.status === filter;
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-800">My Trips</h1>
          <Link
            to="/trips/new"
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
          >
            + New Trip
          </Link>
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            placeholder="Search trips…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <div className="flex gap-2">
            {FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-3 py-2 text-xs font-medium rounded-lg border transition ${
                  filter === f.value
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading skeletons */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map(i => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 h-52 animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && visible.length === 0 && (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
            <p className="text-5xl mb-4">🗺️</p>
            <h3 className="text-lg font-semibold text-gray-700">
              {trips.length === 0 ? 'No trips yet' : 'No trips match your search'}
            </h3>
            {trips.length === 0 && (
              <Link
                to="/trips/new"
                className="inline-block mt-4 bg-indigo-600 text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-indigo-700 transition"
              >
                Plan your first trip
              </Link>
            )}
          </div>
        )}

        {/* Grid */}
        {!loading && visible.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visible.map(trip => (
              <div key={trip.id} className="relative group">
                <TripCard trip={trip} />
                <button
                  onClick={() => handleDelete(trip.id, trip.name)}
                  disabled={deleting === trip.id}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded-lg transition"
                >
                  {deleting === trip.id ? '…' : 'Delete'}
                </button>
              </div>
            ))}
          </div>
        )}

        {!loading && (
          <p className="text-xs text-gray-400 mt-6">
            {visible.length} of {trips.length} trip{trips.length !== 1 ? 's' : ''}
          </p>
        )}
      </main>
    </div>
  );
}
