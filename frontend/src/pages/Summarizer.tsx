import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { documentsAPI, aiAPI } from '../services/api';
import type { Document } from '../types';
import {
  FileText,
  Sparkles,
  Copy,
  Check,
  AlignLeft,
  List,
  BookOpen,
  Layers,
  ArrowRight,
  Upload,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const Summarizer: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<number | ''>('');
  const [summaryType, setSummaryType] = useState<string>('detailed');
  const [summary, setSummary] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadDocs = async () => {
      try {
        const res = await documentsAPI.list();
        setDocuments(res.data);
        const docParam = searchParams.get('doc');
        if (docParam) {
          setSelectedDocId(Number(docParam));
        } else if (res.data.length > 0) {
          setSelectedDocId(res.data[0].id);
        }
      } catch {
        toast.error('Failed to load documents');
      }
    };
    loadDocs();
  }, [searchParams]);

  const handleGenerateSummary = async () => {
    if (!selectedDocId) {
      toast.error('Please select a document first');
      return;
    }

    try {
      setLoading(true);
      const res = await aiAPI.summary(Number(selectedDocId), summaryType);
      setSummary(res.data.content);
      toast.success('Summary generated successfully!');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to generate summary with AI';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const summaryOptions = [
    {
      id: 'detailed',
      label: 'Comprehensive',
      icon: BookOpen,
      desc: 'Structured breakdown with headings, points, and deep review',
    },
    {
      id: 'short',
      label: 'Concise (3-5 Sentences)',
      icon: AlignLeft,
      desc: 'Quick executive takeaway for rapid revision',
    },
    {
      id: 'key_points',
      label: 'Bullet Points',
      icon: List,
      desc: 'High-impact bulleted list of essential principles',
    },
    {
      id: 'concepts',
      label: 'Core Concepts',
      icon: Layers,
      desc: 'Terminology, key definitions, and their significance',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
          <FileText className="text-primary-400" />
          <span>AI Document Summarizer</span>
        </h1>
        <p className="text-sm text-dark-400 mt-1">
          Turn long lectures, research papers, and textbook chapters into clear, distilled knowledge
        </p>
      </div>

      {documents.length === 0 ? (
        <div className="glass-card p-12 text-center border border-dark-800">
          <FileText className="w-12 h-12 text-dark-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-dark-200">No documents found</h3>
          <p className="text-xs text-dark-400 mt-1 max-w-sm mx-auto mb-4">
            You need to upload at least one PDF, DOCX, or TXT file before generating summaries.
          </p>
          <button
            onClick={() => navigate('/documents')}
            className="btn-primary inline-flex items-center gap-2 text-xs"
          >
            <Upload size={14} />
            <span>Upload Document</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls Panel */}
          <div className="lg:col-span-1 space-y-6">
            <div className="glass-card p-6 border border-dark-700 space-y-5">
              {/* Document selection */}
              <div>
                <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2">
                  Select Material
                </label>
                <select
                  value={selectedDocId}
                  onChange={(e) => setSelectedDocId(Number(e.target.value))}
                  className="input-field cursor-pointer"
                >
                  {documents.map((doc) => (
                    <option key={doc.id} value={doc.id} className="bg-dark-900 text-dark-100">
                      {doc.original_filename}
                    </option>
                  ))}
                </select>
              </div>

              {/* Summary Mode */}
              <div>
                <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2">
                  Summary Style
                </label>
                <div className="space-y-2">
                  {summaryOptions.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = summaryType === opt.id;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => setSummaryType(opt.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-primary-600/15 border-primary-500/50 text-white'
                            : 'bg-dark-900/60 border-dark-800 text-dark-400 hover:border-dark-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon
                            size={16}
                            className={isSelected ? 'text-primary-400' : 'text-dark-500'}
                          />
                          <span className="text-xs font-semibold">{opt.label}</span>
                        </div>
                        <p className="text-[11px] text-dark-400 mt-1 pl-6">{opt.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={handleGenerateSummary}
                disabled={loading || !selectedDocId}
                className="w-full btn-primary flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="spinner" />
                    <span>Analyzing & Summarizing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Generate Summary</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Output Display */}
          <div className="lg:col-span-2">
            <div className="glass-card p-6 border border-dark-700 min-h-[480px] flex flex-col">
              <div className="flex items-center justify-between pb-4 border-b border-dark-800 mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-primary-400 w-4 h-4" />
                  <h3 className="font-bold text-dark-100 text-sm">
                    {summary ? 'AI Generated Summary' : 'Summary Preview'}
                  </h3>
                </div>
                {summary && (
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
                    <p className="text-sm font-semibold text-dark-200">Reading your notes...</p>
                    <p className="text-xs text-dark-400 mt-1">
                      Gemini is extracting high-yield takeaways for you
                    </p>
                  </div>
                ) : summary ? (
                  <div className="prose-content whitespace-pre-line text-sm text-dark-200 leading-relaxed">
                    {summary}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center py-20 text-center text-dark-400">
                    <BookOpen className="w-12 h-12 text-dark-700 mb-3" />
                    <p className="text-sm font-medium text-dark-300">No summary generated yet</p>
                    <p className="text-xs text-dark-500 max-w-xs mt-1">
                      Choose your document and summary style on the left, then click Generate Summary.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
