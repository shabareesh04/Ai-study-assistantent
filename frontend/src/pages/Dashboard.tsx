import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../services/api';
import type { DashboardStats } from '../types';
import {
  FileText,
  Award,
  MessageSquare,
  TrendingUp,
  Brain,
  Upload,
  ArrowRight,
  Clock,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await dashboardAPI.getStats();
      setStats(res.data);
    } catch {
      // Fallback empty stats if not loaded yet
      setStats({
        total_documents: 0,
        total_quizzes: 0,
        total_questions_answered: 0,
        average_score: 0,
        best_score: 0,
        recent_activity: [],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Uploaded Documents',
      value: stats?.total_documents ?? 0,
      icon: FileText,
      color: 'from-blue-500/20 to-cyan-500/20 text-blue-400 border-blue-500/30',
      action: () => navigate('/documents'),
    },
    {
      title: 'Quizzes Completed',
      value: stats?.total_quizzes ?? 0,
      icon: Award,
      color: 'from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30',
      action: () => navigate('/quiz'),
    },
    {
      title: 'Questions Answered',
      value: stats?.total_questions_answered ?? 0,
      icon: MessageSquare,
      color: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30',
      action: () => navigate('/ask'),
    },
    {
      title: 'Average Quiz Score',
      value: `${stats?.average_score ?? 0}%`,
      icon: TrendingUp,
      color: 'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30',
      action: () => navigate('/quiz'),
    },
  ];

  const quickActions = [
    {
      title: 'Upload Study Material',
      description: 'Upload PDFs, Word docs, or notes to analyze with AI',
      icon: Upload,
      gradient: 'from-primary-600 to-blue-600',
      to: '/documents',
    },
    {
      title: 'Generate Document Summary',
      description: 'Get key takeaways, concept breakdown, or bullet points',
      icon: FileText,
      gradient: 'from-accent-600 to-purple-600',
      to: '/summary',
    },
    {
      title: 'Take AI Practice Quiz',
      description: 'Generate dynamic multiple choice questions to test your grasp',
      icon: Award,
      gradient: 'from-indigo-600 to-primary-600',
      to: '/quiz',
    },
    {
      title: 'AI Concept Explainer',
      description: 'Ask AI to explain complex ideas in simple terms with analogies',
      icon: Brain,
      gradient: 'from-violet-600 to-accent-600',
      to: '/explain',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Welcome banner */}
      <div className="relative overflow-hidden glass-card p-8 border border-dark-700 glow-primary">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-xs font-semibold">
            <Sparkles size={14} />
            <span>AI-Driven Learning Supercharger</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
            Accelerate Your Learning with <span className="gradient-text">StudyAI</span>
          </h1>
          <p className="mt-3 text-dark-300 text-sm sm:text-base leading-relaxed">
            Upload your lecture notes, syllabus, or textbooks. Get automated summaries,
            interactive quizzes, question answering, and easy-to-understand explanations in seconds.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/documents')}
              className="btn-primary inline-flex items-center gap-2 text-sm"
            >
              <Upload size={16} />
              <span>Upload Notes</span>
            </button>
            <button
              onClick={() => navigate('/explain')}
              className="btn-secondary inline-flex items-center gap-2 text-sm"
            >
              <Brain size={16} />
              <span>Explain Any Topic</span>
            </button>
          </div>
        </div>
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-80 h-80 bg-primary-600/15 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Stats overview */}
      <div>
        <h2 className="text-lg font-bold text-dark-100 mb-4 flex items-center gap-2">
          <span>Overview</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                onClick={card.action}
                className="stat-card glass-card-hover cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-dark-400">{card.title}</span>
                  <div className={`p-2.5 rounded-xl border bg-gradient-to-br ${card.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-2 text-2xl lg:text-3xl font-bold text-white tracking-tight">
                  {loading ? <span className="text-dark-500 text-lg">...</span> : card.value}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Launch Cards */}
      <div>
        <h2 className="text-lg font-bold text-dark-100 mb-4">Quick Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <div
                key={idx}
                onClick={() => navigate(action.to)}
                className="glass-card glass-card-hover p-6 flex flex-col justify-between cursor-pointer group"
              >
                <div>
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-r ${action.gradient} flex items-center justify-center text-white shadow-lg mb-4 group-hover:scale-105 transition-transform`}
                  >
                    <Icon size={22} />
                  </div>
                  <h3 className="font-bold text-base text-dark-100 mb-1 group-hover:text-primary-400 transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-xs text-dark-400 leading-relaxed">
                    {action.description}
                  </p>
                </div>
                <div className="mt-6 flex items-center text-xs font-semibold text-primary-400 gap-1">
                  <span>Open Tool</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="glass-card p-6 border border-dark-700">
        <h2 className="text-lg font-bold text-dark-100 mb-4 flex items-center justify-between">
          <span>Recent Activity</span>
          <button
            onClick={fetchStats}
            className="text-xs text-dark-400 hover:text-dark-200 transition-colors"
          >
            Refresh
          </button>
        </h2>

        {stats?.recent_activity && stats.recent_activity.length > 0 ? (
          <div className="divide-y divide-dark-800">
            {stats.recent_activity.map((act, i) => (
              <div key={i} className="py-3.5 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-dark-800 border border-dark-700 text-primary-400 mt-0.5">
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-dark-200">{act.title}</p>
                    <p className="text-xs text-dark-400 mt-0.5">{act.description}</p>
                    {act.document && (
                      <span className="inline-block mt-1 text-[11px] text-primary-400 bg-primary-500/10 px-2 py-0.5 rounded">
                        {act.document}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-[11px] text-dark-500 whitespace-nowrap flex items-center gap-1">
                  <Clock size={12} />
                  {act.date}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-dark-400">
            <Clock className="w-8 h-8 mx-auto mb-2 text-dark-600" />
            <p className="text-sm">No activity recorded yet.</p>
            <p className="text-xs text-dark-500 mt-1">
              Start by uploading your first document or trying a quiz!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
