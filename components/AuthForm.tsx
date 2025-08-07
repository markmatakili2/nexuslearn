import React, { useState } from 'react';
import { UserIcon, LockClosedIcon, AcademicCapIcon, EyeIcon, EyeSlashIcon } from './common/IconComponents';
import { MOCK_SCHOOL_NAME_DISPLAY } from '../constants';

interface LoginFormProps {
  onLogin: (username: string, password_param: string) => void; // renamed password to password_param
  isLoading: boolean;
  error: string | null;
  schoolNameDomain: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin, isLoading, error, schoolNameDomain }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(username, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700 dark:from-primary-700 dark:to-primary-900 p-4">
      <div className="bg-white dark:bg-slate-800 p-8 md:p-12 rounded-xl shadow-2xl w-full max-w-md transform transition-all hover:scale-105 duration-300">
        <div className="text-center mb-8">
          <AcademicCapIcon className="w-20 h-20 text-primary-600 dark:text-primary-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-100">{MOCK_SCHOOL_NAME_DISPLAY}</h1>
          <p className="text-gray-500 dark:text-slate-400">Exam Portal Login</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserIcon className="h-5 w-5 text-gray-400 dark:text-slate-400" />
              </div>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className="appearance-none block w-full px-3 py-3 pl-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 dark:placeholder-slate-400"
                placeholder={`e.g., principal@${schoolNameDomain}`}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label htmlFor="password_param" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LockClosedIcon className="h-5 w-5 text-gray-400 dark:text-slate-400" />
              </div>
              <input
                id="password_param"
                name="password_param"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                className="appearance-none block w-full px-3 py-3 pl-10 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 dark:placeholder-slate-400"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-500 dark:text-slate-400 dark:hover:text-slate-300 focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-300 p-3 rounded-md">{error}</p>}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition duration-150"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        </form>
        <div className="mt-6 text-center text-xs text-gray-500 dark:text-slate-400">
          <p>Teachers: Use yourFirstNameLastName@{schoolNameDomain}</p>
          <p>Parents: Use studentFirstName@{schoolNameDomain.replace(/\s+/g, '')}</p>
          <p className="mt-2">Contact admin for password/access issues.</p>
        </div>
      </div>
    </div>
  );
};