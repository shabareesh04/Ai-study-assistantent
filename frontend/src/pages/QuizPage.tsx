import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { documentsAPI, quizzesAPI } from '../services/api';
import type { Document, Quiz, QuizResult } from '../types';
import {
  Award,
  Sparkles,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Plus,
  BarChart2,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const QuizPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [pastQuizzes, setPastQuizzes] = useState<Quiz[]>([]);
  const [loadingPast, setLoadingPast] = useState(true);

  // Generator State
  const [selectedDocId, setSelectedDocId] = useState<number | ''>('');
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<string>('medium');
  const [generating, setGenerating] = useState(false);

  // Active Quiz State
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);

  // Load documents and past quizzes
  useEffect(() => {
    const init = async () => {
      try {
        const [docsRes, quizzesRes] = await Promise.all([
          documentsAPI.list(),
          quizzesAPI.list().catch(() => ({ data: [] })),
        ]);
        setDocuments(docsRes.data);
        setPastQuizzes(quizzesRes.data);

        const docParam = searchParams.get('doc');
        if (docParam) {
          setSelectedDocId(Number(docParam));
        } else if (docsRes.data.length > 0) {
          setSelectedDocId(docsRes.data[0].id);
        }
      } catch {
        toast.error('Failed to load quiz data');
      } finally {
        setLoadingPast(false);
      }
    };
    init();
  }, [searchParams]);

  const handleGenerateQuiz = async () => {
    if (!selectedDocId) {
      toast.error('Please select a document first');
      return;
    }

    try {
      setGenerating(true);
      const res = await quizzesAPI.generate(Number(selectedDocId), numQuestions, difficulty);
      setActiveQuiz(res.data);
      setCurrentIndex(0);
      setAnswers({});
      setQuizResult(null);
      toast.success('Quiz generated successfully!');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to generate quiz with AI';
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  };

  const handleSelectOption = (questionId: number, optionLetter: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId.toString()]: optionLetter,
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return;
    try {
      setSubmitting(true);
      const res = await quizzesAPI.submit(activeQuiz.id, answers);
      setQuizResult(res.data);
      toast.success('Quiz completed! Check your score below.');
      // Refresh past quizzes
      const updated = await quizzesAPI.list();
      setPastQuizzes(updated.data);
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to submit quiz';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLoadPastQuiz = async (quizId: number) => {
    try {
      const res = await quizzesAPI.get(quizId);
      setActiveQuiz(res.data);
      setCurrentIndex(0);
      if (res.data.status === 'completed') {
        // Prepare result view
        setQuizResult({
          quiz_id: res.data.id,
          score: res.data.score || 0,
          total_questions: res.data.total_questions,
          percentage: Math.round(
            ((res.data.score || 0) / (res.data.total_questions || 1)) * 100
          ),
          correct: res.data.score || 0,
          incorrect: res.data.total_questions - (res.data.score || 0),
          questions: res.data.questions,
        });
      } else {
        setQuizResult(null);
        setAnswers({});
      }
    } catch {
      toast.error('Failed to load quiz');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
          <Award className="text-primary-400" />
          <span>Interactive AI Quizzes</span>
        </h1>
        <p className="text-sm text-dark-400 mt-1">
          Generate custom assessments from your study materials to master key concepts
        </p>
      </div>

      {/* QUIZ RESULT VIEW */}
      {quizResult && (
        <div className="glass-card p-6 lg:p-8 border border-dark-700 glow-primary space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-dark-800">
            <div>
              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-primary-500/10 text-primary-400 border border-primary-500/20">
                Quiz Evaluation
              </span>
              <h2 className="text-2xl font-bold text-white mt-2">
                Score: {quizResult.score} / {quizResult.total_questions} (
                {quizResult.percentage}%)
              </h2>
            </div>
            <button
              onClick={() => {
                setActiveQuiz(null);
                setQuizResult(null);
              }}
              className="btn-secondary py-2 px-4 text-xs inline-flex items-center gap-2 self-start"
            >
              <Plus size={14} />
              <span>Create New Quiz</span>
            </button>
          </div>

          {/* Results summary stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-dark-900/60 border border-dark-800 text-center">
              <span className="text-xs text-dark-400">Total Questions</span>
              <p className="text-xl font-bold text-white mt-1">{quizResult.total_questions}</p>
            </div>
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
              <span className="text-xs text-emerald-400 font-medium">Correct</span>
              <p className="text-xl font-bold text-emerald-400 mt-1">{quizResult.correct}</p>
            </div>
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center">
              <span className="text-xs text-rose-400 font-medium">Incorrect</span>
              <p className="text-xl font-bold text-rose-400 mt-1">{quizResult.incorrect}</p>
            </div>
          </div>

          {/* Detailed Question Review */}
          <div className="space-y-4">
            <h3 className="font-bold text-dark-200 text-sm">Detailed Review & Explanations</h3>
            {quizResult.questions.map((q, idx) => {
              const isCorrect = q.user_answer === q.correct_answer;
              return (
                <div
                  key={q.id || idx}
                  className={`p-5 rounded-2xl border ${
                    isCorrect
                      ? 'bg-emerald-500/5 border-emerald-500/20'
                      : 'bg-rose-500/5 border-rose-500/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-semibold text-xs text-dark-400">Question {idx + 1}</span>
                    {isCorrect ? (
                      <span className="flex items-center gap-1 text-xs text-emerald-400 font-semibold">
                        <CheckCircle size={14} /> Correct
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-rose-400 font-semibold">
                        <XCircle size={14} /> Incorrect
                      </span>
                    )}
                  </div>

                  <p className="font-semibold text-dark-100 text-sm mt-1">{q.question}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                    {[
                      { key: 'A', text: q.option_a },
                      { key: 'B', text: q.option_b },
                      { key: 'C', text: q.option_c },
                      { key: 'D', text: q.option_d },
                    ].map((opt) => {
                      const isOptionCorrect = q.correct_answer === opt.key;
                      const isOptionUser = q.user_answer === opt.key;
                      return (
                        <div
                          key={opt.key}
                          className={`p-2.5 rounded-xl text-xs flex items-center gap-2 border ${
                            isOptionCorrect
                              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-semibold'
                              : isOptionUser
                              ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 font-semibold'
                              : 'bg-dark-900/40 border-dark-800 text-dark-400'
                          }`}
                        >
                          <span className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] bg-dark-800">
                            {opt.key}
                          </span>
                          <span>{opt.text}</span>
                        </div>
                      );
                    })}
                  </div>

                  {q.explanation && (
                    <div className="mt-3 p-3 rounded-xl bg-dark-900/70 border border-dark-800 text-xs text-dark-300 leading-relaxed">
                      <span className="font-semibold text-primary-400">Explanation: </span>
                      {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ACTIVE QUIZ TAKER */}
      {activeQuiz && !quizResult && (
        <div className="glass-card p-6 lg:p-8 border border-dark-700 max-w-3xl mx-auto space-y-6">
          {/* Progress bar */}
          <div className="flex items-center justify-between text-xs text-dark-400">
            <span>
              Question {currentIndex + 1} of {activeQuiz.questions.length}
            </span>
            <span>
              {Object.keys(answers).length} of {activeQuiz.questions.length} answered
            </span>
          </div>
          <div className="w-full h-2 bg-dark-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all duration-300"
              style={{
                width: `${
                  ((currentIndex + 1) / (activeQuiz.questions.length || 1)) * 100
                }%`,
              }}
            />
          </div>

          {/* Current Question */}
          {activeQuiz.questions[currentIndex] && (
            <div className="space-y-6">
              <h2 className="text-lg lg:text-xl font-bold text-white leading-relaxed">
                {activeQuiz.questions[currentIndex].question}
              </h2>

              <div className="space-y-3">
                {[
                  {
                    key: 'A',
                    text: activeQuiz.questions[currentIndex].option_a,
                  },
                  {
                    key: 'B',
                    text: activeQuiz.questions[currentIndex].option_b,
                  },
                  {
                    key: 'C',
                    text: activeQuiz.questions[currentIndex].option_c,
                  },
                  {
                    key: 'D',
                    text: activeQuiz.questions[currentIndex].option_d,
                  },
                ].map((opt) => {
                  const currentQId = activeQuiz.questions[currentIndex].id;
                  const isSelected = answers[currentQId.toString()] === opt.key;
                  return (
                    <div
                      key={opt.key}
                      onClick={() => handleSelectOption(currentQId, opt.key)}
                      className={`p-4 rounded-xl border cursor-pointer flex items-center gap-3 transition-all ${
                        isSelected
                          ? 'bg-primary-600/20 border-primary-500 text-white shadow-md shadow-primary-500/10'
                          : 'bg-dark-900/60 border-dark-800 text-dark-300 hover:border-dark-700 hover:bg-dark-800/60'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                          isSelected
                            ? 'bg-primary-500 text-white'
                            : 'bg-dark-800 text-dark-400'
                        }`}
                      >
                        {opt.key}
                      </div>
                      <span className="text-sm font-medium">{opt.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Navigation controls */}
          <div className="flex items-center justify-between pt-6 border-t border-dark-800">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="btn-secondary py-2 px-4 text-xs inline-flex items-center gap-1.5"
            >
              <ArrowLeft size={14} />
              <span>Previous</span>
            </button>

            {currentIndex < activeQuiz.questions.length - 1 ? (
              <button
                onClick={() =>
                  setCurrentIndex((prev) =>
                    Math.min(activeQuiz.questions.length - 1, prev + 1)
                  )
                }
                className="btn-primary py-2 px-5 text-xs inline-flex items-center gap-1.5"
              >
                <span>Next Question</span>
                <ArrowRight size={14} />
              </button>
            ) : (
              <button
                onClick={handleSubmitQuiz}
                disabled={submitting}
                className="btn-primary py-2 px-6 text-xs inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600"
              >
                {submitting ? <div className="spinner" /> : <CheckCircle size={15} />}
                <span>Submit Quiz</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* QUIZ GENERATOR & PAST QUIZZES (Visible when no active quiz session) */}
      {!activeQuiz && !quizResult && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quiz Generator Form */}
          <div className="lg:col-span-1 glass-card p-6 border border-dark-700 space-y-5">
            <h2 className="text-base font-bold text-dark-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary-400" />
              <span>Generate New Quiz</span>
            </h2>

            <div>
              <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2">
                Select Study Material
              </label>
              <select
                value={selectedDocId}
                onChange={(e) => setSelectedDocId(Number(e.target.value))}
                className="input-field cursor-pointer text-xs"
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
                Number of Questions
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[5, 10, 20].map((num) => (
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
                    {num} Qs
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2">
                Difficulty Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['easy', 'medium', 'hard'].map((diff) => (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setDifficulty(diff)}
                    className={`py-2 text-xs font-semibold capitalize rounded-xl border transition-all ${
                      difficulty === diff
                        ? 'bg-primary-600 border-primary-500 text-white'
                        : 'bg-dark-900/60 border-dark-800 text-dark-400 hover:border-dark-700'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerateQuiz}
              disabled={generating || !selectedDocId}
              className="w-full btn-primary flex items-center justify-center gap-2 mt-4"
            >
              {generating ? (
                <>
                  <div className="spinner" />
                  <span>Synthesizing MCQs...</span>
                </>
              ) : (
                <>
                  <Award size={16} />
                  <span>Start AI Quiz</span>
                </>
              )}
            </button>
          </div>

          {/* Past Quizzes List */}
          <div className="lg:col-span-2 glass-card p-6 border border-dark-700">
            <h2 className="text-base font-bold text-dark-100 mb-4 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-primary-400" />
              <span>Past Quizzes & Results</span>
            </h2>

            {loadingPast ? (
              <div className="flex items-center justify-center py-16">
                <div className="spinner-lg" />
              </div>
            ) : pastQuizzes.length === 0 ? (
              <div className="text-center py-14 text-dark-400">
                <Award className="w-12 h-12 text-dark-700 mx-auto mb-3" />
                <p className="text-sm font-semibold text-dark-300">No quizzes generated yet</p>
                <p className="text-xs text-dark-500 mt-1">
                  Choose a document and click "Start AI Quiz" to test your knowledge!
                </p>
              </div>
            ) : (
              <div className="divide-y divide-dark-800">
                {pastQuizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    onClick={() => handleLoadPastQuiz(quiz.id)}
                    className="py-3.5 flex items-center justify-between gap-4 cursor-pointer hover:bg-dark-800/40 px-2 rounded-xl transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-dark-800 border border-dark-700 flex items-center justify-center text-primary-400 group-hover:scale-105 transition-transform">
                        <Award size={18} />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-dark-100 group-hover:text-primary-400 transition-colors">
                          {quiz.title}
                        </h4>
                        <div className="flex items-center gap-3 text-[11px] text-dark-400 mt-0.5">
                          <span className="capitalize">{quiz.difficulty}</span>
                          <span>•</span>
                          <span>{quiz.total_questions} Questions</span>
                          <span>•</span>
                          <span>{new Date(quiz.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {quiz.status === 'completed' ? (
                        <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                          {quiz.score}/{quiz.total_questions}
                        </span>
                      ) : (
                        <span className="text-xs text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                          Incomplete
                        </span>
                      )}
                      <ChevronRight size={16} className="text-dark-500 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
