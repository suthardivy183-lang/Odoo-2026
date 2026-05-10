import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';

interface Note {
  id: string;
  title?: string;
  content: string;
  stop_id?: string | null;
  stop_city_name?: string | null;
  created_at: string;
  updated_at: string;
}

interface Stop {
  id: string;
  city_name: string;
  arrival_date: string;
  departure_date: string;
}

interface Trip { id: string; name: string; }

const fmtRelative = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};

export default function NotesPage() {
  const { id } = useParams<{ id: string }>();
  const [trip,  setTrip]  = useState<Trip | null>(null);
  const [stops, setStops] = useState<Stop[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr]     = useState('');

  // New note form
  const [title,    setTitle]    = useState('');
  const [content,  setContent]  = useState('');
  const [stopId,   setStopId]   = useState('');
  const [saving,   setSaving]   = useState(false);

  // Inline edit
  const [editingId,    setEditingId]    = useState<string | null>(null);
  const [editTitle,    setEditTitle]    = useState('');
  const [editContent,  setEditContent]  = useState('');

  // Filter
  const [filterStop, setFilterStop] = useState<string>(''); // '' = all

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.get(`/api/trips/${id}`),
      api.get(`/api/trips/${id}/stops`),
      api.get(`/api/trips/${id}/notes`),
    ])
      .then(([t, s, n]) => {
        setTrip(t.data.data.trip);
        setStops(s.data.data.stops);
        setNotes(n.data.data.notes);
      })
      .catch(e => setErr(e.response?.data?.message || 'Failed to load notes'))
      .finally(() => setLoading(false));
  }, [id]);

  const visible = useMemo(() => {
    if (!filterStop) return notes;
    if (filterStop === 'general') return notes.filter(n => !n.stop_id);
    return notes.filter(n => n.stop_id === filterStop);
  }, [notes, filterStop]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSaving(true);
    setErr('');
    try {
      const res = await api.post(`/api/trips/${id}/notes`, {
        title:   title.trim() || undefined,
        content: content.trim(),
        stop_id: stopId || undefined,
      });
      // Re-fetch to get joined city_name
      const refreshed = await api.get(`/api/trips/${id}/notes`);
      setNotes(refreshed.data.data.notes);
      setTitle(''); setContent(''); setStopId('');
    } catch (e: any) {
      setErr(e.response?.data?.message || 'Failed to add note');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (n: Note) => {
    setEditingId(n.id);
    setEditTitle(n.title || '');
    setEditContent(n.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
    setEditContent('');
  };

  const saveEdit = async (noteId: string) => {
    if (!editContent.trim()) return;
    try {
      await api.put(`/api/trips/${id}/notes/${noteId}`, {
        title:   editTitle.trim() || undefined,
        content: editContent.trim(),
      });
      const refreshed = await api.get(`/api/trips/${id}/notes`);
      setNotes(refreshed.data.data.notes);
      cancelEdit();
    } catch (e: any) {
      setErr(e.response?.data?.message || 'Failed to update note');
    }
  };

  const handleDelete = async (noteId: string) => {
    if (!confirm('Delete this note?')) return;
    setNotes(prev => prev.filter(n => n.id !== noteId));
    try {
      await api.delete(`/api/trips/${id}/notes/${noteId}`);
    } catch {
      const r = await api.get(`/api/trips/${id}/notes`);
      setNotes(r.data.data.notes);
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

        <h1 className="text-2xl font-bold text-gray-800 mb-6">Notes</h1>

        {err && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{err}</div>
        )}

        {/* New note */}
        <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-gray-200 p-5 mb-5 space-y-3">
          <input
            type="text"
            placeholder="Note title (optional)"
            value={title}
            onChange={e => setTitle(e.target.value)}
            maxLength={200}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 font-medium"
          />
          <textarea
            placeholder="Write your note…"
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
          />
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={stopId}
              onChange={e => setStopId(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">📌 General trip note</option>
              {stops.map(s => (
                <option key={s.id} value={s.id}>📍 {s.city_name}</option>
              ))}
            </select>
            <button
              type="submit"
              disabled={saving || !content.trim()}
              className="ml-auto px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-semibold rounded-lg transition"
            >
              {saving ? 'Adding…' : 'Add note'}
            </button>
          </div>
        </form>

        {/* Filter chips */}
        {notes.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <button
              onClick={() => setFilterStop('')}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${
                filterStop === '' ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:border-indigo-300'
              }`}
            >
              All ({notes.length})
            </button>
            <button
              onClick={() => setFilterStop('general')}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${
                filterStop === 'general' ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:border-indigo-300'
              }`}
            >
              General ({notes.filter(n => !n.stop_id).length})
            </button>
            {stops.map(s => {
              const cnt = notes.filter(n => n.stop_id === s.id).length;
              if (cnt === 0) return null;
              return (
                <button
                  key={s.id}
                  onClick={() => setFilterStop(s.id)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${
                    filterStop === s.id ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:border-indigo-300'
                  }`}
                >
                  {s.city_name} ({cnt})
                </button>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {notes.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
            <p className="text-4xl mb-3">📝</p>
            <h3 className="font-semibold text-gray-700">No notes yet</h3>
            <p className="text-sm text-gray-400 mt-1">Jot down ideas, reservations, or reminders above</p>
          </div>
        )}

        {/* Notes list */}
        {visible.length > 0 && (
          <div className="space-y-3">
            {visible.map(n => (
              <article key={n.id} className="bg-white rounded-2xl border border-gray-200 p-5 group">
                {editingId === n.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      placeholder="Title (optional)"
                      maxLength={200}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 font-medium"
                    />
                    <textarea
                      value={editContent}
                      onChange={e => setEditContent(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(n.id)}
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-4 py-1.5 border border-gray-300 text-gray-600 text-xs rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        {n.title && <h3 className="font-semibold text-gray-800">{n.title}</h3>}
                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                          <span>{fmtRelative(n.created_at)}</span>
                          {n.stop_city_name && (
                            <>
                              <span>·</span>
                              <span className="text-indigo-600 font-medium">📍 {n.stop_city_name}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={() => startEdit(n)}
                          className="text-xs text-gray-400 hover:text-indigo-600 transition"
                        >
                          Edit
                        </button>
                        <span className="text-gray-300">·</span>
                        <button
                          onClick={() => handleDelete(n.id)}
                          className="text-xs text-gray-400 hover:text-red-500 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{n.content}</p>
                  </>
                )}
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
