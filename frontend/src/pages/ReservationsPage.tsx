import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';

type ReservationType = 'flight' | 'hotel' | 'train' | 'car_rental' | 'other';

interface Reservation {
  id: string;
  type: ReservationType;
  title: string;
  provider?: string;
  booking_ref?: string;
  from_location?: string;
  to_location?: string;
  start_date?: string;
  start_time?: string;
  end_date?: string;
  end_time?: string;
  cost?: number;
  notes?: string;
  created_by_name?: string;
}

const TYPE_META: Record<ReservationType, { emoji: string; label: string; color: string }> = {
  flight:     { emoji: '✈️',  label: 'Flight',     color: 'bg-sky-50 border-sky-200 text-sky-700' },
  hotel:      { emoji: '🏨',  label: 'Hotel',      color: 'bg-amber-50 border-amber-200 text-amber-700' },
  train:      { emoji: '🚆',  label: 'Train',      color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  car_rental: { emoji: '🚗',  label: 'Car Rental', color: 'bg-violet-50 border-violet-200 text-violet-700' },
  other:      { emoji: '📋',  label: 'Other',      color: 'bg-gray-50 border-gray-200 text-gray-600' },
};

const ALL_TABS: Array<'all' | ReservationType> = ['all', 'flight', 'hotel', 'train', 'car_rental', 'other'];

const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

const fmtTime = (t?: string) => {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hr = Number(h);
  return `${hr % 12 || 12}:${m} ${hr < 12 ? 'AM' : 'PM'}`;
};

// ── Empty form ────────────────────────────────────────────────────────────────

const emptyForm = () => ({
  type: 'flight' as ReservationType,
  title: '',
  provider: '',
  booking_ref: '',
  from_location: '',
  to_location: '',
  start_date: '',
  start_time: '',
  end_date: '',
  end_time: '',
  cost: '',
  notes: '',
});

// ── Reservation modal ─────────────────────────────────────────────────────────

function ReservationModal({
  tripId,
  initial,
  onClose,
  onSaved,
}: {
  tripId: string;
  initial?: Reservation;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState(() =>
    initial
      ? {
          type: initial.type,
          title: initial.title,
          provider: initial.provider ?? '',
          booking_ref: initial.booking_ref ?? '',
          from_location: initial.from_location ?? '',
          to_location: initial.to_location ?? '',
          start_date: initial.start_date?.slice(0, 10) ?? '',
          start_time: initial.start_time?.slice(0, 5) ?? '',
          end_date: initial.end_date?.slice(0, 10) ?? '',
          end_time: initial.end_time?.slice(0, 5) ?? '',
          cost: initial.cost != null ? String(initial.cost) : '',
          notes: initial.notes ?? '',
        }
      : emptyForm()
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState('');

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const isTransit = form.type === 'flight' || form.type === 'train';
  const isStay    = form.type === 'hotel' || form.type === 'car_rental';

  const providerLabel   = form.type === 'flight' ? 'Airline' : form.type === 'train' ? 'Operator' : form.type === 'hotel' ? 'Hotel name' : form.type === 'car_rental' ? 'Car company' : 'Provider';
  const fromLabel       = isTransit ? 'Departure city / airport' : isStay ? 'Address / location' : 'From';
  const toLabel         = isTransit ? 'Arrival city / airport' : 'To';
  const startDateLabel  = isStay ? 'Check-in date' : 'Departure date';
  const endDateLabel    = isStay ? 'Check-out date' : 'Arrival date';

  const save = async () => {
    if (!form.title.trim()) { setErr('Title is required'); return; }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        type: form.type,
        title: form.title.trim(),
      };
      if (form.provider)      payload.provider      = form.provider;
      if (form.booking_ref)   payload.booking_ref   = form.booking_ref;
      if (form.from_location) payload.from_location = form.from_location;
      if (form.to_location)   payload.to_location   = form.to_location;
      if (form.start_date)    payload.start_date    = form.start_date;
      if (form.start_time)    payload.start_time    = form.start_time;
      if (form.end_date)      payload.end_date      = form.end_date;
      if (form.end_time)      payload.end_time      = form.end_time;
      if (form.cost)          payload.cost          = Number(form.cost);
      if (form.notes)         payload.notes         = form.notes;

      if (initial) {
        await api.put(`/api/trips/${tripId}/reservations/${initial.id}`, payload);
      } else {
        await api.post(`/api/trips/${tripId}/reservations`, payload);
      }
      onSaved();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setErr(msg || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">{initial ? 'Edit reservation' : 'Add reservation'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <div className="p-6 space-y-4">
          {err && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{err}</p>}

          {/* Type picker */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Type</label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(TYPE_META) as ReservationType[]).map(t => (
                <button
                  key={t}
                  onClick={() => set('type', t)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                    form.type === t ? TYPE_META[t].color + ' border-current' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {TYPE_META[t].emoji} {TYPE_META[t].label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder={form.type === 'flight' ? 'e.g. Flight to Tokyo' : form.type === 'hotel' ? 'e.g. Hotel Paris Hilton' : 'Reservation title'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {/* Provider + Booking ref */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{providerLabel}</label>
              <input
                value={form.provider}
                onChange={e => set('provider', e.target.value)}
                placeholder={form.type === 'flight' ? 'e.g. Air India' : ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Booking ref / PNR</label>
              <input
                value={form.booking_ref}
                onChange={e => set('booking_ref', e.target.value)}
                placeholder="e.g. XY1234"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          </div>

          {/* From / To */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{fromLabel}</label>
              <input
                value={form.from_location}
                onChange={e => set('from_location', e.target.value)}
                placeholder={isTransit ? 'e.g. BOM / Mumbai' : ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            {(isTransit || form.type === 'other') && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{toLabel}</label>
                <input
                  value={form.to_location}
                  onChange={e => set('to_location', e.target.value)}
                  placeholder={isTransit ? 'e.g. NRT / Tokyo' : ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
            )}
          </div>

          {/* Dates + times */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{startDateLabel}</label>
              <input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            {isTransit && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Departure time</label>
                <input type="time" value={form.start_time} onChange={e => set('start_time', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{endDateLabel}</label>
              <input type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            {isTransit && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Arrival time</label>
                <input type="time" value={form.end_time} onChange={e => set('end_time', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
            )}
          </div>

          {/* Cost + notes */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Cost (USD)</label>
              <input type="number" min="0" value={form.cost} onChange={e => set('cost', e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
              placeholder="Seat number, meal preference, special requests…"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 pb-5">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition">Cancel</button>
          <button
            onClick={save}
            disabled={saving}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition"
          >
            {saving ? 'Saving…' : initial ? 'Save changes' : 'Add reservation'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ReservationsPage() {
  const { id } = useParams<{ id: string }>();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading]           = useState(true);
  const [tab, setTab]                   = useState<'all' | ReservationType>('all');
  const [modalOpen, setModalOpen]       = useState(false);
  const [editing, setEditing]           = useState<Reservation | undefined>();
  const [tripName, setTripName]         = useState('');

  const load = () => {
    api.get(`/api/trips/${id}/reservations`)
      .then(r => setReservations(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    api.get(`/api/trips/${id}`).then(r => setTripName(r.data.data.trip?.name ?? '')).catch(() => {});
  }, [id]);

  const handleDelete = async (resId: string) => {
    if (!confirm('Delete this reservation?')) return;
    await api.delete(`/api/trips/${id}/reservations/${resId}`);
    setReservations(prev => prev.filter(r => r.id !== resId));
  };

  const filtered = tab === 'all' ? reservations : reservations.filter(r => r.type === tab);

  const totalCost = reservations.reduce((s, r) => s + (r.cost ? Number(r.cost) : 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-10">
          <div className="bg-white rounded-2xl border border-gray-200 h-48 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-2">
          <Link to={`/trips/${id}`} className="text-sm text-gray-400 hover:text-gray-600 transition">
            ← {tripName || 'Trip'}
          </Link>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Reservations</h1>
            {reservations.length > 0 && totalCost > 0 && (
              <p className="text-sm text-gray-500 mt-0.5">
                {reservations.length} reservation{reservations.length !== 1 ? 's' : ''} · Total ${totalCost.toLocaleString()}
              </p>
            )}
          </div>
          <button
            onClick={() => { setEditing(undefined); setModalOpen(true); }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
          >
            + Add
          </button>
        </div>

        {/* Tab filter */}
        <div className="flex gap-1.5 flex-wrap mb-5">
          {ALL_TABS.map(t => {
            const count = t === 'all' ? reservations.length : reservations.filter(r => r.type === t).length;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                  tab === t
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {t === 'all' ? 'All' : TYPE_META[t as ReservationType].emoji + ' ' + TYPE_META[t as ReservationType].label}
                {count > 0 && <span className="ml-1 opacity-70">({count})</span>}
              </button>
            );
          })}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 py-16 text-center">
            <p className="text-4xl mb-3">🎫</p>
            <p className="font-semibold text-gray-700">No reservations yet</p>
            <p className="text-sm text-gray-400 mt-1">Add flights, hotels, trains and more</p>
            <button
              onClick={() => { setEditing(undefined); setModalOpen(true); }}
              className="mt-4 text-sm text-indigo-600 hover:underline"
            >
              + Add reservation
            </button>
          </div>
        )}

        {/* Cards */}
        <div className="space-y-3">
          {filtered.map(r => {
            const meta = TYPE_META[r.type];
            return (
              <div key={r.id} className="bg-white rounded-2xl border border-gray-200 p-4 hover:shadow-md transition">
                <div className="flex items-start gap-3">
                  {/* Type badge */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-xl border flex items-center justify-center text-xl ${meta.color}`}>
                    {meta.emoji}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-gray-800 leading-snug">{r.title}</p>
                        {r.provider && <p className="text-xs text-gray-500">{r.provider}</p>}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {r.cost != null && (
                          <span className="text-sm font-semibold text-gray-700">${Number(r.cost).toLocaleString()}</span>
                        )}
                        <button onClick={() => { setEditing(r); setModalOpen(true); }}
                          className="text-xs text-gray-400 hover:text-indigo-600 transition">Edit</button>
                        <button onClick={() => handleDelete(r.id)}
                          className="text-xs text-gray-400 hover:text-red-500 transition">Delete</button>
                      </div>
                    </div>

                    {/* Route row */}
                    {(r.from_location || r.to_location) && (
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-600">
                        {r.from_location && <span className="font-medium">{r.from_location}</span>}
                        {r.from_location && r.to_location && <span className="text-gray-300">→</span>}
                        {r.to_location && <span className="font-medium">{r.to_location}</span>}
                      </div>
                    )}

                    {/* Dates row */}
                    {(r.start_date || r.end_date) && (
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        {r.start_date && (
                          <span>{fmtDate(r.start_date)}{r.start_time ? ' · ' + fmtTime(r.start_time) : ''}</span>
                        )}
                        {r.start_date && r.end_date && <span className="text-gray-300">–</span>}
                        {r.end_date && (
                          <span>{fmtDate(r.end_date)}{r.end_time ? ' · ' + fmtTime(r.end_time) : ''}</span>
                        )}
                      </div>
                    )}

                    {/* Booking ref */}
                    {r.booking_ref && (
                      <div className="mt-1.5 inline-flex items-center gap-1 bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded font-mono">
                        Ref: {r.booking_ref}
                      </div>
                    )}

                    {/* Notes */}
                    {r.notes && (
                      <p className="text-xs text-gray-400 mt-1.5 italic line-clamp-2">{r.notes}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {modalOpen && (
        <ReservationModal
          tripId={id!}
          initial={editing}
          onClose={() => setModalOpen(false)}
          onSaved={() => { setModalOpen(false); load(); }}
        />
      )}
    </div>
  );
}
