import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';
import { initSocket, joinTripRoom, leaveTripRoom } from '../services/socket';

interface Budget {
  id: string;
  trip_id: string;
  transport_cost:     string | number;
  accommodation_cost: string | number;
  meals_cost:         string | number;
  miscellaneous_cost: string | number;
  currency: string;
  total_budget?: string | number;
  breakdown_total: string | number;
  activities_total: string | number;
}

interface Trip {
  id: string;
  name: string;
}

const CATEGORIES = [
  { key: 'transport_cost',     label: 'Transport',     emoji: '✈️', color: '#6366f1' },
  { key: 'accommodation_cost', label: 'Accommodation', emoji: '🏨', color: '#10b981' },
  { key: 'meals_cost',         label: 'Meals',         emoji: '🍽️', color: '#f59e0b' },
  { key: 'miscellaneous_cost', label: 'Miscellaneous', emoji: '🎒', color: '#ec4899' },
] as const;

type CatKey = typeof CATEGORIES[number]['key'];

export default function BudgetPage() {
  const { id } = useParams<{ id: string }>();
  const [trip,   setTrip]   = useState<Trip | null>(null);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [form,   setForm]   = useState<Record<CatKey, string>>({
    transport_cost: '', accommodation_cost: '', meals_cost: '', miscellaneous_cost: '',
  });
  const [currency, setCurrency] = useState('USD');
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [savedAt, setSavedAt]   = useState<number | null>(null);
  const [err, setErr]           = useState('');
  const [liveFlash, setLiveFlash] = useState(false);

  // Track if user is currently editing — if so, don't overwrite their form
  const isDirtyRef = useRef(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.get(`/api/trips/${id}`),
      api.get(`/api/trips/${id}/budget`),
    ])
      .then(([tripRes, budRes]) => {
        setTrip(tripRes.data.data.trip);
        const b: Budget = budRes.data.data.budget;
        setBudget(b);
        setForm({
          transport_cost:     String(Number(b.transport_cost     ?? 0)),
          accommodation_cost: String(Number(b.accommodation_cost ?? 0)),
          meals_cost:         String(Number(b.meals_cost         ?? 0)),
          miscellaneous_cost: String(Number(b.miscellaneous_cost ?? 0)),
        });
        setCurrency(b.currency || 'USD');
      })
      .catch(e => setErr(e.response?.data?.message || 'Failed to load budget'))
      .finally(() => setLoading(false));
  }, [id]);

  // Live totals from form (not yet saved)
  const liveBreakdown = useMemo(() => {
    return CATEGORIES.reduce((sum, c) => sum + (Number(form[c.key]) || 0), 0);
  }, [form]);

  const activitiesTotal = Number(budget?.activities_total ?? 0);
  const totalBudget     = Number(budget?.total_budget ?? 0);
  const totalSpent      = liveBreakdown + activitiesTotal;
  const remaining       = totalBudget - totalSpent;
  const usedPct         = totalBudget > 0 ? Math.min(100, (totalSpent / totalBudget) * 100) : 0;
  const overBudget      = totalBudget > 0 && totalSpent > totalBudget;

  // Donut chart segments (conic-gradient)
  const conicGradient = useMemo(() => {
    if (liveBreakdown === 0) return 'conic-gradient(#e5e7eb 0% 100%)';
    const stops: string[] = [];
    let acc = 0;
    CATEGORIES.forEach(c => {
      const val = Number(form[c.key]) || 0;
      if (val === 0) return;
      const pct = (val / liveBreakdown) * 100;
      stops.push(`${c.color} ${acc}% ${acc + pct}%`);
      acc += pct;
    });
    return `conic-gradient(${stops.join(', ')})`;
  }, [form, liveBreakdown]);

  const isDirty = useMemo(() => {
    if (!budget) return false;
    return CATEGORIES.some(c => Number(form[c.key]) !== Number(budget[c.key as keyof Budget]))
        || currency !== budget.currency;
  }, [form, currency, budget]);

  useEffect(() => { isDirtyRef.current = isDirty; }, [isDirty]);

  // ── Live updates via Socket.io ────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    const socket = initSocket();
    joinTripRoom(id);

    const onBudgetUpdate = (msg: { tripId: string; budget: Budget }) => {
      if (msg.tripId !== id) return;
      setBudget(msg.budget);
      // Only sync the form fields if the user has no unsaved local edits
      if (!isDirtyRef.current) {
        setForm({
          transport_cost:     String(Number(msg.budget.transport_cost     ?? 0)),
          accommodation_cost: String(Number(msg.budget.accommodation_cost ?? 0)),
          meals_cost:         String(Number(msg.budget.meals_cost         ?? 0)),
          miscellaneous_cost: String(Number(msg.budget.miscellaneous_cost ?? 0)),
        });
        setCurrency(msg.budget.currency || 'USD');
      }
      setLiveFlash(true);
      setTimeout(() => setLiveFlash(false), 1200);
    };

    socket.on('budget:updated', onBudgetUpdate);
    return () => {
      socket.off('budget:updated', onBudgetUpdate);
      leaveTripRoom(id);
    };
  }, [id]);

  const handleChange = (k: CatKey, v: string) => {
    if (v !== '' && Number(v) < 0) return;
    setForm(f => ({ ...f, [k]: v }));
    setSavedAt(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setErr('');
    try {
      const res = await api.put(`/api/trips/${id}/budget`, {
        transport_cost:     Number(form.transport_cost)     || 0,
        accommodation_cost: Number(form.accommodation_cost) || 0,
        meals_cost:         Number(form.meals_cost)         || 0,
        miscellaneous_cost: Number(form.miscellaneous_cost) || 0,
        currency,
      });
      // Server returns the recomputed budget with breakdown_total + activities_total
      setBudget(res.data.data.budget);
      setSavedAt(Date.now());
    } catch (e: any) {
      setErr(e.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-10">
          <div className="bg-white rounded-2xl border border-gray-200 h-96 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-2">
          <Link to={`/trips/${id}`} className="text-sm text-gray-400 hover:text-gray-600 transition">
            ← {trip?.name ?? 'Trip'}
          </Link>
        </div>

        <div className="flex items-baseline justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-800">Budget</h1>
            <span
              className={`flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full transition-colors ${
                liveFlash ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}
              title={liveFlash ? 'Just received a live update' : 'Live updates active'}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${liveFlash ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              {liveFlash ? 'Live update' : 'Live'}
            </span>
          </div>
          <span className="text-sm text-gray-400">{currency}</span>
        </div>

        {err && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{err}</div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ─── Donut chart ──────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 lg:col-span-1">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Breakdown</h2>

            <div className="flex justify-center mb-4">
              <div
                className="relative w-40 h-40 rounded-full"
                style={{ background: conicGradient }}
              >
                <div className="absolute inset-4 bg-white rounded-full flex flex-col items-center justify-center">
                  <p className="text-xs text-gray-400">Categories</p>
                  <p className="text-lg font-bold text-gray-800">
                    ${liveBreakdown.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <ul className="space-y-2">
              {CATEGORIES.map(c => {
                const val = Number(form[c.key]) || 0;
                const pct = liveBreakdown > 0 ? (val / liveBreakdown) * 100 : 0;
                return (
                  <li key={c.key} className="flex items-center gap-2 text-xs">
                    <span className="w-3 h-3 rounded-sm" style={{ background: c.color }} />
                    <span className="flex-1 text-gray-600">{c.label}</span>
                    <span className="font-medium text-gray-700">
                      ${val.toLocaleString()}
                    </span>
                    <span className="text-gray-400 w-10 text-right">
                      {pct.toFixed(0)}%
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* ─── Editable categories ──────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 lg:col-span-2">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Edit categories</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {CATEGORIES.map(c => (
                <div key={c.key}>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                    <span>{c.emoji}</span> {c.label}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={form[c.key]}
                      onChange={e => handleChange(c.key, e.target.value)}
                      className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <input
                type="text"
                maxLength={3}
                value={currency}
                onChange={e => { setCurrency(e.target.value.toUpperCase()); setSavedAt(null); }}
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 uppercase"
              />
            </div>

            <div className="flex items-center gap-3 pt-5 mt-5 border-t border-gray-100">
              <button
                onClick={handleSave}
                disabled={!isDirty || saving}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2 rounded-lg transition"
              >
                {saving ? 'Saving…' : 'Save changes'}
              </button>
              {savedAt && !isDirty && (
                <span className="text-xs text-green-600 font-medium">✓ Saved</span>
              )}
              {isDirty && !saving && (
                <span className="text-xs text-amber-600">Unsaved changes</span>
              )}
            </div>
          </div>
        </div>

        {/* ─── Total spend vs budget ──────────────────────── */}
        <div className="mt-6 bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">Spending vs budget</h2>
            {totalBudget > 0 && (
              <span className={`text-xs font-medium ${overBudget ? 'text-red-600' : 'text-gray-500'}`}>
                {overBudget ? 'Over' : 'Remaining'}: ${Math.abs(remaining).toLocaleString()}
              </span>
            )}
          </div>

          {totalBudget > 0 ? (
            <>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden relative">
                <div
                  className={`h-full transition-all duration-500 ${overBudget ? 'bg-red-500' : 'bg-indigo-500'}`}
                  style={{ width: `${usedPct}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>${totalSpent.toLocaleString()} spent</span>
                <span>${totalBudget.toLocaleString()} budget</span>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-400 italic">
              Set a total budget on the trip to track usage.
            </p>
          )}

          <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-gray-100 text-center">
            <div>
              <p className="text-xs text-gray-400">Categories</p>
              <p className="text-base font-semibold text-gray-800">
                ${liveBreakdown.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Activities</p>
              <p className="text-base font-semibold text-gray-800">
                ${activitiesTotal.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Total spend</p>
              <p className={`text-base font-bold ${overBudget ? 'text-red-600' : 'text-indigo-600'}`}>
                ${totalSpent.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
