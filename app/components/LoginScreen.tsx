
import React, { useState } from 'react';
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from '../services/firebaseService';
import { LogoIcon, GoogleLogoIcon, CheckCircleIcon, VisibilityIcon, VisibilityOffIcon } from './icons';

const Feature: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <li className="flex items-start gap-3">
    <CheckCircleIcon className="w-6 h-6 text-indigo-300 flex-shrink-0" />
    <span className="text-indigo-100">{children}</span>
  </li>
);

const LoginScreen: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Error signing in with Google', error);
      setError('Failed to sign in with Google. Please try again.');
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    
    if (isSignUp && password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
    }

    setIsLoading(true);
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err: any) {
      setError(err.message.replace('Firebase: ', ''));
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAuthMode = () => {
      setIsSignUp(!isSignUp);
      setError(null);
      setPassword('');
      setConfirmPassword('');
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left Branding Pane */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-gray-900 to-indigo-900 text-white">
        <div>
          <div className="flex items-center gap-3">
            <LogoIcon className="w-10 h-10 text-white" />
            <h1 className="text-3xl font-bold text-white">Seeker</h1>
          </div>
          <p className="mt-4 text-lg text-indigo-200 max-w-lg">
            Your autonomous AI partner for deep, cited, and transparent research.
          </p>
        </div>
        
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-white">Unlock Deeper Insights. Faster.</h2>
            <ul className="space-y-4 text-lg">
                <Feature>Harness AI-driven multi-step research planning and execution.</Feature>
                <Feature>Receive answers with clear citations and provenance from verifiable sources.</Feature>
                <Feature>Maintain context across sessions with personalized long-term memory.</Feature>
            </ul>
        </div>
        
        <div className="text-sm text-indigo-300">
          &copy; {new Date().getFullYear()} Seeker AI. All rights reserved.
        </div>
      </div>

      {/* Right Login Pane */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8">
        <div className="max-w-md w-full">
          <div className="text-center">
            <div className="lg:hidden mb-8">
                <LogoIcon className="mx-auto h-12 w-auto text-indigo-600" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              {isSignUp ? 'Create an account' : 'Sign in to your account'}
            </h2>
            <p className="mt-4 text-base text-gray-600">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button onClick={toggleAuthMode} className="font-medium text-indigo-600 hover:text-indigo-500">
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleEmailAuth}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-4 py-3 text-gray-900 bg-white border border-gray-300 shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="password"className="block text-sm font-medium text-gray-700">Password</label>
              <div className="relative mt-1">
                <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={isSignUp ? "new-password" : "current-password"}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full px-4 py-3 pr-12 text-gray-900 bg-white border border-gray-300 shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center px-4 text-gray-500 hover:text-gray-700 focus:outline-none"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                >
                    {showPassword ? (
                        <VisibilityOffIcon className="h-5 w-5" />
                    ) : (
                        <VisibilityIcon className="h-5 w-5" />
                    )}
                </button>
              </div>
            </div>

            {isSignUp && (
              <div>
                <label htmlFor="confirm-password"className="block text-sm font-medium text-gray-700">Confirm Password</label>
                <div className="relative mt-1">
                  <input
                      id="confirm-password"
                      name="confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="block w-full px-4 py-3 pr-12 text-gray-900 bg-white border border-gray-300 shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
                  />
                  <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 flex items-center px-4 text-gray-500 hover:text-gray-700 focus:outline-none"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                      {showConfirmPassword ? (
                          <VisibilityOffIcon className="h-5 w-5" />
                      ) : (
                          <VisibilityIcon className="h-5 w-5" />
                      )}
                  </button>
                </div>
              </div>
            )}

            {error && <p className="text-sm text-red-600 text-center">{error}</p>}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 transition-colors"
              >
                {isLoading ? <div className="w-5 h-5 border-2 border-t-white border-gray-200 rounded-full animate-spin"></div> : (isSignUp ? 'Create Account' : 'Sign In')}
              </button>
            </div>
          </form>

          <div className="mt-6 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>
          
          <div className="mt-6">
            <button
                onClick={handleGoogleLogin}
                type="button"
                className="w-full inline-flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 text-sm font-medium shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
                <GoogleLogoIcon className="w-5 h-5" />
                Sign in with Google
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
