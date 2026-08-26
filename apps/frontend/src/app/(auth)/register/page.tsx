'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { GhmcLogo } from '@/components/brand/ghmc-logo';
import { HyderabadBackground } from '@/components/brand/hyderabad-bg';

export default function RegisterPage() {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);
    try {
      await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone || undefined,
        password: formData.password,
      });
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-4">
          <GhmcLogo className="h-14 w-auto" />
          <div className="border-l border-gray-300 pl-4">
            <h1 className="text-base md:text-lg font-bold text-[#d97706] leading-tight">GREATER HYDERABAD MUNICIPAL CORPORATION</h1>
            <p className="text-xs text-gray-500">CivicOps — Civic Operations Portal</p>
          </div>
        </div>
      </header>

      {/* Hero with register card */}
      <div className="relative flex-1 flex items-center min-h-[calc(100vh-140px)]">
        <HyderabadBackground />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-12 flex justify-center lg:justify-end">
          <div className="w-full max-w-md bg-slate-800/80 backdrop-blur-md rounded-xl shadow-2xl border border-white/10 p-8">
            <h2 className="text-2xl font-light text-white text-center mb-2">Citizen Registration</h2>
            <p className="text-center text-white/60 text-xs mb-6">Create your account to report civic issues</p>

            {error && (
              <div className="mb-4 bg-red-500/20 border border-red-400/40 text-red-100 px-4 py-2.5 rounded-md text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input name="firstName" value={formData.firstName} onChange={handleChange} required placeholder="First name"
                  className="px-4 py-2.5 rounded-md text-sm bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400" />
                <input name="lastName" value={formData.lastName} onChange={handleChange} required placeholder="Last name"
                  className="px-4 py-2.5 rounded-md text-sm bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400" />
              </div>
              <input name="email" type="email" value={formData.email} onChange={handleChange} required placeholder="Email address"
                className="w-full px-4 py-2.5 rounded-md text-sm bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400" />
              <input name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="Phone number (optional)"
                className="w-full px-4 py-2.5 rounded-md text-sm bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400" />
              <input name="password" type="password" value={formData.password} onChange={handleChange} required placeholder="Password (min 8 chars, 1 uppercase, 1 number)"
                className="w-full px-4 py-2.5 rounded-md text-sm bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400" />
              <input name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required placeholder="Confirm password"
                className="w-full px-4 py-2.5 rounded-md text-sm bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400" />

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-gradient-to-r from-sky-400 to-blue-500 text-white rounded-full text-sm font-semibold hover:from-sky-500 hover:to-blue-600 disabled:opacity-50 shadow-lg transition-all mt-2"
              >
                {isLoading ? 'Creating account...' : 'Register'}
              </button>

              <p className="text-center text-xs text-white/70 pt-2">
                Already have an account?{' '}
                <Link href="/login" className="text-sky-300 hover:underline">Sign in</Link>
              </p>
            </form>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#0f2d4a] text-white">
        <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="text-center md:text-left">
            <h3 className="font-semibold mb-2">QUICK LINKS</h3>
            <Link href="/login" className="text-sky-300 text-sm hover:underline">Citizen Login</Link>
          </div>
          <div className="text-center md:text-left">
            <h3 className="font-semibold mb-2">REACH US</h3>
            <p className="text-sm text-gray-300">Office: 040-21111111</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
