import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { documentsAPI, aiAPI } from '../services/api';
import type { Document, Conversation } from '../types';
import {
  MessageSquare,
  Send,
  Sparkles,
  User,
  Bot,
  Upload,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const DocumentChat: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<number | ''>('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load documents
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

  // Load conversation history when selected document changes
  const loadHistory = async (docId: number) => {
    try {
      setLoadingHistory(true);
      const res = await aiAPI.getConversations(docId);
      setConversations(res.data);
    } catch {
      setConversations([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (selectedDocId) {
      loadHistory(Number(selectedDocId));
    } else {
      setConversations([]);
    }
  }, [selectedDocId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuestion.trim() || !selectedDocId) return;

    const question = inputQuestion.trim();
    setInputQuestion('');

    // Optimistic question push
    const tempConv: Conversation = {
      id: Date.now(),
      document_id: Number(selectedDocId),
      question,
      answer: '',
      created_at: new Date().toISOString(),
    };
    setConversations((prev) => [...prev, tempConv]);

    try {
      setLoading(true);
      const res = await aiAPI.ask(Number(selectedDocId), question);
      // Replace last item with server response
      setConversations((prev) =>
        prev.map((c) =>
          c.id === tempConv.id
            ? { ...c, id: res.data.conversation_id, answer: res.data.answer }
            : c
        )
      );
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to get answer from AI';
      toast.error(msg);
      // Remove temporary item on error
      setConversations((prev) => prev.filter((c) => c.id !== tempConv.id));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in flex flex-col h-[calc(100vh-140px)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <MessageSquare className="text-primary-400" />
            <span>Document Q&A Assistant</span>
          </h1>
          <p className="text-xs text-dark-400 mt-1">
            Ask targeted questions directly answered using your uploaded study material
          </p>
        </div>

        {documents.length > 0 && (
          <div className="flex items-center gap-2">
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(Number(e.target.value))}
              className="input-field py-2 text-xs cursor-pointer max-w-xs"
            >
              {documents.map((doc) => (
                <option key={doc.id} value={doc.id} className="bg-dark-900">
                  {doc.original_filename}
                </option>
              ))}
            </select>
            <button
              onClick={() => selectedDocId && loadHistory(Number(selectedDocId))}
              title="Reload history"
              className="p-2.5 bg-dark-800 hover:bg-dark-700 text-dark-300 rounded-xl border border-dark-700 transition-colors"
            >
              <RefreshCw size={14} className={loadingHistory ? 'animate-spin' : ''} />
            </button>
          </div>
        )}
      </div>

      {documents.length === 0 ? (
        <div className="glass-card p-12 text-center border border-dark-800 my-auto">
          <MessageSquare className="w-12 h-12 text-dark-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-dark-200">No documents found</h3>
          <p className="text-xs text-dark-400 mt-1 max-w-sm mx-auto mb-4">
            Upload notes or reading materials first to chat and query them.
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
        <div className="flex-1 glass-card border border-dark-700 flex flex-col overflow-hidden">
          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {conversations.length === 0 && !loading && (
              <div className="h-full flex flex-col items-center justify-center text-center text-dark-400 py-12">
                <div className="w-14 h-14 rounded-2xl bg-primary-600/10 border border-primary-500/20 flex items-center justify-center text-primary-400 mb-3">
                  <Sparkles size={24} />
                </div>
                <h3 className="font-semibold text-dark-200 text-sm">Ask Anything About This Document</h3>
                <p className="text-xs text-dark-400 max-w-sm mt-1">
                  Example: "Summarize section 3", "What is the key takeaway?", or "Explain the main formulas"
                </p>
              </div>
            )}

            {conversations.map((conv) => (
              <div key={conv.id} className="space-y-4">
                {/* User message */}
                <div className="flex items-start justify-end gap-3">
                  <div className="max-w-[80%] bg-primary-600 text-white p-3.5 rounded-2xl rounded-tr-none text-xs sm:text-sm leading-relaxed shadow">
                    {conv.question}
                  </div>
                  <div className="w-8 h-8 rounded-full bg-dark-700 flex items-center justify-center text-dark-200 shrink-0">
                    <User size={16} />
                  </div>
                </div>

                {/* AI response */}
                {(conv.answer || (loading && conv.id === conversations[conversations.length - 1].id)) && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-600 to-accent-600 flex items-center justify-center text-white shrink-0 shadow-md">
                      <Bot size={16} />
                    </div>
                    <div className="max-w-[85%] glass-card p-4 border border-dark-700 rounded-2xl rounded-tl-none text-xs sm:text-sm text-dark-200 leading-relaxed prose-content">
                      {conv.answer ? (
                        <div className="whitespace-pre-line">{conv.answer}</div>
                      ) : (
                        <div className="flex items-center gap-2 text-dark-400 py-1">
                          <div className="spinner" />
                          <span>Searching document and formulating answer...</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input field */}
          <div className="p-4 border-t border-dark-800 bg-dark-900/60">
            <form onSubmit={handleSend} className="flex items-center gap-2">
              <input
                type="text"
                value={inputQuestion}
                onChange={(e) => setInputQuestion(e.target.value)}
                placeholder="Ask a question about this document..."
                disabled={loading || !selectedDocId}
                className="input-field py-3 text-xs sm:text-sm"
              />
              <button
                type="submit"
                disabled={loading || !inputQuestion.trim() || !selectedDocId}
                className="btn-primary p-3 rounded-xl flex items-center justify-center shrink-0"
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
