import React from 'react';
import { Menu, User as UserIcon, LogIn, LogOut, Upload, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface NavbarProps {
  onToggleSidebar: () => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, onOpenAuth }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-20 h-16 border-b border-dark-800 bg-dark-950/80 backdrop-blur-xl px-4 lg:px-8 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 text-dark-400 hover:text-dark-100 hover:bg-dark-800 rounded-lg md:hidden transition-colors"
          aria-label="Toggle menu"
        >
          <Menu size={22} />
        </button>

        <div className="hidden sm:flex items-center gap-2">
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-primary-500/10 text-primary-400 border border-primary-500/20 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            AI Study Partner
          </span>
          <span className="text-xs text-dark-500">FastAPI & Gemini Engine</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/documents')}
          className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-dark-800 hover:bg-dark-700 text-dark-200 hover:text-white rounded-xl border border-dark-700 transition-all"
        >
          <Upload size={14} />
          <span>Upload Document</span>
        </button>

        {user ? (
          <div className="flex items-center gap-3 pl-2 border-l border-dark-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-600 to-accent-600 flex items-center justify-center font-bold text-xs text-white uppercase">
                {user.name ? user.name[0] : 'U'}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-semibold text-dark-200 leading-tight">
                  {user.name || 'Student'}
                </p>
                <p className="text-[10px] text-dark-400 leading-tight">
                  {user.email || 'student@example.com'}
                </p>
              </div>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 text-dark-400 hover:text-red-400 hover:bg-dark-800/80 rounded-lg transition-colors"
            >
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-primary-600 hover:bg-primary-500 text-white rounded-xl shadow-md shadow-primary-600/20 transition-all"
          >
            <LogIn size={14} />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};
