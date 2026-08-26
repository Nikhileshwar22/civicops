'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { GhmcLogo } from '@/components/brand/ghmc-logo';
import { HyderabadBackground } from '@/components/brand/hyderabad-bg';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaError, setCaptchaError] = useState(false);

  useEffect(() => {
    setNum1(Math.floor(Math.random() * 10) + 1);
    setNum2(Math.floor(Math.random() * 10) + 1);
  }, []);

  const resetCaptcha = () => {
    setNum1(Math.floor(Math.random() * 10) + 1);
    setNum2(Math.floor(Math.random() * 10) + 1);
    setCaptchaAnswer('');
    setCaptchaError(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (parseInt(captchaAnswer) !== num1 + num2) {
      setCaptchaError(true);
      return;
    }
    setCaptchaError(false);
    setIsLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
      resetCaptcha();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Top Header - Government branding */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <GhmcLogo className="h-14 w-auto" />
            <div className="border-l border-gray-300 pl-4">
              <h1 className="text-base md:text-lg font-bold text-[#d97706] leading-tight">GREATER HYDERABAD MUNICIPAL CORPORATION</h1>
              <p className="text-xs text-gray-500">CivicOps — Civic Operations Portal</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-3 text-right">
            <div>
              <p className="text-sm font-semibold text-[#d97706]">Municipal Administration</p>
              <p className="text-[11px] text-gray-500">Government of Telangana</p>
            </div>
          </div>
        </div>
      </header>

      {/* Hero with login card */}
      <div className="relative flex-1 flex items-center min-h-[calc(100vh-140px)]">
        <HyderabadBackground />

        {/* Content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-16 flex justify-center lg:justify-end">
          {/* Login Card */}
          <div className="w-full max-w-md bg-slate-800/80 backdrop-blur-md rounded-xl shadow-2xl border border-white/10 p-8">
            <h2 className="text-2xl font-light text-white text-center mb-6">User Login</h2>

            {error && (
              <div className="mb-4 bg-red-500/20 border border-red-400/40 text-red-100 px-4 py-2.5 rounded-md text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Email address"
                className="w-full px-4 py-3 rounded-md text-sm bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400"
              />

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Password"
                  className="w-full px-4 py-3 pr-10 rounded-md text-sm bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>

              {/* Captcha */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-white/95 rounded-md px-4 py-3 text-gray-800 font-bold text-sm select-none">
                  <span>{num1}</span><span>+</span><span>{num2}</span>
                </div>
                <span className="text-white font-bold">=</span>
                <input
                  type="number"
                  value={captchaAnswer}
                  onChange={(e) => setCaptchaAnswer(e.target.value)}
                  required
                  placeholder="Answer"
                  className={`flex-1 min-w-0 px-3 py-3 rounded-md text-sm bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 ${captchaError ? 'ring-2 ring-red-400' : 'focus:ring-sky-400'}`}
                />
                <button type="button" onClick={resetCaptcha} className="px-3 py-3 bg-teal-500 text-white rounded-md text-sm hover:bg-teal-600 shrink-0">
                  Reset
                </button>
              </div>
              {captchaError && <p className="text-xs text-red-300">Incorrect captcha answer</p>}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-sky-400 to-blue-500 text-white rounded-full text-sm font-semibold hover:from-sky-500 hover:to-blue-600 disabled:opacity-50 shadow-lg transition-all"
              >
                {isLoading ? 'Signing in...' : 'Login'}
              </button>

              <div className="flex items-center justify-between pt-1">
                <Link href="/forgot-password" className="text-xs bg-white/95 text-gray-700 px-4 py-1.5 rounded-full hover:bg-white font-medium">
                  Forgot Password?
                </Link>
                <Link href="/register" className="text-xs text-white hover:underline">
                  Register as Citizen
                </Link>
              </div>
            </form>

            <div className="mt-6 p-3 bg-white/10 rounded-md text-[11px] text-white/80">
              <p className="font-semibold mb-1">Dev Login (password: Password123)</p>
              <p>admin@ghmc.gov.in · commissioner@ghmc.gov.in</p>
              <p>ward57.officer@ghmc.gov.in · citizen1@example.com</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#0f2d4a] text-white">
        <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="text-center md:text-left">
            <h3 className="font-semibold mb-2 text-sm tracking-wide">QUICK LINKS</h3>
            <Link href="/register" className="text-sky-300 text-sm hover:underline">Citizen Registration</Link>
          </div>
          <div className="text-center md:text-left">
            <h3 className="font-semibold mb-2 text-sm tracking-wide">REACH US</h3>
            <p className="text-sm text-gray-300">Office: 040-21111111</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
