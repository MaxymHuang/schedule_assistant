import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface LoginSplitProps {
  onSwitchToRegister: () => void;
}

const LoginSplit: React.FC<LoginSplitProps> = ({ onSwitchToRegister }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Left: Brand/Illustration Pane */}
      <div className="hidden md:flex flex-col justify-between bg-gradient-to-br from-brand-base via-brand-mist to-white p-10">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Equipment Lending</h1>
          <p className="mt-3 text-gray-700 max-w-sm">
            Reserve, track, and manage equipment with a clean, distraction-free workflow.
          </p>
        </div>
        <div className="mt-10">
          <div className="rounded-xl border border-brand-mist bg-white/70 backdrop-blur p-6 max-w-sm">
            <h2 className="text-lg font-medium text-gray-900">Why sign in?</h2>
            <ul className="mt-3 space-y-2 text-sm text-gray-700 list-disc list-inside">
              <li>Quick bookings with smart defaults</li>
              <li>Track returns and due dates</li>
              <li>Admin oversight for inventory</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Right: Form Pane */}
      <div className="flex items-center justify-center bg-white px-12 py-16">
        <div className="w-full max-w-lg">
          <div className="text-left mb-8">
            <h2 className="text-3xl font-semibold text-gray-900">Welcome back</h2>
            <p className="mt-3 text-base text-gray-600">
              Don't have an account?{' '}
              <button onClick={onSwitchToRegister} className="underline decoration-muted text-primary hover:opacity-80">
                Create one
              </button>
            </p>
          </div>

          {/* Login Form Card */}
          <div className="bg-white border border-brand-mist rounded-xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="text-sm rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-lg font-medium text-gray-700 mb-3">Email</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 px-5 py-4 text-lg focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-lg font-medium text-gray-700 mb-3">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 px-5 py-4 pr-14 text-lg focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 text-base font-medium"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="inline-flex items-center gap-3 text-base text-gray-700">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  Remember me
                </label>
                <a href="#" className="text-base text-gray-600 hover:text-gray-800 underline decoration-muted">Forgot password?</a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex justify-center items-center rounded-lg bg-primary text-white px-6 py-4 text-base font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-60 transition-opacity"
              >
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            {/* Subtle demo controls */}
            <details className="mt-8 text-sm text-gray-500">
              <summary className="cursor-pointer select-none">Quick demo login</summary>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setEmail('admin@example.com');
                    setPassword('admin');
                  }}
                  className="w-full rounded-lg border border-muted bg-white px-4 py-3 text-gray-700 hover:bg-brand-base transition-colors"
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('user@example.com');
                    setPassword('user');
                  }}
                  className="w-full rounded-lg border border-muted bg-white px-4 py-3 text-gray-700 hover:bg-brand-base transition-colors"
                >
                  User
                </button>
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginSplit;


