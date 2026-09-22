import React, { useState } from 'react';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { X, Lock, Mail, User as UserIcon, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
}) => {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (isLogin) {
        const res = await authAPI.login({ email, password });
        login(res.data.access_token);
        onClose();
      } else {
        await authAPI.register({ name, email, password });
        toast.success('Registration successful! Logging you in...');
        const res = await authAPI.login({ email, password });
        login(res.data.access_token);
        onClose();
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Authentication failed. Please try again.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md p-8 glass-card border border-dark-700 glow-primary">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-dark-400 hover:text-dark-100 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 mb-3 rounded-2xl bg-gradient-to-tr from-primary-600 to-accent-600 shadow-lg shadow-primary-600/30">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-dark-100">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-sm text-dark-400 mt-1">
            {isLogin
              ? 'Access your AI study materials and quizzes'
              : 'Join to revolutionize your study workflow'}
          </p>
        </div>

        <div className="flex p-1 mb-6 bg-dark-900/80 rounded-xl border border-dark-800">
          <button
            type="button"
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
              isLogin
                ? 'bg-primary-600 text-white shadow'
                : 'text-dark-400 hover:text-dark-200'
            }`}
            onClick={() => setIsLogin(true)}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
              !isLogin
                ? 'bg-primary-600 text-white shadow'
                : 'text-dark-400 hover:text-dark-200'
            }`}
            onClick={() => setIsLogin(false)}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-3.5 w-5 h-5 text-dark-500" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Mercer"
                  className="input-field pl-11"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-5 h-5 text-dark-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@university.edu"
                className="input-field pl-11"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-5 h-5 text-dark-500" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field pl-11"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full btn-primary flex items-center justify-center gap-2 mt-6"
          >
            {submitting ? (
              <div className="spinner" />
            ) : (
              <span>{isLogin ? 'Sign In' : 'Create Free Account'}</span>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-dark-400 mt-5">
          Backend also supports guest session mode for instant testing!
        </p>
      </div>
    </div>
  );
};
