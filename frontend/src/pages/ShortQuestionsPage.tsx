import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { documentsAPI, aiAPI } from '../services/api';
import type { Document, ShortQuestion } from '../types';
import {
  HelpCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Upload,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const ShortQuestionsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<number | ''>('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [questions, setQuestions] = useState<ShortQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const init = async () => {
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
    init();
  }, [searchParams]);

  const handleGenerate = async () => {
    if (!selectedDocId) {
      toast.error('Please select a document first');
      return;
    }

    try {
      setLoading(true);
      const res = await aiAPI.generateShortQuestions(Number(selectedDocId), numQuestions);
      setQuestions(res.data.questions);
      setRevealed({});
      toast.success('Short drill questions ready!');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to generate questions';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const toggleReveal = (idx: number) => {
    setRevealed((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const toggleAll = () => {
    const allRevealed = questions.every((_, i) => revealed[i]);
    const newState: Record<number, boolean> = {};
    questions.forEach((_, i) => {
      newState[i] = !allRevealed;
    });
    setRevealed(newState);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
          <HelpCircle className="text-primary-400" />
          <span>Short Q&A Revision Drill</span>
        </h1>
        <p className="text-sm text-dark-400 mt-1">
          Generate flashcard-style rapid question and answer sets from your materials
        </p>
      </div>

      {documents.length === 0 ? (
        <div className="glass-card p-12 text-center border border-dark-800">
          <HelpCircle className="w-12 h-12 text-dark-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-dark-200">No documents found</h3>
          <p className="text-xs text-dark-400 mt-1 max-w-sm mx-auto mb-4">
            Upload study notes first to generate revision flashcard questions.
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
          {/* Controls */}
          <div className="lg:col-span-1 space-y-5">
            <div className="glass-card p-6 border border-dark-700 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2">
                  Select Material
                </label>
                <select
                  value={selectedDocId}
                  onChange={(e) => setSelectedDocId(Number(e.target.value))}
                  className="input-field text-xs cursor-pointer"
                >
                  {documents.map((doc) => (
                    <option key={doc.id} value={doc.id} className="bg-dark-900">
                      {doc.original_filename}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2">
                  Question Count
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[3, 5, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setNumQuestions(num)}
                      className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                        numQuestions === num
                          ? 'bg-primary-600 border-primary-500 text-white'
                          : 'bg-dark-900/60 border-dark-800 text-dark-400 hover:border-dark-700'
                      }`}
                    >
                      {num} Questions
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading || !selectedDocId}
                className="w-full btn-primary flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="spinner" />
                    <span>Formulating Questions...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Generate Drill Set</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Cards Display */}
          <div className="lg:col-span-2">
            <div className="glass-card p-6 border border-dark-700 min-h-[480px] flex flex-col">
              <div className="flex items-center justify-between pb-4 border-b border-dark-800 mb-4">
                <h3 className="font-bold text-dark-100 text-sm">
                  {questions.length > 0 ? `Questions (${questions.length})` : 'Question Drill'}
                </h3>
                {questions.length > 0 && (
                  <button
                    onClick={toggleAll}
                    className="text-xs text-primary-400 hover:text-primary-300 transition-colors flex items-center gap-1 font-semibold"
                  >
                    {questions.every((_, i) => revealed[i]) ? (
                      <>
                        <EyeOff size={14} /> Hide All Answers
                      </>
                    ) : (
                      <>
                        <Eye size={14} /> Reveal All Answers
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto space-y-4">
                {loading ? (
                  <div className="h-full flex flex-col items-center justify-center py-20 text-center">
                    <div className="spinner-lg mb-4" />
                    <p className="text-sm font-semibold text-dark-200">Analyzing key concepts...</p>
                  </div>
                ) : questions.length > 0 ? (
                  questions.map((q, idx) => {
                    const isRevealed = !!revealed[idx];
                    return (
                      <div
                        key={idx}
                        className="p-5 rounded-2xl bg-dark-900/60 border border-dark-800 transition-all space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <span className="text-xs font-bold text-primary-400 bg-primary-500/10 px-2 py-0.5 rounded">
                            Q{idx + 1}
                          </span>
                          <button
                            onClick={() => toggleReveal(idx)}
                            className="text-xs text-dark-400 hover:text-dark-200 flex items-center gap-1"
                          >
                            <span>{isRevealed ? 'Hide Answer' : 'Show Answer'}</span>
                            {isRevealed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </div>

                        <p className="text-sm font-semibold text-dark-100">{q.question}</p>

                        {isRevealed ? (
                          <div className="p-3.5 rounded-xl bg-dark-800/80 border border-dark-700 text-xs text-dark-200 leading-relaxed animate-fade-in">
                            <span className="font-bold text-emerald-400 block mb-1">Model Answer:</span>
                            {q.answer}
                          </div>
                        ) : (
                          <div
                            onClick={() => toggleReveal(idx)}
                            className="p-3 rounded-xl border border-dashed border-dark-700 text-xs text-dark-500 text-center cursor-pointer hover:border-primary-500/40 hover:text-dark-400 transition-all"
                          >
                            Click to reveal model answer
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="h-full flex flex-col items-center justify-center py-20 text-center text-dark-400">
                    <HelpCircle className="w-12 h-12 text-dark-700 mb-3" />
                    <p className="text-sm font-medium text-dark-300">No questions generated yet</p>
                    <p className="text-xs text-dark-500 max-w-xs mt-1">
                      Select your material and click "Generate Drill Set" to practice active recall.
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
