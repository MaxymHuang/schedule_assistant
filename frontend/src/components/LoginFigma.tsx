import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface LoginFigmaProps {
  onSwitchToRegister: () => void;
}

const LoginFigma: React.FC<LoginFigmaProps> = ({ onSwitchToRegister }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <div className="min-h-screen flex items-center justify-center px-4" style={{background: 'linear-gradient(to bottom right, #eff6ff, #ffffff, #eff6ff)'}}>
      <div className="w-full max-w-md">
        {/* Login Card */}
        <div className="bg-white border" style={{borderRadius: '1rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', borderColor: '#f3f4f6', padding: '2.5rem'}}>
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Welcome back</h1>
            <p className="text-gray-600 text-sm">
              Please sign in to your account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border text-sm"
                style={{borderRadius: '0.5rem', borderColor: '#d1d5db'}}
                placeholder="Enter your email"
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border text-sm"
                style={{borderRadius: '0.5rem', borderColor: '#d1d5db'}}
                placeholder="Enter your password"
              />
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="ml-2 text-sm text-gray-700">Remember me</span>
              </label>
              <a
                href="#"
                className="text-sm font-medium"
                style={{
                  color: '#2563eb',
                  textDecoration: 'none'
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.color = '#3b82f6';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.color = '#2563eb';
                }}
              >
                Forgot password?
              </a>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full text-white py-3 px-4 font-medium"
              style={{
                backgroundColor: '#2563eb',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  (e.target as HTMLElement).style.backgroundColor = '#1d4ed8';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  (e.target as HTMLElement).style.backgroundColor = '#2563eb';
                }
              }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          {/* Demo Login Buttons */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center mb-3">Quick demo login</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@example.com');
                  setPassword('admin');
                }}
                className="w-full text-gray-700 py-2 px-3 text-sm font-medium"
                style={{
                  backgroundColor: '#f3f4f6',
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.backgroundColor = '#e5e7eb';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.backgroundColor = '#f3f4f6';
                }}
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('user@example.com');
                  setPassword('user');
                }}
                className="w-full text-gray-700 py-2 px-3 text-sm font-medium"
                style={{
                  backgroundColor: '#f3f4f6',
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.backgroundColor = '#e5e7eb';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.backgroundColor = '#f3f4f6';
                }}
              >
                User
              </button>
            </div>
          </div>
        </div>

        {/* Create Account Link */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <button
              onClick={onSwitchToRegister}
              className="font-medium"
              style={{
                color: '#2563eb',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textDecoration: 'none'
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.color = '#3b82f6';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.color = '#2563eb';
              }}
            >
              Create account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginFigma;
