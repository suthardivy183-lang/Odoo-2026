import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';

export default function ResetPasswordPage() {
  const [params]   = useSearchParams();
  const navigate   = useNavigate();
  const token      = params.get('token') || '';

  const [newPw, setNewPw]   = useState('');
  const [confPw, setConfPw] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const [done, setDone]     = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw !== confPw) { setError('Passwords do not match.'); return; }
    if (newPw.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    setError('');
    try {
      await api.post('/api/auth/reset-password', { token, new_password: newPw });
      setDone(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Reset failed. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="text-4xl font-bold text-indigo-600">Traveloop</Link>
          <p className="text-gray-500 mt-1">Set a new password</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          {done ? (
            <div className="text-center">
              <p className="text-4xl mb-3">✅</p>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Password reset!</h2>
              <p className="text-sm text-gray-500">Redirecting you to login…</p>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">Reset password</h2>

              {!token && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  Invalid or missing reset token. Please request a new link.
                </div>
              )}

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newPw}
                    onChange={e => setNewPw(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm new password</label>
                  <input
                    type="password"
                    required
                    value={confPw}
                    onChange={e => setConfPw(e.target.value)}
                    placeholder="Repeat your password"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !token}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-2.5 rounded-lg transition"
                >
                  {loading ? 'Resetting…' : 'Reset password'}
                </button>
              </form>

              <p className="text-center text-sm text-gray-500 mt-5">
                Remember your password?{' '}
                <Link to="/login" className="text-indigo-600 font-medium hover:underline">Sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
