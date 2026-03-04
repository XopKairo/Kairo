import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const authContext = useContext(AuthContext);
  const navigate = useNavigate();

  if (!authContext) return null;
  const { login } = authContext;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login({ username, password });
      navigate('/');
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const error = err as { response?: { status?: number; data?: { message?: string } }; message: string };
        setError(`Server Error (${error.response?.status}): ${error.response?.data?.message || error.message}`);
      } else if (err && typeof err === 'object' && 'request' in err) {
        setError('Network Error: Unable to reach the server. Check CORS or URL.');
      } else {
        setError(`Error: ${(err as Error).message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950 p-4 transition-colors duration-200">
      <div className="w-full max-w-md bg-white dark:bg-surface-900 rounded-[24px] p-8 shadow-soft border border-gray-100 dark:border-gray-800">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-brand-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl mb-4">
            Z
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Zora Admin</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Sign in to manage your application</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm font-medium mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-surface-800 border border-transparent focus:border-brand-500 dark:focus:border-brand-500 rounded-xl text-sm text-gray-900 dark:text-white outline-none transition-colors"
              placeholder="Enter your username"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-surface-800 border border-transparent focus:border-brand-500 dark:focus:border-brand-500 rounded-xl text-sm text-gray-900 dark:text-white outline-none transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors shadow-sm shadow-brand-500/20 mt-4 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
