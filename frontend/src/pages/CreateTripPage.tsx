import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';
import Navbar from '../components/Navbar';
import api from '../services/api';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const schema = z.object({
  name:         z.string().trim().min(2, 'Name must be at least 2 characters').max(150),
  description:  z.string().trim().optional(),
  start_date:   z.string().regex(dateRegex, 'Use YYYY-MM-DD format'),
  end_date:     z.string().regex(dateRegex, 'Use YYYY-MM-DD format'),
  total_budget: z.coerce.number().min(0, 'Budget cannot be negative').optional(),
  status:       z.enum(['draft', 'active', 'completed']).default('draft'),
}).refine(d => !d.start_date || !d.end_date || d.end_date >= d.start_date, {
  message: 'End date must be on or after start date',
  path: ['end_date'],
});

type FormData = {
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  total_budget: string;
  status: 'draft' | 'active' | 'completed';
};

type FormErrors = Partial<Record<keyof FormData | 'root', string>>;

// Defined outside component so React doesn't treat it as a new type on every render
function Field({ name, label, error, children }: {
  name: string; label: string; error?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

const inputCls = (error?: string) =>
  `w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition ${
    error ? 'border-red-400' : 'border-gray-300'
  }`;

export default function CreateTripPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState<FormData>({
    name: '', description: '', start_date: '', end_date: '',
    total_budget: '', status: 'draft',
  });
  const [errors, setErrors]   = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setErrors(er => ({ ...er, [e.target.name]: undefined, root: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      total_budget: form.total_budget ? Number(form.total_budget) : undefined,
      description:  form.description || undefined,
    };
    const result = schema.safeParse(payload);
    if (!result.success) {
      const fieldErrors: FormErrors = {};
      result.error.issues.forEach(i => {
        fieldErrors[i.path[0] as keyof FormErrors] = i.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/api/trips', result.data);
      navigate(`/trips/${res.data.data.trip.id}`);
    } catch (err: any) {
      const apiErrors = err.response?.data?.errors;
      if (Array.isArray(apiErrors)) {
        const fieldErrors: FormErrors = {};
        apiErrors.forEach((issue: { path?: string[]; message?: string }) => {
          const field = issue.path?.[0] as keyof FormErrors | undefined;
          if (field && field in form) fieldErrors[field] = issue.message || 'Invalid value';
        });

        if (Object.keys(fieldErrors).length) {
          setErrors(fieldErrors);
          return;
        }
      }

      setErrors({ root: err.response?.data?.message || 'Failed to create trip' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-6 flex items-center gap-3">
          <Link to="/trips" className="text-gray-400 hover:text-gray-600 transition text-sm">← My Trips</Link>
          <h1 className="text-2xl font-bold text-gray-800">Plan a new trip</h1>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          {errors.root && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {errors.root}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Field name="name" label="Trip name *" error={errors.name}>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Europe Summer 2026"
                className={inputCls(errors.name)}
              />
            </Field>

            <Field name="description" label="Description" error={errors.description}>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="What's this trip about?"
                rows={3}
                className={`${inputCls(errors.description)} resize-none`}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field name="start_date" label="Start date *" error={errors.start_date}>
                <input
                  type="date"
                  name="start_date"
                  value={form.start_date}
                  onChange={handleChange}
                  className={inputCls(errors.start_date)}
                />
              </Field>

              <Field name="end_date" label="End date *" error={errors.end_date}>
                <input
                  type="date"
                  name="end_date"
                  value={form.end_date}
                  min={form.start_date}
                  onChange={handleChange}
                  className={inputCls(errors.end_date)}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field name="total_budget" label="Budget (USD)" error={errors.total_budget}>
                <input
                  type="number"
                  name="total_budget"
                  value={form.total_budget}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  step="1"
                  className={inputCls(errors.total_budget)}
                />
              </Field>

              <Field name="status" label="Status" error={errors.status}>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className={inputCls('status')}
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </Field>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-2.5 rounded-lg transition"
              >
                {loading ? 'Creating…' : 'Create trip'}
              </button>
              <Link
                to="/trips"
                className="px-5 py-2.5 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition text-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
