import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Files,
  FileText,
  MessageSquare,
  Award,
  Brain,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/documents', label: 'My Documents', icon: Files },
    { to: '/summary', label: 'AI Summarizer', icon: FileText },
    { to: '/ask', label: 'Ask Documents', icon: MessageSquare },
    { to: '/quiz', label: 'Quiz & Practice', icon: Award },
    { to: '/explain', label: 'AI Explainer', icon: Brain },
    { to: '/questions', label: 'Short Q&A Drill', icon: HelpCircle },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 glass-card rounded-none border-r border-dark-800 bg-dark-900/90 backdrop-blur-xl flex flex-col transition-transform duration-300 md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-dark-800">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 via-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-600/30">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-dark-100 tracking-tight flex items-center gap-1.5">
              Study<span className="gradient-text font-black">AI</span>
            </h1>
            <p className="text-[11px] font-medium text-dark-400 uppercase tracking-wider">
              Smart Assistant
            </p>
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <p className="px-3 pb-2 text-[11px] font-bold text-dark-400 uppercase tracking-wider">
            Workspace
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={onClose}
                className={({ isActive }) =>
                  isActive ? 'sidebar-link-active' : 'sidebar-link'
                }
              >
                <Icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Quick status footer */}
        <div className="p-4 m-4 rounded-xl bg-gradient-to-br from-dark-800 to-dark-900 border border-dark-700/60 text-xs text-dark-400">
          <div className="flex items-center gap-2 mb-1 text-dark-200 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>AI Ready</span>
          </div>
          <p className="text-[11px] text-dark-400">
            Upload notes, lecture slides, or textbooks to instantly generate summaries & quizzes.
          </p>
        </div>
      </aside>
    </>
  );
};
