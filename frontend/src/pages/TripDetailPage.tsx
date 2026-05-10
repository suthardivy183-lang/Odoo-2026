import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import type { LatLngBoundsExpression, LatLngExpression } from 'leaflet';
import Navbar from '../components/Navbar';
import Modal from '../components/Modal';
import api from '../services/api';
import { initSocket, joinTripRoom, leaveTripRoom } from '../services/socket';

interface Trip {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  status: 'draft' | 'active' | 'completed';
  total_budget?: number;
  cover_photo?: string;
  is_public: boolean;
  public_slug?: string | null;
  access_role?: 'owner' | 'editor';
  owner_name?: string;
}

interface Member {
  user_id: string;
  name: string;
  email: string;
  role: 'owner' | 'editor';
}

interface City {
  id: number;
  name: string;
  country: string;
  region?: string;
  cost_index?: number;
  image_url?: string;
}

interface StopActivity {
  id: string;
  activity_id: number;
  name: string;
  type: string;
  duration_hours?: number;
  scheduled_date?: string;
  scheduled_time?: string;
  effective_cost: number;
  base_cost?: number;
  custom_cost?: number;
}

interface Stop {
  id: string;
  city_id: number;
  city_name: string;
  country: string;
  region?: string;
  image_url?: string;
  stop_order: number;
  arrival_date: string;
  departure_date: string;
  notes?: string;
  activity_count: number;
  latitude?: string | number | null;
  longitude?: string | number | null;
}

interface Activity {
  id: number;
  name: string;
  description?: string;
  type: string;
  duration_hours?: number;
  cost: number;
  city_id: number;
  city_name: string;
}

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

const TYPE_EMOJI: Record<string, string> = {
  sightseeing: '🏛️', food: '🍽️', adventure: '🧗', culture: '🎭',
  shopping: '🛍️', nightlife: '🌃', nature: '🌳', wellness: '🧘',
};

type MappedStop = Stop & {
  lat: number;
  lng: number;
};

function FitMapToStops({ stops }: { stops: MappedStop[] }) {
  const map = useMap();

  useEffect(() => {
    if (stops.length === 0) return;
    if (stops.length === 1) {
      map.setView([stops[0].lat, stops[0].lng], 7);
      return;
    }

    const bounds: LatLngBoundsExpression = stops.map(stop => [stop.lat, stop.lng]);
    map.fitBounds(bounds, { padding: [36, 36], maxZoom: 7 });
  }, [map, stops]);

  return null;
}

function ItineraryMap({ stops }: { stops: Stop[] }) {
  const mappedStops = useMemo(
    () => stops
      .map(stop => ({
        ...stop,
        lat: Number(stop.latitude),
        lng: Number(stop.longitude),
      }))
      .filter((stop): stop is MappedStop => Number.isFinite(stop.lat) && Number.isFinite(stop.lng)),
    [stops]
  );

  const route: LatLngExpression[] = mappedStops.map(stop => [stop.lat, stop.lng]);
  const center: LatLngExpression = mappedStops.length
    ? [mappedStops[0].lat, mappedStops[0].lng]
    : [20, 0];

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-800">Route map</h2>
          <p className="text-xs text-gray-400">{mappedStops.length} mapped stop{mappedStops.length !== 1 ? 's' : ''}</p>
        </div>
        {mappedStops.length > 1 && (
          <span className="text-xs font-medium text-indigo-600">Ordered path</span>
        )}
      </div>

      <div className="h-[360px] lg:h-[calc(100vh-13rem)] min-h-[320px]">
        {mappedStops.length > 0 ? (
          <MapContainer
            center={center}
            zoom={mappedStops.length === 1 ? 7 : 3}
            scrollWheelZoom
            className="h-full w-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FitMapToStops stops={mappedStops} />
            {route.length > 1 && (
              <Polyline positions={route} pathOptions={{ color: '#4f46e5', weight: 3, opacity: 0.75 }} />
            )}
            {mappedStops.map((stop, index) => (
              <CircleMarker
                key={stop.id}
                center={[stop.lat, stop.lng]}
                radius={11}
                pathOptions={{ color: '#312e81', fillColor: '#4f46e5', fillOpacity: 0.95, weight: 2 }}
              >
                <Popup>
                  <div className="min-w-40">
                    <p className="font-semibold">{index + 1}. {stop.city_name}</p>
                    <p className="text-xs text-gray-500">{stop.country}</p>
                    <p className="text-xs text-gray-500">{fmtDate(stop.arrival_date)} to {fmtDate(stop.departure_date)}</p>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        ) : (
          <div className="h-full flex items-center justify-center bg-gray-50 text-center px-6">
            <div>
              <p className="text-sm font-semibold text-gray-600">No mapped stops yet</p>
              <p className="text-xs text-gray-400 mt-1">Add a city stop and it will appear here.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [trip,  setTrip]  = useState<Trip | null>(null);
  const [stops, setStops] = useState<Stop[]>([]);
  const [stopActivities, setStopActivities] = useState<Record<string, StopActivity[]>>({});
  const [loading, setLoading] = useState(true);
  const [err, setErr]     = useState('');

  const [stopModalOpen, setStopModalOpen]         = useState(false);
  const [activityModalStop, setActivityModalStop] = useState<Stop | null>(null);
  const [savingShare, setSavingShare] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviting, setInviting] = useState(false);

  const loadAll = async () => {
    if (!id) return;
    try {
      const [tripRes, stopsRes] = await Promise.all([
        api.get(`/api/trips/${id}`),
        api.get(`/api/trips/${id}/stops`),
      ]);
      setTrip(tripRes.data.data.trip);
      const loadedStops: Stop[] = stopsRes.data.data.stops;
      setStops(loadedStops);

      // Fetch activities for each stop in parallel
      const actMap: Record<string, StopActivity[]> = {};
      await Promise.all(loadedStops.map(async s => {
        const r = await api.get(`/api/trips/${id}/stops/${s.id}/activities`);
        actMap[s.id] = r.data.data.activities;
      }));
      setStopActivities(actMap);
    } catch (e: any) {
      setErr(e.response?.data?.message || 'Failed to load trip');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, [id]);

  const loadMembers = async () => {
    if (!id || trip?.access_role !== 'owner') return;
    try {
      const res = await api.get(`/api/trips/${id}/members`);
      setMembers(res.data.data.members);
    } catch {
      setMembers([]);
    }
  };

  useEffect(() => { loadMembers(); }, [id, trip?.access_role]);

  useEffect(() => {
    if (!id) return;
    const socket = initSocket();
    joinTripRoom(id);

    const onTripChanged = (msg: { tripId: string }) => {
      if (msg.tripId === id) loadAll();
    };
    const onMembersChanged = (msg: { tripId: string }) => {
      if (msg.tripId === id) loadMembers();
    };

    socket.on('trip:changed', onTripChanged);
    socket.on('trip:updated', onTripChanged);
    socket.on('trip:members:updated', onMembersChanged);

    return () => {
      socket.off('trip:changed', onTripChanged);
      socket.off('trip:updated', onTripChanged);
      socket.off('trip:members:updated', onMembersChanged);
      leaveTripRoom(id);
    };
  }, [id, trip?.access_role]);

  const handleDeleteStop = async (stopId: string) => {
    if (!confirm('Delete this stop and all its activities?')) return;
    await api.delete(`/api/trips/${id}/stops/${stopId}`);
    setStops(prev => prev.filter(s => s.id !== stopId));
  };

  const handleRemoveActivity = async (stopId: string, activityId: string) => {
    await api.delete(`/api/trips/${id}/stops/${stopId}/activities/${activityId}`);
    setStopActivities(prev => ({
      ...prev,
      [stopId]: prev[stopId].filter(a => a.id !== activityId),
    }));
  };

  const togglePublic = async () => {
    if (!trip) return;
    setSavingShare(true);
    try {
      const res = await api.put(`/api/trips/${id}`, { is_public: !trip.is_public });
      setTrip(res.data.data.trip);
    } finally {
      setSavingShare(false);
    }
  };

  const inviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setInviteError('');
    setInviteMessage('');
    try {
      const res = await api.post(`/api/trips/${id}/members`, { email: inviteEmail });
      setInviteEmail('');
      setInviteMessage(`${res.data.data.member.name} can now collaborate on this trip`);
      await loadMembers();
    } catch (e: any) {
      setInviteError(e.response?.data?.message || 'Failed to invite collaborator');
    } finally {
      setInviting(false);
    }
  };

  const removeMember = async (userId: string) => {
    if (!confirm('Remove this collaborator from the trip?')) return;
    await api.delete(`/api/trips/${id}/members/${userId}`);
    setMembers(prev => prev.filter(m => m.user_id !== userId));
  };

  const copyShareUrl = () => {
    if (!trip?.public_slug) return;
    const url = `${window.location.origin}/share/${trip.public_slug}`;
    navigator.clipboard.writeText(url);
    alert('Share link copied to clipboard');
  };

  // Total estimated cost from all activities
  const totalActivityCost = Object.values(stopActivities)
    .flat()
    .reduce((s, a) => s + Number(a.effective_cost || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-10">
          <div className="bg-white rounded-2xl border border-gray-200 h-40 animate-pulse mb-6" />
          <div className="bg-white rounded-2xl border border-gray-200 h-60 animate-pulse" />
        </div>
      </div>
    );
  }

  if (err || !trip) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <p className="text-5xl mb-4">😕</p>
          <h2 className="text-xl font-semibold text-gray-700">{err || 'Trip not found'}</h2>
          <Link to="/trips" className="inline-block mt-4 text-indigo-600 hover:underline">← Back to trips</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-2">
          <Link to="/trips" className="text-sm text-gray-400 hover:text-gray-600 transition">← My Trips</Link>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{trip.name}</h1>
              {trip.description && <p className="text-gray-500 text-sm mt-1">{trip.description}</p>}
              <p className="text-sm text-gray-500 mt-2">
                {fmtDate(trip.start_date)} → {fmtDate(trip.end_date)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                trip.status === 'active' ? 'bg-green-100 text-green-700'
                : trip.status === 'completed' ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600'
              }`}>{trip.status}</span>
              <button
                onClick={togglePublic}
                disabled={savingShare}
                hidden={trip.access_role !== 'owner'}
                className={`text-xs font-medium px-3 py-1 rounded-full border transition ${
                  trip.is_public
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-300'
                }`}
              >
                {trip.is_public ? '🌐 Public' : '🔒 Private'}
              </button>
            </div>
          </div>

          {trip.access_role === 'editor' && (
            <div className="mb-4 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-lg text-xs text-emerald-700">
              Shared with you by {trip.owner_name || 'the trip owner'}.
            </div>
          )}

          {trip.is_public && trip.public_slug && (
            <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-lg text-xs">
              <span className="text-indigo-700 font-medium truncate">
                /share/{trip.public_slug}
              </span>
              <button onClick={copyShareUrl} className="ml-auto text-indigo-600 hover:underline font-semibold">
                Copy link
              </button>
            </div>
          )}

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-400">Stops</p>
              <p className="text-lg font-semibold text-gray-800">{stops.length}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Activities</p>
              <p className="text-lg font-semibold text-gray-800">
                {Object.values(stopActivities).flat().length}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Activity cost</p>
              <p className="text-lg font-semibold text-gray-800">
                ${totalActivityCost.toLocaleString()}
              </p>
              {trip.total_budget && (
                <p className="text-xs text-gray-400">of ${Number(trip.total_budget).toLocaleString()} budget</p>
              )}
            </div>
          </div>
        </div>

        {trip.access_role === 'owner' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-gray-800">Tripmates</h2>
                <p className="text-xs text-gray-400 mt-1">Invite registered users to view and edit this trip.</p>
              </div>
              <form onSubmit={inviteMember} className="flex gap-2 sm:min-w-80">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => {
                    setInviteEmail(e.target.value);
                    setInviteError('');
                    setInviteMessage('');
                  }}
                  placeholder="friend@example.com"
                  className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <button
                  type="submit"
                  disabled={inviting || !inviteEmail.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-lg text-sm font-semibold transition"
                >
                  {inviting ? 'Inviting...' : 'Invite'}
                </button>
              </form>
            </div>

            {(inviteError || inviteMessage) && (
              <p className={`text-xs mt-3 ${inviteError ? 'text-red-600' : 'text-emerald-600'}`}>
                {inviteError || inviteMessage}
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {members.map(member => (
                <div key={member.user_id} className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg">
                  <div>
                    <p className="text-xs font-semibold text-gray-700">{member.name}</p>
                    <p className="text-[11px] text-gray-400">{member.email} · {member.role}</p>
                  </div>
                  {member.role !== 'owner' && (
                    <button
                      onClick={() => removeMember(member.user_id)}
                      className="text-gray-300 hover:text-red-500 text-xs transition"
                      aria-label="Remove collaborator"
                    >
                      x
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(360px,520px)] gap-6 items-start">
          <section>
        {/* Itinerary */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Itinerary</h2>
          <button
            onClick={() => setStopModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
          >
            + Add Stop
          </button>
        </div>

        {stops.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 py-16 text-center">
            <p className="text-5xl mb-3">📍</p>
            <h3 className="text-base font-semibold text-gray-700">No stops yet</h3>
            <p className="text-gray-400 text-sm mt-1">Add a city to start building your itinerary</p>
          </div>
        )}

        {/* Timeline */}
        <div className="space-y-4">
          {stops.map((stop, idx) => (
            <div key={stop.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="flex items-start gap-4 p-5">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white text-sm font-bold flex items-center justify-center">
                    {idx + 1}
                  </div>
                  {idx < stops.length - 1 && <div className="w-px flex-1 bg-gray-200 my-2" style={{ minHeight: '40px' }} />}
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {stop.city_name}<span className="text-gray-400">, {stop.country}</span>
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {fmtDate(stop.arrival_date)} → {fmtDate(stop.departure_date)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteStop(stop.id)}
                      className="text-xs text-gray-400 hover:text-red-500 transition"
                    >
                      Delete
                    </button>
                  </div>

                  {stop.notes && (
                    <p className="text-xs text-gray-500 mt-2 italic">{stop.notes}</p>
                  )}

                  {/* Activities */}
                  <div className="mt-4 space-y-2">
                    {(stopActivities[stop.id] || []).map(a => (
                      <div key={a.id} className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg">
                        <span className="text-lg">{TYPE_EMOJI[a.type] || '📌'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{a.name}</p>
                          <p className="text-xs text-gray-500">
                            {a.scheduled_date ? `${fmtDate(a.scheduled_date)}${a.scheduled_time ? ' · ' + a.scheduled_time : ''}` : 'Unscheduled'}
                            {a.duration_hours ? ` · ${a.duration_hours}h` : ''}
                          </p>
                        </div>
                        <span className="text-xs font-semibold text-gray-700">
                          ${Number(a.effective_cost).toLocaleString()}
                        </span>
                        <button
                          onClick={() => handleRemoveActivity(stop.id, a.id)}
                          className="text-gray-300 hover:text-red-500 transition text-xs"
                          aria-label="Remove"
                        >
                          ✕
                        </button>
                      </div>
                    ))}

                    <button
                      onClick={() => setActivityModalStop(stop)}
                      className="w-full text-xs text-indigo-600 hover:text-indigo-700 font-medium py-2 border border-dashed border-gray-300 hover:border-indigo-400 rounded-lg transition"
                    >
                      + Add activity
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Sub-navigation to other trip-scoped pages */}
        {stops.length > 0 && (
          <div className="mt-10 grid grid-cols-3 gap-3">
            <Link to={`/trips/${id}/budget`} className="bg-white rounded-xl border border-gray-200 p-4 text-center hover:shadow-md transition">
              <p className="text-2xl">💰</p>
              <p className="text-xs font-medium text-gray-700 mt-1">Budget</p>
            </Link>
            <Link to={`/trips/${id}/checklist`} className="bg-white rounded-xl border border-gray-200 p-4 text-center hover:shadow-md transition">
              <p className="text-2xl">✅</p>
              <p className="text-xs font-medium text-gray-700 mt-1">Checklist</p>
            </Link>
            <Link to={`/trips/${id}/notes`} className="bg-white rounded-xl border border-gray-200 p-4 text-center hover:shadow-md transition">
              <p className="text-2xl">📝</p>
              <p className="text-xs font-medium text-gray-700 mt-1">Notes</p>
            </Link>
          </div>
        )}
          </section>

          <aside className="order-first lg:order-none lg:sticky lg:top-24">
            <ItineraryMap stops={stops} />
          </aside>
        </div>
      </main>

      {/* Add Stop Modal */}
      {stopModalOpen && (
        <AddStopModal
          tripId={id!}
          tripStart={trip.start_date}
          tripEnd={trip.end_date}
          onClose={() => setStopModalOpen(false)}
          onCreated={() => { setStopModalOpen(false); loadAll(); }}
        />
      )}

      {/* Add Activity Modal */}
      {activityModalStop && (
        <AddActivityModal
          tripId={id!}
          stop={activityModalStop}
          onClose={() => setActivityModalStop(null)}
          onAdded={() => { setActivityModalStop(null); loadAll(); }}
        />
      )}
    </div>
  );
}

// ── Add Stop Modal ───────────────────────────────────────────────────────────

function AddStopModal({
  tripId, tripStart, tripEnd, onClose, onCreated,
}: {
  tripId: string;
  tripStart: string;
  tripEnd: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [cities, setCities]   = useState<City[]>([]);
  const [search, setSearch]   = useState('');
  const [cityId, setCityId]   = useState<number | null>(null);
  const [arrival, setArrival] = useState('');
  const [departure, setDeparture] = useState('');
  const [notes, setNotes]     = useState('');
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  // Trip date range as YYYY-MM-DD for date input min/max
  const minDate = tripStart.slice(0, 10);
  const maxDate = tripEnd.slice(0, 10);

  useEffect(() => {
    api.get('/api/cities', { params: { q: search || undefined } })
      .then(r => setCities(r.data.data.cities));
  }, [search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityId)    return setError('Please pick a city');
    if (!arrival)   return setError('Pick an arrival date');
    if (!departure) return setError('Pick a departure date');
    if (departure < arrival) return setError('Departure must be after arrival');
    setSaving(true);
    setError('');
    try {
      await api.post(`/api/trips/${tripId}/stops`, {
        city_id:        cityId,
        arrival_date:   arrival,
        departure_date: departure,
        notes:          notes || undefined,
      });
      onCreated();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to add stop');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Add a stop" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">{error}</p>}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
          <input
            type="text"
            placeholder="Search cities…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 mb-2"
          />
          <div className="max-h-52 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
            {cities.map(c => (
              <button
                type="button"
                key={c.id}
                onClick={() => setCityId(c.id)}
                className={`w-full text-left px-3 py-2 hover:bg-gray-50 transition flex items-center justify-between ${
                  cityId === c.id ? 'bg-indigo-50' : ''
                }`}
              >
                <span className="text-sm">
                  <span className="font-medium text-gray-800">{c.name}</span>
                  <span className="text-gray-400">, {c.country}</span>
                </span>
                {cityId === c.id && <span className="text-indigo-600 text-xs font-semibold">Selected</span>}
              </button>
            ))}
            {cities.length === 0 && <p className="text-sm text-gray-400 text-center py-6">No cities found</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Arrival *</label>
            <input
              type="date"
              value={arrival}
              min={minDate}
              max={maxDate}
              onChange={e => setArrival(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Departure *</label>
            <input
              type="date"
              value={departure}
              min={arrival || minDate}
              max={maxDate}
              onChange={e => setDeparture(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            placeholder="Anything to remember about this stop?"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-2 rounded-lg transition"
          >
            {saving ? 'Adding…' : 'Add stop'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── Add Activity Modal ───────────────────────────────────────────────────────

function AddActivityModal({
  tripId, stop, onClose, onAdded,
}: {
  tripId: string;
  stop: Stop;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activityId, setActivityId] = useState<number | null>(null);
  const [date, setDate]         = useState('');
  const [time, setTime]         = useState('');
  const [customCost, setCustomCost] = useState('');
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  useEffect(() => {
    api.get('/api/activities', { params: { city_id: stop.city_id } })
      .then(r => setActivities(r.data.data.activities));
  }, [stop.city_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityId) return setError('Please pick an activity');
    setSaving(true);
    setError('');
    try {
      await api.post(`/api/trips/${tripId}/stops/${stop.id}/activities`, {
        activity_id:    activityId,
        scheduled_date: date || undefined,
        scheduled_time: time || undefined,
        custom_cost:    customCost ? Number(customCost) : undefined,
      });
      onAdded();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to add activity');
    } finally {
      setSaving(false);
    }
  };

  const selectedActivity = activities.find(a => a.id === activityId);

  return (
    <Modal open onClose={onClose} title={`Add activity to ${stop.city_name}`} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">{error}</p>}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Activity *</label>
          <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
            {activities.map(a => (
              <button
                type="button"
                key={a.id}
                onClick={() => setActivityId(a.id)}
                className={`w-full text-left px-3 py-2.5 hover:bg-gray-50 transition flex items-center gap-3 ${
                  activityId === a.id ? 'bg-indigo-50' : ''
                }`}
              >
                <span className="text-xl">{TYPE_EMOJI[a.type] || '📌'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{a.name}</p>
                  <p className="text-xs text-gray-500">
                    {a.type}{a.duration_hours ? ` · ${a.duration_hours}h` : ''}
                  </p>
                </div>
                <span className="text-xs font-semibold text-gray-700">${Number(a.cost).toLocaleString()}</span>
              </button>
            ))}
            {activities.length === 0 && <p className="text-sm text-gray-400 text-center py-6">No activities for this city</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={date}
              min={stop.arrival_date.slice(0, 10)}
              max={stop.departure_date.slice(0, 10)}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
            <input
              type="time"
              value={time}
              onChange={e => setTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Custom cost <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={customCost}
            onChange={e => setCustomCost(e.target.value)}
            placeholder={selectedActivity ? `Default: $${selectedActivity.cost}` : 'e.g. 25.00'}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={saving || !activityId}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-2 rounded-lg transition"
          >
            {saving ? 'Adding…' : 'Add activity'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}
