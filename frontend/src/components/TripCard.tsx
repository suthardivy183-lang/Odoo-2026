import { Link } from 'react-router-dom';

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

const STATUS_STYLES: Record<Trip['status'], string> = {
  draft:     'bg-gray-100 text-gray-600',
  active:    'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
};

const fmt = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export default function TripCard({ trip }: { trip: Trip }) {
  const nights = Math.round(
    (new Date(trip.end_date).getTime() - new Date(trip.start_date).getTime()) / 86400000
  );

  return (
    <Link to={`/trips/${trip.id}`} className="block group">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition">
        {trip.cover_photo ? (
          <img src={trip.cover_photo} alt={trip.name} className="w-full h-36 object-cover" />
        ) : (
          <div className="w-full h-36 bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
            <span className="text-4xl">✈️</span>
          </div>
        )}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-gray-800 group-hover:text-indigo-600 transition leading-tight">
              {trip.name}
            </h3>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${STATUS_STYLES[trip.status]}`}>
              {trip.status}
            </span>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            {fmt(trip.start_date)} – {fmt(trip.end_date)} · {nights} nights
          </p>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{trip.stop_count} {trip.stop_count === 1 ? 'stop' : 'stops'}</span>
            {trip.total_budget && (
              <span className="font-medium text-gray-700">
                ${Number(trip.total_budget).toLocaleString()} budget
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
