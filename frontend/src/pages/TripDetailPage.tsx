import React, { useEffect, useMemo, useState } from 'react';
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

interface LodgingOption {
  id: number;
  city_id: number;
  city_name: string;
  country: string;
  name: string;
  lodging_type: string;
  rating: string | number;
  nightly_rate: string | number;
  currency: string;
  booking_url?: string;
  amenities?: string[];
  image_url?: string;
}

interface TripLodging {
  id: string;
  trip_id: string;
  stop_id: string;
  lodging_option_id?: number | null;
  city_id: number;
  city_name: string;
  country: string;
  name: string;
  lodging_type?: string;
  rating?: string | number;
  nightly_rate: string | number;
  currency: string;
  guests: number;
  status: 'saved' | 'booked';
  check_in: string;
  check_out: string;
  booking_url?: string;
  amenities?: string[];
  image_url?: string;
  notes?: string;
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

const dateInputValue = (d: string) => d.slice(0, 10);

const nightsBetween = (checkIn: string, checkOut: string) => {
  const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.max(1, Math.ceil(ms / (24 * 60 * 60 * 1000)));
};

const TYPE_EMOJI: Record<string, string> = {
  sightseeing: '🏛️', food: '🍽️', adventure: '🧗', culture: '🎭',
  shopping: '🛍️', nightlife: '🌃', nature: '🌳', wellness: '🧘',
};

// ── Distance / travel-time helpers ───────────────────────────────────────────

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function fmtDuration(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

interface TravelInfo {
  km: number;
  driveLabel: string;
  flyLabel: string | null;
  mapsUrl: string;
}

function getTravelInfo(from: Stop, to: Stop): TravelInfo | null {
  const lat1 = Number(from.latitude);
  const lon1 = Number(from.longitude);
  const lat2 = Number(to.latitude);
  const lon2 = Number(to.longitude);
  if (!isFinite(lat1) || !isFinite(lon1) || !isFinite(lat2) || !isFinite(lon2)) return null;

  const km = haversineKm(lat1, lon1, lat2, lon2);
  const driveLabel = fmtDuration(km / 80);
  const flyLabel = km > 200 ? fmtDuration(km / 800 + 1.5) : null;
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${lat1},${lon1}&destination=${lat2},${lon2}`;
  return { km, driveLabel, flyLabel, mapsUrl };
}

function buildRouteExportUrls(stops: Stop[]): { google: string; apple: string } | null {
  const mapped = stops
    .map(s => ({ ...s, lat: Number(s.latitude), lng: Number(s.longitude) }))
    .filter(s => isFinite(s.lat) && isFinite(s.lng));
  if (mapped.length < 2) return null;

  // Google Maps: /dir/City+Country/.../City+Country (up to 10 stops)
  const capped = mapped.slice(0, 10);
  const segments = capped.map(s => encodeURIComponent(`${s.city_name}, ${s.country}`)).join('/');
  const google = `https://www.google.com/maps/dir/${segments}`;

  // Apple Maps: origin → final destination (Apple Maps URLs don't support multi-waypoints)
  const first = mapped[0];
  const last  = mapped[mapped.length - 1];
  const apple = `https://maps.apple.com/?saddr=${encodeURIComponent(`${first.city_name}, ${first.country}`)}&daddr=${encodeURIComponent(`${last.city_name}, ${last.country}`)}&dirflg=d`;

  return { google, apple };
}

function TravelConnector({ info, fromCity, toCity }: { info: TravelInfo; fromCity: string; toCity: string }) {
  const kmLabel = info.km >= 1000
    ? `${(info.km / 1000).toFixed(1)}k km`
    : `${Math.round(info.km)} km`;

  return (
    <div className="flex items-center gap-3 py-1 px-2">
      {/* Left vertical line */}
      <div className="w-8 flex justify-center flex-shrink-0">
        <div className="w-px bg-gray-200 h-full min-h-[40px]" />
      </div>

      {/* Connector pill */}
      <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-500">
        <span className="font-semibold text-gray-700">{kmLabel}</span>
        <span className="text-gray-300">·</span>
        <span>🚗 {info.driveLabel}</span>
        {info.flyLabel && (
          <>
            <span className="text-gray-300">·</span>
            <span>✈️ {info.flyLabel}</span>
          </>
        )}
        <span className="text-gray-300 ml-auto">·</span>
        <a
          href={info.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-500 hover:text-indigo-700 font-medium transition whitespace-nowrap"
          title={`Directions from ${fromCity} to ${toCity}`}
        >
          Open in Maps ↗
        </a>
      </div>
    </div>
  );
}

type MappedStop = Stop & {
  lat: number;
  lng: number;
};

type RouteLeg = {
  fromStopId: string;
  toStopId: string;
  distanceKm: number;
};

const toRadians = (value: number) => (value * Math.PI) / 180;

const stopDistanceKm = (a: MappedStop, b: MappedStop) => {
  const earthRadiusKm = 6371;
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) *
    Math.sin(dLng / 2) ** 2;

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(h));
};

const getMappedStops = (stops: Stop[]) => stops
  .map(stop => ({
    ...stop,
    lat: Number(stop.latitude),
    lng: Number(stop.longitude),
  }))
  .filter((stop): stop is MappedStop => Number.isFinite(stop.lat) && Number.isFinite(stop.lng));

const getRouteStats = (stops: Stop[]) => {
  const mappedStops = getMappedStops(stops);
  const legs: RouteLeg[] = mappedStops.slice(1).map((stop, index) => ({
    fromStopId: mappedStops[index].id,
    toStopId: stop.id,
    distanceKm: stopDistanceKm(mappedStops[index], stop),
  }));

  return {
    mappedStops,
    unmappedCount: stops.length - mappedStops.length,
    totalKm: legs.reduce((total, leg) => total + leg.distanceKm, 0),
    legs,
  };
};

const formatKm = (value: number) => `${Math.round(value).toLocaleString()} km`;

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
  const { mappedStops, totalKm, unmappedCount } = useMemo(() => getRouteStats(stops), [stops]);

  const route: LatLngExpression[] = mappedStops.map(stop => [stop.lat, stop.lng]);
  const center: LatLngExpression = mappedStops.length
    ? [mappedStops[0].lat, mappedStops[0].lng]
    : [20, 0];

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-800">Route map</h2>
          <p className="text-xs text-gray-400">
            {mappedStops.length} mapped stop{mappedStops.length !== 1 ? 's' : ''}
            {unmappedCount > 0 ? `, ${unmappedCount} without coordinates` : ''}
          </p>
        </div>
        {mappedStops.length > 1 && (
          <span className="text-xs font-medium text-indigo-600">{formatKm(totalKm)}</span>
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
  const [lodgingOptions, setLodgingOptions] = useState<LodgingOption[]>([]);
  const [lodgings, setLodgings] = useState<TripLodging[]>([]);
  const [lodgingTotal, setLodgingTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr]     = useState('');

  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [stopModalOpen, setStopModalOpen]         = useState(false);
  const [activityModalStop, setActivityModalStop] = useState<Stop | null>(null);
  const [showExportMenu, setShowExportMenu]       = useState(false);
  const [lodgingModalStop, setLodgingModalStop]   = useState<Stop | null>(null);
  const [savingShare, setSavingShare] = useState(false);
  const [optimizingRoute, setOptimizingRoute] = useState(false);
  const [routeMessage, setRouteMessage] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviting, setInviting] = useState(false);

  const loadAll = async () => {
    if (!id) return;
    try {
      const [tripRes, stopsRes, lodgingRes] = await Promise.all([
        api.get(`/api/trips/${id}`),
        api.get(`/api/trips/${id}/stops`),
        api.get(`/api/trips/${id}/lodgings`),
      ]);
      setTrip(tripRes.data.data.trip);
      const loadedStops: Stop[] = stopsRes.data.data.stops;
      setStops(loadedStops);
      setLodgingOptions(lodgingRes.data.data.options || []);
      setLodgings(lodgingRes.data.data.lodgings || []);
      setLodgingTotal(Number(lodgingRes.data.data.total || 0));

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
    const onLodgingUpdated = (msg: { tripId: string; lodging?: { options: LodgingOption[]; lodgings: TripLodging[]; total: number } }) => {
      if (msg.tripId !== id) return;
      if (msg.lodging) {
        setLodgingOptions(msg.lodging.options || []);
        setLodgings(msg.lodging.lodgings || []);
        setLodgingTotal(Number(msg.lodging.total || 0));
      } else {
        loadAll();
      }
    };

    socket.on('trip:changed', onTripChanged);
    socket.on('trip:updated', onTripChanged);
    socket.on('trip:members:updated', onMembersChanged);
    socket.on('lodging:updated', onLodgingUpdated);

    return () => {
      socket.off('trip:changed', onTripChanged);
      socket.off('trip:updated', onTripChanged);
      socket.off('trip:members:updated', onMembersChanged);
      socket.off('lodging:updated', onLodgingUpdated);
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

  const removeLodging = async (lodgingId: string) => {
    if (!confirm('Remove this lodging from the trip?')) return;
    const res = await api.delete(`/api/trips/${id}/lodgings/${lodgingId}`);
    setLodgingOptions(res.data.data.options || []);
    setLodgings(res.data.data.lodgings || []);
    setLodgingTotal(Number(res.data.data.total || 0));
  };

  const markLodgingBooked = async (lodging: TripLodging) => {
    const res = await api.put(`/api/trips/${id}/lodgings/${lodging.id}`, { status: 'booked' });
    setLodgingOptions(res.data.data.options || []);
    setLodgings(res.data.data.lodgings || []);
    setLodgingTotal(Number(res.data.data.total || 0));
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

  const handleOptimizeRoute = async () => {
    if (!id) return;
    setOptimizingRoute(true);
    setRouteMessage('');
    try {
      const res = await api.post(`/api/trips/${id}/stops/optimize`);
      setStops(res.data.data.stops);
      const saved = Number(res.data.data.saved_km || 0);
      const after = Number(res.data.data.after_km || 0);
      const scheduleMessage = res.data.data.schedule_message;
      setRouteMessage(saved > 0
        ? `Optimized route: saved about ${saved.toLocaleString()} km. New route is ${after.toLocaleString()} km. ${scheduleMessage}`
        : `Route checked. Current order is already near optimal at ${after.toLocaleString()} km. ${scheduleMessage}`
      );
      await loadAll();
    } catch (e: any) {
      setRouteMessage(e.response?.data?.message || 'Failed to optimize route');
    } finally {
      setOptimizingRoute(false);
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
  const routeStats = useMemo(() => getRouteStats(stops), [stops]);
  const lodgingsByStop = useMemo(() => {
    const grouped = new Map<string, TripLodging[]>();
    lodgings.forEach(lodging => {
      grouped.set(lodging.stop_id, [...(grouped.get(lodging.stop_id) || []), lodging]);
    });
    return grouped;
  }, [lodgings]);

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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-5 border-t border-gray-100">
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
            <div>
              <p className="text-xs text-gray-400">Lodging</p>
              <p className="text-lg font-semibold text-gray-800">
                ${lodgingTotal.toLocaleString()}
              </p>
              <p className="text-xs text-gray-400">{lodgings.length} saved stay{lodgings.length !== 1 ? 's' : ''}</p>
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

        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
            <div>
              <h2 className="text-base font-semibold text-gray-800">Lodging</h2>
              <p className="text-xs text-gray-400 mt-1">Discover hotel-style stays for each city stop and save your booking plan.</p>
            </div>
            <div className="text-sm font-semibold text-gray-800">
              ${lodgingTotal.toLocaleString()} <span className="text-xs font-normal text-gray-400">estimated</span>
            </div>
          </div>

          {stops.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">Add stops before choosing lodging.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {stops.map(stop => {
                const saved = lodgingsByStop.get(stop.id) || [];
                const suggestions = lodgingOptions
                  .filter(option => option.city_id === stop.city_id)
                  .slice(0, 2);

                return (
                  <div key={stop.id} className="border border-gray-200 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{stop.city_name}</p>
                        <p className="text-xs text-gray-400">{fmtDate(stop.arrival_date)} to {fmtDate(stop.departure_date)}</p>
                      </div>
                      <button
                        onClick={() => setLodgingModalStop(stop)}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                      >
                        Add
                      </button>
                    </div>

                    {saved.length > 0 ? (
                      <div className="mt-3 space-y-2">
                        {saved.map(lodging => (
                          <div key={lodging.id} className="bg-gray-50 rounded-lg px-3 py-2">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-semibold text-gray-800">{lodging.name}</p>
                                <p className="text-xs text-gray-500">
                                  {nightsBetween(lodging.check_in, lodging.check_out)} night{nightsBetween(lodging.check_in, lodging.check_out) !== 1 ? 's' : ''} · {lodging.currency} {Number(lodging.nightly_rate).toLocaleString()}/night
                                </p>
                              </div>
                              <span className={`text-[11px] font-semibold px-2 py-1 rounded-full ${
                                lodging.status === 'booked' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-50 text-indigo-700'
                              }`}>
                                {lodging.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mt-2 text-xs">
                              {lodging.booking_url && (
                                <a href={lodging.booking_url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">
                                  Booking
                                </a>
                              )}
                              {lodging.status !== 'booked' && (
                                <button onClick={() => markLodgingBooked(lodging)} className="text-emerald-600 hover:underline">
                                  Mark booked
                                </button>
                              )}
                              <button onClick={() => removeLodging(lodging.id)} className="text-gray-400 hover:text-red-500 ml-auto">
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-3 space-y-2">
                        {suggestions.map(option => (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => setLodgingModalStop(stop)}
                            className="w-full text-left bg-gray-50 hover:bg-indigo-50 rounded-lg px-3 py-2 transition"
                          >
                            <p className="text-sm font-semibold text-gray-800">{option.name}</p>
                            <p className="text-xs text-gray-500">
                              {Number(option.rating).toFixed(1)} stars · {option.currency} {Number(option.nightly_rate).toLocaleString()}/night
                            </p>
                          </button>
                        ))}
                        {suggestions.length === 0 && (
                          <p className="text-xs text-gray-400 py-3">No hotel suggestions for this city yet.</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(360px,520px)] gap-6 items-start">
          <section>
        {/* Itinerary header + view toggle */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Itinerary</h2>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden text-xs font-medium">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 transition ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                ☰ List
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-3 py-1.5 transition ${viewMode === 'calendar' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                📅 Calendar
              </button>
            </div>
            {/* Export route dropdown */}
            {(() => {
              const exportUrls = buildRouteExportUrls(stops);
              if (!exportUrls) return null;
              return (
                <div className="relative">
                  <button
                    onClick={() => setShowExportMenu(v => !v)}
                    className="flex items-center gap-1.5 text-xs font-medium text-gray-600 border border-gray-300 hover:border-indigo-400 hover:text-indigo-600 px-3 py-2 rounded-lg transition"
                  >
                    🗺️ Export Route
                  </button>
                  {showExportMenu && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowExportMenu(false)} />
                      <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-xl shadow-lg py-1 w-52 text-sm">
                        <a
                          href={exportUrls.google}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setShowExportMenu(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-gray-50 transition text-gray-700"
                        >
                          <span className="text-base">🌐</span>
                          <div>
                            <p className="font-medium">Google Maps</p>
                            <p className="text-xs text-gray-400">{stops.length} stop{stops.length !== 1 ? 's' : ''} · full route</p>
                          </div>
                        </a>
                        <a
                          href={exportUrls.apple}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setShowExportMenu(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-gray-50 transition text-gray-700"
                        >
                          <span className="text-base">🍎</span>
                          <div>
                            <p className="font-medium">Apple Maps</p>
                            <p className="text-xs text-gray-400">Start → end destination</p>
                          </div>
                        </a>
                      </div>
                    </>
                  )}
                </div>
              );
            })()}

            <button
              onClick={handleOptimizeRoute}
              disabled={optimizingRoute || stops.length < 3 || routeStats.mappedStops.length < stops.length}
              className="border border-indigo-200 text-indigo-700 hover:bg-indigo-50 disabled:text-gray-300 disabled:border-gray-200 disabled:hover:bg-white text-sm font-semibold px-4 py-2 rounded-lg transition"
              title={routeStats.mappedStops.length < stops.length ? 'Every stop needs map coordinates before optimization' : undefined}
            >
              {optimizingRoute ? 'Optimizing...' : 'Optimize route'}
            </button>
            <button
              onClick={() => setStopModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
            >
              + Add Stop
            </button>
          </div>
        </div>

        {routeMessage && (
          <div className={`mb-4 px-3 py-2 rounded-lg border text-sm ${
            routeMessage.startsWith('Failed') || routeMessage.startsWith('Add')
              ? 'bg-red-50 border-red-100 text-red-600'
              : 'bg-indigo-50 border-indigo-100 text-indigo-700'
          }`}>
            {routeMessage}
          </div>
        )}

        {stops.length > 1 && (
          <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
              <p className="text-xs text-gray-400">Route distance</p>
              <p className="text-lg font-semibold text-gray-800">{formatKm(routeStats.totalKm)}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
              <p className="text-xs text-gray-400">Distance legs</p>
              <p className="text-lg font-semibold text-gray-800">{routeStats.legs.length}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
              <p className="text-xs text-gray-400">Optimizer status</p>
              <p className={`text-sm font-semibold mt-1 ${routeStats.unmappedCount ? 'text-amber-600' : 'text-emerald-600'}`}>
                {routeStats.unmappedCount ? `${routeStats.unmappedCount} stop needs coordinates` : 'Ready'}
              </p>
            </div>
          </div>
        )}

        {stops.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 py-16 text-center">
            <p className="text-5xl mb-3">📍</p>
            <h3 className="text-base font-semibold text-gray-700">No stops yet</h3>
            <p className="text-gray-400 text-sm mt-1">Add a city to start building your itinerary</p>
          </div>
        )}

        {/* LIST VIEW — timeline grouped by stop */}
        {viewMode === 'list' && (
          <div>
            {stops.map((stop, idx) => {
              const next = stops[idx + 1];
              const travel = next ? getTravelInfo(stop, next) : null;
              return (
                <React.Fragment key={stop.id}>
                  <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                    <div className="flex items-start gap-4 p-5">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white text-sm font-bold flex items-center justify-center">
                          {idx + 1}
                        </div>
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

                  {travel ? (
                    <TravelConnector info={travel} fromCity={stop.city_name} toCity={next!.city_name} />
                  ) : next ? (
                    <div className="flex items-center py-1 px-2">
                      <div className="w-8 flex justify-center flex-shrink-0">
                        <div className="w-px bg-gray-200 min-h-[40px]" />
                      </div>
                    </div>
                  ) : null}
                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* CALENDAR VIEW — day-by-day planner */}
        {viewMode === 'calendar' && stops.length > 0 && (
          <CalendarView
            trip={trip}
            stops={stops}
            stopActivities={stopActivities}
            onAddActivity={stop => setActivityModalStop(stop)}
            onRemoveActivity={handleRemoveActivity}
          />
        )}

        {/* Sub-navigation to other trip-scoped pages */}
        {stops.length > 0 && (
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3">
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
            <Link to={`/trips/${id}/reservations`} className="bg-white rounded-xl border border-gray-200 p-4 text-center hover:shadow-md transition">
              <p className="text-2xl">🎫</p>
              <p className="text-xs font-medium text-gray-700 mt-1">Reservations</p>
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
          existingStops={stops}
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

      {/* Add Lodging Modal */}
      {lodgingModalStop && (
        <AddLodgingModal
          tripId={id!}
          stop={lodgingModalStop}
          options={lodgingOptions.filter(option => option.city_id === lodgingModalStop.city_id)}
          onClose={() => setLodgingModalStop(null)}
          onAdded={(data) => {
            setLodgingModalStop(null);
            setLodgingOptions(data.options || []);
            setLodgings(data.lodgings || []);
            setLodgingTotal(Number(data.total || 0));
          }}
        />
      )}
    </div>
  );
}

// ── Calendar View ────────────────────────────────────────────────────────────

const STOP_COLORS = [
  'bg-indigo-500', 'bg-emerald-500', 'bg-amber-500',
  'bg-rose-500',   'bg-violet-500',  'bg-cyan-500',
];

function CalendarView({
  trip, stops, stopActivities, onAddActivity, onRemoveActivity,
}: {
  trip: Trip;
  stops: Stop[];
  stopActivities: Record<string, StopActivity[]>;
  onAddActivity: (stop: Stop) => void;
  onRemoveActivity: (stopId: string, actId: string) => void;
}) {
  const days = generateDays(trip.start_date, trip.end_date);

  return (
    <div className="space-y-3">
      {/* Legend */}
      <div className="flex flex-wrap gap-2 mb-2">
        {stops.map((stop, idx) => (
          <span key={stop.id} className="flex items-center gap-1.5 text-xs text-gray-600">
            <span className={`w-2.5 h-2.5 rounded-full ${STOP_COLORS[idx % STOP_COLORS.length]}`} />
            {stop.city_name}
          </span>
        ))}
      </div>

      {days.map(day => {
        const stopIdx = stops.reduce((best, s, idx) => {
          const covers = day >= s.arrival_date.slice(0, 10) && day <= s.departure_date.slice(0, 10);
          return covers ? idx : best;
        }, -1);
        const stop      = stopIdx >= 0 ? stops[stopIdx] : null;
        const color     = stop ? STOP_COLORS[stopIdx % STOP_COLORS.length] : 'bg-gray-300';
        const acts      = stop ? (stopActivities[stop.id] || []).filter(a => a.scheduled_date?.slice(0, 10) === day) : [];

        const [yyyy, mm, dd] = day.split('-').map(Number);
        const dateObj = new Date(yyyy, mm - 1, dd);
        const dayLabel = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
        const dateLabel = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const isToday = day === new Date().toISOString().slice(0, 10);

        return (
          <div key={day} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-stretch">
              {/* Date column */}
              <div className={`w-16 flex-shrink-0 flex flex-col items-center justify-center py-3 ${color} text-white`}>
                <span className="text-[10px] font-medium opacity-80 uppercase">{dayLabel}</span>
                <span className={`text-lg font-bold leading-tight ${isToday ? 'underline underline-offset-2' : ''}`}>
                  {dateLabel.split(' ')[1]}
                </span>
                <span className="text-[10px] opacity-80">{dateLabel.split(' ')[0]}</span>
              </div>

              {/* Content column */}
              <div className="flex-1 p-3">
                {stop ? (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        {stop.city_name}, {stop.country}
                      </span>
                      <button
                        onClick={() => onAddActivity(stop)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition"
                      >
                        + activity
                      </button>
                    </div>

                    {acts.length === 0 && (
                      <p className="text-xs text-gray-300 italic">No activities scheduled</p>
                    )}

                    <div className="space-y-1.5">
                      {acts
                        .slice()
                        .sort((a, b) => (a.scheduled_time || '').localeCompare(b.scheduled_time || ''))
                        .map(a => (
                          <div key={a.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-2.5 py-1.5">
                            <span className="text-base">{TYPE_EMOJI[a.type] || '📌'}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-800 truncate">{a.name}</p>
                              <p className="text-[11px] text-gray-400">
                                {a.scheduled_time || 'No time set'}
                                {a.duration_hours ? ` · ${a.duration_hours}h` : ''}
                              </p>
                            </div>
                            <span className="text-xs font-semibold text-gray-600">
                              ${Number(a.effective_cost).toLocaleString()}
                            </span>
                            <button
                              onClick={() => onRemoveActivity(stop.id, a.id)}
                              className="text-gray-300 hover:text-red-400 text-xs transition"
                            >✕</button>
                          </div>
                        ))}
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-gray-300 italic py-1">No stop assigned for this day</p>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Unscheduled activities summary */}
      {stops.some(s => (stopActivities[s.id] || []).some(a => !a.scheduled_date)) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-2">
          <p className="text-xs font-semibold text-amber-700 mb-2">Unscheduled activities</p>
          <div className="space-y-1">
            {stops.flatMap(stop =>
              (stopActivities[stop.id] || [])
                .filter(a => !a.scheduled_date)
                .map(a => (
                  <div key={a.id} className="flex items-center gap-2 text-xs text-gray-600">
                    <span>{TYPE_EMOJI[a.type] || '📌'}</span>
                    <span className="font-medium">{a.name}</span>
                    <span className="text-gray-400">— {stop.city_name}</span>
                    <span className="ml-auto font-semibold">${Number(a.effective_cost).toLocaleString()}</span>
                  </div>
                ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function generateDays(start: string, end: string): string[] {
  const days: string[] = [];
  const cur = new Date(start.slice(0, 10));
  const last = new Date(end.slice(0, 10));
  while (cur <= last) {
    days.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

// ── Add Stop Modal ───────────────────────────────────────────────────────────

function AddStopModal({
  tripId, tripStart, tripEnd, existingStops, onClose, onCreated,
}: {
  tripId: string;
  tripStart: string;
  tripEnd: string;
  existingStops: Stop[];
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

  // Sorted list of already-booked ranges (YYYY-MM-DD)
  const bookedRanges = useMemo(() => {
    return existingStops
      .map(s => ({
        city: s.city_name,
        country: s.country,
        start: s.arrival_date.slice(0, 10),
        end:   s.departure_date.slice(0, 10),
      }))
      .sort((a, b) => a.start.localeCompare(b.start));
  }, [existingStops]);

  // Conflicts with currently picked range (overlap = aStart <= bEnd && bStart <= aEnd)
  const conflicts = useMemo(() => {
    if (!arrival || !departure || departure < arrival) return [];
    return bookedRanges.filter(r => arrival <= r.end && r.start <= departure);
  }, [arrival, departure, bookedRanges]);

  // Suggest the next free day after the latest existing stop
  const suggestedStart = useMemo(() => {
    if (bookedRanges.length === 0) return minDate;
    const latestEnd = bookedRanges.reduce((m, r) => (r.end > m ? r.end : m), bookedRanges[0].end);
    const next = new Date(latestEnd + 'T00:00:00Z');
    next.setUTCDate(next.getUTCDate() + 1);
    const iso = next.toISOString().slice(0, 10);
    return iso > maxDate ? maxDate : iso;
  }, [bookedRanges, minDate, maxDate]);

  const fmtRange = (start: string, end: string) => {
    const s = new Date(start + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
    const e = new Date(end   + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
    return `${s} → ${e}`;
  };

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
    if (conflicts.length > 0) {
      return setError(`These dates overlap ${conflicts.map(c => c.city).join(', ')}. Pick a different range.`);
    }
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

        {bookedRanges.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide">📅 Already booked</p>
              <button
                type="button"
                onClick={() => {
                  setArrival(suggestedStart);
                  setDeparture(suggestedStart);
                }}
                className="text-[11px] text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Use next free date ({fmtRange(suggestedStart, suggestedStart).split(' → ')[0]})
              </button>
            </div>
            <ul className="flex flex-wrap gap-1.5">
              {bookedRanges.map((r, i) => (
                <li
                  key={`${r.city}-${i}`}
                  className="inline-flex items-center gap-1.5 bg-white border border-amber-200 rounded-md px-2 py-1 text-xs"
                >
                  <span className="font-semibold text-gray-700">{r.city}</span>
                  <span className="text-amber-700">{fmtRange(r.start, r.end)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Arrival *</label>
            <input
              type="date"
              value={arrival}
              min={minDate}
              max={maxDate}
              onChange={e => setArrival(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                conflicts.length > 0
                  ? 'border-red-400 focus:ring-red-300 bg-red-50'
                  : 'border-gray-300 focus:ring-indigo-400'
              }`}
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
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                conflicts.length > 0
                  ? 'border-red-400 focus:ring-red-300 bg-red-50'
                  : 'border-gray-300 focus:ring-indigo-400'
              }`}
            />
          </div>
        </div>

        {conflicts.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 -mt-1">
            <p className="text-xs font-semibold text-red-700 mb-1">⚠️ Date conflict</p>
            <p className="text-xs text-red-600">
              These dates overlap with{' '}
              {conflicts.map((c, i) => (
                <span key={i}>
                  <span className="font-semibold">{c.city}</span> ({fmtRange(c.start, c.end)})
                  {i < conflicts.length - 1 ? ', ' : ''}
                </span>
              ))}
              . Pick a non-overlapping range.
            </p>
          </div>
        )}

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
            disabled={saving || conflicts.length > 0}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white font-semibold py-2 rounded-lg transition"
          >
            {saving ? 'Adding…' : conflicts.length > 0 ? 'Resolve date conflict' : 'Add stop'}
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

function AddLodgingModal({
  tripId, stop, options, onClose, onAdded,
}: {
  tripId: string;
  stop: Stop;
  options: LodgingOption[];
  onClose: () => void;
  onAdded: (data: { options: LodgingOption[]; lodgings: TripLodging[]; total: number }) => void;
}) {
  const [optionId, setOptionId] = useState<number | null>(options[0]?.id ?? null);
  const [customName, setCustomName] = useState('');
  const [checkIn, setCheckIn] = useState(dateInputValue(stop.arrival_date));
  const [checkOut, setCheckOut] = useState(dateInputValue(stop.departure_date));
  const [nightlyRate, setNightlyRate] = useState('');
  const [guests, setGuests] = useState('2');
  const [status, setStatus] = useState<'saved' | 'booked'>('saved');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const selectedOption = options.find(option => option.id === optionId);
  const minDate = dateInputValue(stop.arrival_date);
  const maxDate = dateInputValue(stop.departure_date);
  const effectiveRate = nightlyRate ? Number(nightlyRate) : Number(selectedOption?.nightly_rate || 0);
  const total = effectiveRate * nightsBetween(checkIn, checkOut);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!optionId && !customName.trim()) return setError('Choose a hotel or enter a custom lodging name');
    if (checkOut < checkIn) return setError('Check-out must be on or after check-in');

    setSaving(true);
    setError('');
    try {
      const res = await api.post(`/api/trips/${tripId}/lodgings`, {
        stop_id: stop.id,
        lodging_option_id: optionId || undefined,
        custom_name: optionId ? undefined : customName.trim(),
        check_in: checkIn,
        check_out: checkOut,
        nightly_rate: nightlyRate ? Number(nightlyRate) : undefined,
        currency: selectedOption?.currency || 'USD',
        guests: Number(guests) || 1,
        status,
        notes: notes || undefined,
      });
      onAdded(res.data.data);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to save lodging');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={`Add lodging in ${stop.city_name}`} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">{error}</p>}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hotel suggestions</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {options.map(option => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  setOptionId(option.id);
                  setCustomName('');
                  setNightlyRate('');
                }}
                className={`text-left border rounded-lg px-3 py-2 transition ${
                  optionId === option.id ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <p className="text-sm font-semibold text-gray-800">{option.name}</p>
                <p className="text-xs text-gray-500">
                  {Number(option.rating).toFixed(1)} stars · {option.currency} {Number(option.nightly_rate).toLocaleString()}/night
                </p>
                {option.amenities?.length ? (
                  <p className="text-[11px] text-gray-400 mt-1 truncate">{option.amenities.slice(0, 3).join(', ')}</p>
                ) : null}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Custom lodging</label>
          <input
            value={customName}
            onChange={e => {
              setCustomName(e.target.value);
              setOptionId(null);
            }}
            placeholder="Apartment, hostel, friend's place..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Check-in</label>
            <input type="date" value={checkIn} min={minDate} max={maxDate} onChange={e => setCheckIn(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Check-out</label>
            <input type="date" value={checkOut} min={checkIn || minDate} max={maxDate} onChange={e => setCheckOut(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nightly rate</label>
            <input type="number" min="0" step="0.01" value={nightlyRate} onChange={e => setNightlyRate(e.target.value)} placeholder={selectedOption ? String(Number(selectedOption.nightly_rate)) : '0'} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Guests</label>
            <input type="number" min="1" value={guests} onChange={e => setGuests(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value as 'saved' | 'booked')} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
              <option value="saved">Saved</option>
              <option value="booked">Booked</option>
            </select>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-sm text-gray-600">
          Estimated lodging total: <span className="font-semibold text-gray-800">${total.toLocaleString()}</span>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Confirmation number, room preference, cancellation note..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
        </div>

        <div className="flex gap-2 pt-2">
          <button type="submit" disabled={saving} className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-2 rounded-lg transition">
            {saving ? 'Saving...' : 'Save lodging'}
          </button>
          <button type="button" onClick={onClose} className="px-4 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition">
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}

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
