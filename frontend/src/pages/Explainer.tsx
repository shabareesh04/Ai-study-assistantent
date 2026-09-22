import React, { useState, useEffect } from 'react';
import { documentsAPI, aiAPI } from '../services/api';
import type { Document } from '../types';
import {
  Brain,
  Sparkles,
  Copy,
  Check,
  Zap,
  GraduationCap,
  Briefcase,
  Layers,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const Explainer: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [topic, setTopic] = useState('');
  const [mode, setMode] = useState('simple');
  const [selectedDocId, setSelectedDocId] = useState<number | ''>('');
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    documentsAPI
      .list()
      .then((res) => setDocuments(res.data))
      .catch(() => {});
  }, []);

  const handleExplain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      toast.error('Please enter a concept or topic');
      return;
    }

    try {
      setLoading(true);
      const res = await aiAPI.explain(
        topic.trim(),
        mode,
        selectedDocId ? Number(selectedDocId) : undefined
      );
      setExplanation(res.data.explanation);
      toast.success('Explanation ready!');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to generate explanation';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!explanation) return;
    navigator.clipboard.writeText(explanation);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const modes = [
    {
      id: 'simple',
      label: 'Simple & Analogy',
      icon: Zap,
      desc: 'Explains using intuitive everyday metaphors',
    },
    {
      id: 'beginner',
      label: 'Complete Beginner',
      icon: GraduationCap,
      desc: 'No prior knowledge assumed, clear step-by-step',
    },
    {
      id: 'detailed',
      label: 'In-Depth Academic',
      icon: Layers,
      desc: 'Comprehensive rigor, definitions, and applications',
    },
    {
      id: 'interview',
      label: 'Interview Ready',
      icon: Briefcase,
      desc: 'Common questions, best practices, and talking points',
    },
  ];

  const suggestedTopics = [
    'How does Gradient Descent work?',
    'Explain REST vs GraphQL',
    'What is Polymorphism in OOP?',
    'How do Transformers (LLMs) work?',
    'Explain CAP Theorem simply',
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
          <Brain className="text-primary-400" />
          <span>AI Concept Explainer</span>
        </h1>
        <p className="text-sm text-dark-400 mt-1">
          Demystify any difficult academic concept or theory tailored to your desired depth
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input & Parameters */}
        <div className="lg:col-span-1 space-y-6">
          <form onSubmit={handleExplain} className="glass-card p-6 border border-dark-700 space-y-5">
            <div>
              <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2">
                Concept or Topic
              </label>
              <textarea
                rows={3}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Dynamic Programming, Eigenvalues, Photosynthesis..."
                className="input-field text-sm resize-none"
              />
            </div>

            {/* Quick suggestions */}
            <div>
              <span className="text-[11px] font-semibold text-dark-400 uppercase tracking-wider block mb-2">
                Try an example
              </span>
              <div className="flex flex-wrap gap-1.5">
                {suggestedTopics.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setTopic(s)}
                    className="text-[11px] bg-dark-800 hover:bg-dark-700 text-dark-300 hover:text-white px-2.5 py-1 rounded-lg border border-dark-700/60 transition-colors text-left"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Tone / Mode */}
            <div>
              <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2">
                Explanation Style
              </label>
              <div className="space-y-2">
                {modes.map((m) => {
                  const Icon = m.icon;
                  const isSelected = mode === m.id;
                  return (
                    <div
                      key={m.id}
                      onClick={() => setMode(m.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-primary-600/20 border-primary-500/60 text-white'
                          : 'bg-dark-900/60 border-dark-800 text-dark-400 hover:border-dark-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon size={16} className={isSelected ? 'text-primary-400' : 'text-dark-500'} />
                        <span className="text-xs font-semibold">{m.label}</span>
                      </div>
                      <p className="text-[11px] text-dark-400 mt-1 pl-6">{m.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Optional document attachment */}
            {documents.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2">
                  Context Document (Optional)
                </label>
                <select
                  value={selectedDocId}
                  onChange={(e) =>
                    setSelectedDocId(e.target.value ? Number(e.target.value) : '')
                  }
                  className="input-field text-xs cursor-pointer"
                >
                  <option value="" className="bg-dark-900">
                    None (Use General AI Knowledge)
                  </option>
                  {documents.map((d) => (
                    <option key={d.id} value={d.id} className="bg-dark-900">
                      From: {d.original_filename}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !topic.trim()}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="spinner" />
                  <span>Synthesizing Explanation...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Explain Concept</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Output Panel */}
        <div className="lg:col-span-2">
          <div className="glass-card p-6 border border-dark-700 min-h-[480px] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-dark-800 mb-4">
              <div className="flex items-center gap-2">
                <Brain className="text-primary-400 w-4 h-4" />
                <h3 className="font-bold text-dark-100 text-sm">
                  {explanation ? `Explanation: ${topic}` : 'Output Explanation'}
                </h3>
              </div>
              {explanation && (
                <button
                  onClick={handleCopy}
                  className="p-1.5 text-xs text-dark-300 hover:text-white bg-dark-800 hover:bg-dark-700 border border-dark-700 rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center py-20 text-center">
                  <div className="spinner-lg mb-4" />
                  <p className="text-sm font-semibold text-dark-200">Crafting intuitive breakdown...</p>
                  <p className="text-xs text-dark-400 mt-1">Adapting depth and analogies for you</p>
                </div>
              ) : explanation ? (
                <div className="prose-content whitespace-pre-line text-sm text-dark-200 leading-relaxed">
                  {explanation}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center py-20 text-center text-dark-400">
                  <Brain className="w-12 h-12 text-dark-700 mb-3" />
                  <p className="text-sm font-medium text-dark-300">Enter a concept to get started</p>
                  <p className="text-xs text-dark-500 max-w-xs mt-1">
                    Select your preferred style and get structured explanations instantly.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
