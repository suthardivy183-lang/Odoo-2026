import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

type Tab = 'profile' | 'password' | 'danger';

export default function ProfilePage() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>('profile');

  // Profile form
  const [name, setName]     = useState(user?.name || '');
  const [email, setEmail]   = useState(user?.email || '');
  const [lang, setLang]     = useState('en');
  const [profSaving, setProfSaving] = useState(false);
  const [profMsg, setProfMsg]       = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Password form
  const [currPw, setCurrPw]   = useState('');
  const [newPw, setNewPw]     = useState('');
  const [confPw, setConfPw]   = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg]       = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Delete
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting]           = useState(false);
  const [showDelModal, setShowDelModal]   = useState(false);

  const initials = (user?.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfSaving(true);
    setProfMsg(null);
    try {
      const body: Record<string, string> = {};
      if (name !== user?.name)   body.name = name;
      if (email !== user?.email) body.email = email;
      if (lang)                  body.language_pref = lang;
      if (Object.keys(body).length === 0) { setProfMsg({ type: 'ok', text: 'Nothing changed.' }); return; }
      const res = await api.put('/api/auth/me', body);
      updateUser(res.data.data.user);
      setProfMsg({ type: 'ok', text: 'Profile updated successfully!' });
    } catch (err: any) {
      setProfMsg({ type: 'err', text: err.response?.data?.message || 'Failed to update profile.' });
    } finally {
      setProfSaving(false);
    }
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw !== confPw) { setPwMsg({ type: 'err', text: 'New passwords do not match.' }); return; }
    setPwSaving(true);
    setPwMsg(null);
    try {
      await api.put('/api/auth/me/password', { current_password: currPw, new_password: newPw });
      setPwMsg({ type: 'ok', text: 'Password changed successfully!' });
      setCurrPw(''); setNewPw(''); setConfPw('');
    } catch (err: any) {
      setPwMsg({ type: 'err', text: err.response?.data?.message || 'Failed to change password.' });
    } finally {
      setPwSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirm !== 'DELETE') return;
    setDeleting(true);
    try {
      await api.delete('/api/auth/me');
      logout();
      navigate('/login');
    } catch {
      setDeleting(false);
      setShowDelModal(false);
    }
  };

  const tabClass = (t: Tab) =>
    `px-4 py-2 text-sm font-medium rounded-lg transition ${
      tab === t ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
    }`;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 py-10">
        {/* Avatar header */}
        <div className="flex items-center gap-5 mb-8">
          <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
            {initials}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{user?.name}</h1>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button onClick={() => setTab('profile')}  className={tabClass('profile')}>Profile</button>
          <button onClick={() => setTab('password')} className={tabClass('password')}>Password</button>
          <button onClick={() => setTab('danger')}   className={tabClass('danger')}>Danger Zone</button>
        </div>

        {/* Profile tab */}
        {tab === 'profile' && (
          <form onSubmit={saveProfile} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
            <h2 className="text-lg font-semibold text-gray-800">Edit Profile</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Language Preference</label>
              <select
                value={lang}
                onChange={e => setLang(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="fr">French</option>
                <option value="es">Spanish</option>
                <option value="de">German</option>
                <option value="ja">Japanese</option>
              </select>
            </div>

            {profMsg && (
              <p className={`text-sm font-medium ${profMsg.type === 'ok' ? 'text-green-600' : 'text-red-600'}`}>
                {profMsg.text}
              </p>
            )}

            <button
              type="submit"
              disabled={profSaving}
              className="w-full py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              {profSaving ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        )}

        {/* Password tab */}
        {tab === 'password' && (
          <form onSubmit={savePassword} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
            <h2 className="text-lg font-semibold text-gray-800">Change Password</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <input
                type="password"
                value={currPw}
                onChange={e => setCurrPw(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input
                type="password"
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                required
                minLength={8}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                value={confPw}
                onChange={e => setConfPw(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>

            {pwMsg && (
              <p className={`text-sm font-medium ${pwMsg.type === 'ok' ? 'text-green-600' : 'text-red-600'}`}>
                {pwMsg.text}
              </p>
            )}

            <button
              type="submit"
              disabled={pwSaving}
              className="w-full py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              {pwSaving ? 'Updating…' : 'Change Password'}
            </button>
          </form>
        )}

        {/* Danger Zone tab */}
        {tab === 'danger' && (
          <div className="bg-white rounded-2xl border border-red-200 p-6">
            <h2 className="text-lg font-semibold text-red-700 mb-2">Delete Account</h2>
            <p className="text-sm text-gray-600 mb-4">
              Permanently deletes your account and all trips, stops, activities, notes, and checklist data. This cannot be undone.
            </p>
            <button
              onClick={() => setShowDelModal(true)}
              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition"
            >
              Delete My Account
            </button>
          </div>
        )}
      </main>

      {/* Delete confirm modal */}
      {showDelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Are you absolutely sure?</h3>
            <p className="text-sm text-gray-600 mb-4">
              This will permanently delete your account and all associated data. Type <strong>DELETE</strong> to confirm.
            </p>
            <input
              type="text"
              value={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-red-300"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDelModal(false); setDeleteConfirm(''); }}
                className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteConfirm !== 'DELETE' || deleting}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-40 transition"
              >
                {deleting ? 'Deleting…' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
