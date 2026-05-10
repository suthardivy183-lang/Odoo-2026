import { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import CityCard from '../components/CityCard';
import api from '../services/api';

interface City {
  id: number;
  name: string;
  country: string;
  region: string;
  cost_index: number;
  popularity_score: number;
  image_url?: string;
  description?: string;
}

export default function CitiesPage() {
  const [cities, setCities] = useState<City[]>([]);
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/cities')
      .then(r => setCities(r.data.data.cities))
      .finally(() => setLoading(false));
  }, []);

  const regions = useMemo(
    () => Array.from(new Set(cities.map(c => c.region))).sort(),
    [cities]
  );

  const visible = cities.filter(c => {
    const matchSearch = !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.country.toLowerCase().includes(search.toLowerCase());
    const matchRegion = !region || c.region === region;
    return matchSearch && matchRegion;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Explore Destinations</h1>
          <p className="text-gray-500 text-sm mt-1">
            Browse {cities.length} cities to add to your trips
          </p>
        </div>

        {/* Search + Region filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            placeholder="Search by city or country…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <select
            value={region}
            onChange={e => setRegion(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
          >
            <option value="">All regions</option>
            {regions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4,5,6,7,8].map(i => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 h-52 animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && visible.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <p className="text-4xl mb-3">🔍</p>
            <h3 className="font-semibold text-gray-700">No cities match your filters</h3>
            <button
              onClick={() => { setSearch(''); setRegion(''); }}
              className="mt-3 text-sm text-indigo-600 hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Grid */}
        {!loading && visible.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {visible.map(c => <CityCard key={c.id} city={c} />)}
            </div>
            <p className="text-xs text-gray-400 mt-6">
              {visible.length} of {cities.length} cities
            </p>
          </>
        )}
      </main>
    </div>
  );
}
