import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function NotFoundPage() {
  const { user } = useAuth();
  const homePath = user ? '/dashboard' : '/login';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 text-center">
      <p className="text-7xl mb-4">🗺️</p>
      <h1 className="text-3xl font-bold text-gray-800">Lost in transit</h1>
      <p className="text-gray-500 mt-2 max-w-sm">
        We couldn't find the page you're looking for. It may have been moved or never existed.
      </p>
      <Link
        to={homePath}
        className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition"
      >
        Back to {user ? 'dashboard' : 'sign in'}
      </Link>
    </div>
  );
}
