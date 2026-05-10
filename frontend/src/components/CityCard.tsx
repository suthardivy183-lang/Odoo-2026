import { Link } from 'react-router-dom';

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

const COST_LABEL = (idx: number) => {
  if (idx < 1) return { label: '$', tone: 'text-green-600' };
  if (idx < 1.3) return { label: '$$', tone: 'text-yellow-600' };
  if (idx < 1.7) return { label: '$$$', tone: 'text-orange-600' };
  return { label: '$$$$', tone: 'text-red-600' };
};

export default function CityCard({ city }: { city: City }) {
  const cost = COST_LABEL(Number(city.cost_index));

  return (
    <Link to={`/cities/${city.id}`} className="block group">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition">
        {city.image_url ? (
          <div className="relative h-32 overflow-hidden">
            <img
              src={city.image_url}
              alt={city.name}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        ) : (
          <div className="h-32 bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
            <span className="text-3xl">🏙️</span>
          </div>
        )}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-gray-800 group-hover:text-indigo-600 transition leading-tight">
              {city.name}
            </h3>
            <span className={`text-xs font-bold ${cost.tone}`}>{cost.label}</span>
          </div>
          <p className="text-xs text-gray-500">{city.country} · {city.region}</p>
          {city.popularity_score > 0 && (
            <div className="flex items-center gap-1 mt-2 text-xs text-amber-500">
              <span>★</span>
              <span className="text-gray-500">{city.popularity_score}/100 popular</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
