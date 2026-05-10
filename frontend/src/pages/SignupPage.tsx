import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const schema = z.object({
  name:     z.string().trim().min(2, 'Name must be at least 2 characters'),
  email:    z.string().email('Enter a valid email'),
  password: z
    .string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
});

type FormErrors = Partial<Record<keyof z.infer<typeof schema>, string>>;

export default function SignupPage() {
  const navigate  = useNavigate();
  const { login } = useAuth();

  const [form, setForm]         = useState({ name: '', email: '', password: '' });
  const [errors, setErrors]     = useState<FormErrors>({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading]   = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setErrors(er => ({ ...er, [e.target.name]: undefined }));
    setApiError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = schema.safeParse(form);
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
      const res = await api.post('/api/auth/register', form);
      login(res.data.data.token, res.data.data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setApiError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = () => {
    const p = form.password;
    if (!p) return null;
    let score = 0;
    if (p.length >= 8)       score++;
    if (/[A-Z]/.test(p))     score++;
    if (/[0-9]/.test(p))     score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    const labels = ['Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['bg-red-400', 'bg-yellow-400', 'bg-blue-400', 'bg-green-500'];
    return { label: labels[score - 1] ?? 'Weak', color: colors[score - 1] ?? 'bg-red-400', score };
  };

  const strength = passwordStrength();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-indigo-600">Traveloop</h1>
          <p className="text-gray-500 mt-1">Plan your next adventure</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Create your account</h2>

          {apiError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Jane Smith"
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition ${errors.name ? 'border-red-400' : 'border-gray-300'}`}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition ${errors.email ? 'border-red-400' : 'border-gray-300'}`}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition ${errors.password ? 'border-red-400' : 'border-gray-300'}`}
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              {strength && !errors.password && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[1,2,3,4].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full ${i <= strength.score ? strength.color : 'bg-gray-200'}`} />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{strength.label}</p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-2.5 rounded-lg transition"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
