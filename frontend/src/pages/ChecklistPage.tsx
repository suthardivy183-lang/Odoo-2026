import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';

interface Item {
  id: string;
  item_name: string;
  category: 'clothing' | 'documents' | 'electronics' | 'toiletries' | 'medicines' | 'other';
  is_packed: boolean;
}

interface Trip { id: string; name: string; }

const CATEGORIES: { key: Item['category']; label: string; emoji: string }[] = [
  { key: 'documents',   label: 'Documents',   emoji: '📄' },
  { key: 'clothing',    label: 'Clothing',    emoji: '👕' },
  { key: 'electronics', label: 'Electronics', emoji: '🔌' },
  { key: 'toiletries',  label: 'Toiletries',  emoji: '🧴' },
  { key: 'medicines',   label: 'Medicines',   emoji: '💊' },
  { key: 'other',       label: 'Other',       emoji: '🎒' },
];

export default function ChecklistPage() {
  const { id } = useParams<{ id: string }>();
  const [trip, setTrip]       = useState<Trip | null>(null);
  const [items, setItems]     = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr]         = useState('');

  // Add-item form state
  const [newName,     setNewName]     = useState('');
  const [newCategory, setNewCategory] = useState<Item['category']>('other');
  const [adding,      setAdding]      = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.get(`/api/trips/${id}`),
      api.get(`/api/trips/${id}/checklist`),
    ])
      .then(([t, c]) => {
        setTrip(t.data.data.trip);
        setItems(c.data.data.items);
      })
      .catch(e => setErr(e.response?.data?.message || 'Failed to load checklist'))
      .finally(() => setLoading(false));
  }, [id]);

  const grouped = useMemo(() => {
    const map = new Map<Item['category'], Item[]>();
    CATEGORIES.forEach(c => map.set(c.key, []));
    items.forEach(i => map.get(i.category)?.push(i));
    return map;
  }, [items]);

  const packedCount = items.filter(i => i.is_packed).length;
  const progress    = items.length > 0 ? (packedCount / items.length) * 100 : 0;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;
    setAdding(true);
    try {
      const res = await api.post(`/api/trips/${id}/checklist`, {
        item_name: trimmed,
        category:  newCategory,
      });
      setItems(prev => [...prev, res.data.data.item]);
      setNewName('');
    } catch (e: any) {
      setErr(e.response?.data?.message || 'Failed to add');
    } finally {
      setAdding(false);
    }
  };

  const handleToggle = async (item: Item) => {
    // Optimistic update
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_packed: !i.is_packed } : i));
    try {
      await api.patch(`/api/trips/${id}/checklist/${item.id}/toggle`);
    } catch {
      // Revert on failure
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_packed: item.is_packed } : i));
    }
  };

  const handleDelete = async (itemId: string) => {
    setItems(prev => prev.filter(i => i.id !== itemId));
    try {
      await api.delete(`/api/trips/${id}/checklist/${itemId}`);
    } catch {
      // Reload on failure
      const r = await api.get(`/api/trips/${id}/checklist`);
      setItems(r.data.data.items);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-10">
          <div className="bg-white rounded-2xl border border-gray-200 h-96 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-2">
          <Link to={`/trips/${id}`} className="text-sm text-gray-400 hover:text-gray-600 transition">
            ← {trip?.name ?? 'Trip'}
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-6">Packing Checklist</h1>

        {err && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{err}</div>
        )}

        {/* Progress */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-5">
          <div className="flex items-baseline justify-between mb-2">
            <p className="text-sm font-semibold text-gray-700">Progress</p>
            <p className="text-sm text-gray-500">
              <span className="font-semibold text-gray-800">{packedCount}</span> of {items.length} packed
            </p>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          {items.length > 0 && progress === 100 && (
            <p className="text-xs text-green-600 font-medium mt-2">🎉 All packed — ready to go!</p>
          )}
        </div>

        {/* Add form */}
        <form onSubmit={handleAdd} className="bg-white rounded-2xl border border-gray-200 p-4 mb-5 flex gap-2">
          <input
            type="text"
            placeholder="Add an item…"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            maxLength={150}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <select
            value={newCategory}
            onChange={e => setNewCategory(e.target.value as Item['category'])}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.emoji} {c.label}</option>)}
          </select>
          <button
            type="submit"
            disabled={adding || !newName.trim()}
            className="px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-semibold rounded-lg transition"
          >
            Add
          </button>
        </form>

        {/* Empty state */}
        {items.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
            <p className="text-4xl mb-3">📦</p>
            <h3 className="font-semibold text-gray-700">Your checklist is empty</h3>
            <p className="text-sm text-gray-400 mt-1">Add an item above to get started</p>
          </div>
        )}

        {/* Grouped items */}
        {items.length > 0 && (
          <div className="space-y-4">
            {CATEGORIES.map(c => {
              const list = grouped.get(c.key) || [];
              if (list.length === 0) return null;
              const packed = list.filter(i => i.is_packed).length;
              return (
                <div key={c.key} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <span>{c.emoji}</span> {c.label}
                    </h3>
                    <span className="text-xs text-gray-400">{packed}/{list.length}</span>
                  </div>
                  <ul className="divide-y divide-gray-100">
                    {list.map(item => (
                      <li
                        key={item.id}
                        className="flex items-center gap-3 px-5 py-2.5 hover:bg-gray-50 transition group"
                      >
                        <button
                          onClick={() => handleToggle(item)}
                          aria-label={item.is_packed ? 'Mark as not packed' : 'Mark as packed'}
                          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition flex-shrink-0 ${
                            item.is_packed
                              ? 'bg-green-500 border-green-500 text-white'
                              : 'border-gray-300 hover:border-green-400'
                          }`}
                        >
                          {item.is_packed && <span className="text-xs">✓</span>}
                        </button>
                        <span className={`flex-1 text-sm ${item.is_packed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                          {item.item_name}
                        </span>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-xs text-gray-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                          aria-label="Delete"
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
