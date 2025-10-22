import React, { useState } from 'react';
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from '../services/firebaseService';
import { LogoIcon, GoogleLogoIcon, CheckCircleIcon } from './icons';

const Feature: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <li className="flex items-start gap-3">
    <CheckCircleIcon className="w-6 h-6 text-indigo-300 mt-1 flex-shrink-0" />
    <span className="text-indigo-100">{children}</span>
  </li>
);

const LoginScreen: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
    setIsLoading(true);
    setError(null);
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
        // On successful sign-up, Firebase auth state change will handle navigation
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err: any) {
      setError(err.message.replace('Firebase: ', ''));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left Branding Pane */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-gray-900 to-indigo-900 text-white">
        <div>
          <div className="flex items-center gap-3">
            <LogoIcon className="w-10 h-10 text-white" />
            <h1 className="text-3xl font-bold">Seeker</h1>
          </div>
          <p className="mt-4 text-lg text-indigo-200 max-w-lg">
            Your autonomous AI partner for deep, cited, and transparent research.
          </p>
        </div>
        
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Unlock Deeper Insights. Faster.</h2>
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
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="text-center max-w-md w-full">
          <div className="lg:hidden mb-12">
            <LogoIcon className="mx-auto h-12 w-auto text-indigo-600" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {isSignUp ? 'Create an account' : 'Sign in to your account'}
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            {isSignUp ? 'to start your research' : 'to continue your research'}
          </p>

          <form className="mt-8 text-left space-y-6" onSubmit={handleEmailAuth}>
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
                className="mt-1 block w-full px-3 py-2 border border-gray-200 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
              />
            </div>
            <div>
              <label htmlFor="password"className="block text-sm font-medium text-gray-700">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isSignUp ? "new-password" : "current-password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-200 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
              />
            </div>

            {error && <p className="text-sm text-red-600 text-center">{error}</p>}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 transition-colors"
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
          
          <button
            onClick={handleGoogleLogin}
            type="button"
            className="mt-6 w-full inline-flex items-center justify-center gap-3 px-6 py-3 border border-gray-200 text-base font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
          >
            <GoogleLogoIcon className="w-5 h-5" />
            Sign in with Google
          </button>

          <p className="mt-8 text-sm text-center">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button onClick={() => { setIsSignUp(!isSignUp); setError(null); }} className="font-medium text-indigo-600 hover:text-indigo-500">
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>

        </div>
      </div>
    </div>
  );
};

export default LoginScreen;