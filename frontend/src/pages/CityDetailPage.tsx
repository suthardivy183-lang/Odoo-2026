import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';

interface Activity {
  id: number;
  name: string;
  description?: string;
  type: string;
  duration_hours?: number;
  cost: number;
  image_url?: string;
}

interface City {
  id: number;
  name: string;
  country: string;
  region: string;
  description: string;
  cost_index: number;
  popularity_score: number;
  image_url?: string;
  activities?: Activity[];
}

const TYPE_EMOJI: Record<string, string> = {
  sightseeing: '🏛️', food: '🍽️', adventure: '🧗', culture: '🎭',
  shopping: '🛍️', nightlife: '🌃', nature: '🌳', wellness: '🧘',
};

const ALL_TYPES = ['sightseeing','food','adventure','culture','shopping','nightlife','nature','wellness'] as const;

export default function CityDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [city, setCity]       = useState<City | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr]         = useState('');

  const [type, setType]       = useState<string>('');
  const [maxCost, setMaxCost] = useState<string>('');

  useEffect(() => {
    api.get(`/api/cities/${id}`)
      .then(r => setCity(r.data.data.city))
      .catch(e => setErr(e.response?.data?.message || 'Failed to load city'))
      .finally(() => setLoading(false));
  }, [id]);

  const filtered = useMemo(() => {
    if (!city?.activities) return [];
    return city.activities.filter(a => {
      const matchType = !type || a.type === type;
      const matchCost = !maxCost || Number(a.cost) <= Number(maxCost);
      return matchType && matchCost;
    });
  }, [city, type, maxCost]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-10">
          <div className="bg-white rounded-2xl border border-gray-200 h-48 animate-pulse mb-6" />
          <div className="bg-white rounded-2xl border border-gray-200 h-60 animate-pulse" />
        </div>
      </div>
    );
  }

  if (err || !city) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <p className="text-5xl mb-4">😕</p>
          <h2 className="text-xl font-semibold text-gray-700">{err || 'City not found'}</h2>
          <Link to="/cities" className="inline-block mt-4 text-indigo-600 hover:underline">← Back to cities</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-2">
          <Link to="/cities" className="text-sm text-gray-400 hover:text-gray-600 transition">← Cities</Link>
        </div>

        {/* City header */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6">
          {city.image_url && (
            <div className="h-48 sm:h-60 overflow-hidden">
              <img
                src={city.image_url}
                alt={city.name}
                className="w-full h-full object-cover"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
          )}
          <div className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{city.name}</h1>
                <p className="text-sm text-gray-500">{city.country} · {city.region}</p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full font-medium">
                  ★ {city.popularity_score}/100
                </span>
                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full font-medium">
                  Cost index {Number(city.cost_index).toFixed(1)}
                </span>
              </div>
            </div>
            {city.description && (
              <p className="text-sm text-gray-600 leading-relaxed mt-3">{city.description}</p>
            )}
          </div>
        </div>

        {/* Activity filters */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800">
            Activities <span className="text-gray-400 font-normal text-sm">({city.activities?.length ?? 0})</span>
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <select
            value={type}
            onChange={e => setType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="">All types</option>
            {ALL_TYPES.map(t => (
              <option key={t} value={t}>{TYPE_EMOJI[t]} {t}</option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Max cost ($)"
            value={maxCost}
            min="0"
            onChange={e => setMaxCost(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 w-full sm:w-40"
          />
          {(type || maxCost) && (
            <button
              onClick={() => { setType(''); setMaxCost(''); }}
              className="text-sm text-gray-500 hover:text-gray-700 px-2"
            >
              Clear
            </button>
          )}
        </div>

        {/* Activities list */}
        {filtered.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <p className="text-3xl mb-2">🎫</p>
            <p className="text-sm text-gray-500">No activities match your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.map(a => (
              <div key={a.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-xl">
                    {TYPE_EMOJI[a.type] || '📌'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium text-gray-800 leading-tight">{a.name}</h3>
                      <span className="text-sm font-semibold text-gray-800 whitespace-nowrap">
                        ${Number(a.cost).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 capitalize mt-0.5">
                      {a.type}{a.duration_hours ? ` · ${a.duration_hours}h` : ''}
                    </p>
                    {a.description && (
                      <p className="text-xs text-gray-500 mt-2 line-clamp-2">{a.description}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-gray-400 text-center mt-8">
          To add activities to a trip, open it from <Link to="/trips" className="text-indigo-600 hover:underline">My Trips</Link> and use the itinerary builder.
        </p>
      </main>
    </div>
  );
}
