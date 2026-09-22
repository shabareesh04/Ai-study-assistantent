import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentsAPI } from '../services/api';
import type { Document, DocumentDetail } from '../types';
import {
  Upload,
  Trash2,
  Eye,
  FileText,
  MessageSquare,
  Award,
  Sparkles,
  AlertCircle,
  X,
  File,
  HardDrive,
  Calendar,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const Documents: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocumentDetail | null>(null);
  const [loadingDocDetail, setLoadingDocDetail] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await documentsAPI.list();
      setDocuments(res.data);
    } catch {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleFileUpload = async (file: File) => {
    // Validate file extension
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['pdf', 'docx', 'txt'].includes(ext)) {
      toast.error('Only PDF, DOCX, and TXT files are supported');
      return;
    }

    // Validate size (10 MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds 10MB limit');
      return;
    }

    try {
      setUploading(true);
      const toastId = toast.loading('Extracting and processing document...');
      await documentsAPI.upload(file);
      toast.success('Document uploaded and processed successfully!', { id: toastId });
      await fetchDocuments();
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to upload document';
      toast.error(msg);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this document?')) return;

    try {
      await documentsAPI.delete(id);
      toast.success('Document deleted');
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      if (selectedDoc?.id === id) {
        setSelectedDoc(null);
      }
    } catch {
      toast.error('Failed to delete document');
    }
  };

  const handleViewDetail = async (doc: Document) => {
    try {
      setLoadingDocDetail(true);
      const res = await documentsAPI.get(doc.id);
      setSelectedDoc(res.data);
    } catch {
      toast.error('Failed to load document details');
    } finally {
      setLoadingDocDetail(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getBadgeClass = (fileType: string) => {
    const type = fileType.toLowerCase().replace('.', '');
    if (type === 'pdf') return 'badge-pdf';
    if (type === 'docx' || type === 'doc') return 'badge-docx';
    return 'badge-txt';
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
            My Study Materials
          </h1>
          <p className="text-sm text-dark-400 mt-1">
            Upload course notes, textbook chapters, and assignments to unlock AI features
          </p>
        </div>
      </div>

      {/* Upload Dropzone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`glass-card p-8 border-2 border-dashed border-dark-700 hover:border-primary-500/60 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 group ${
          uploading ? 'opacity-60 pointer-events-none' : ''
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileUpload(e.target.files[0]);
            }
          }}
        />
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary-600/20 to-accent-600/20 border border-primary-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
          {uploading ? (
            <div className="spinner" />
          ) : (
            <Upload className="w-8 h-8 text-primary-400" />
          )}
        </div>
        <h3 className="text-base font-semibold text-dark-100">
          {uploading ? 'Processing File...' : 'Click or Drag & Drop to Upload'}
        </h3>
        <p className="text-xs text-dark-400 mt-1 text-center max-w-sm">
          Supports <span className="text-primary-400 font-medium">PDF, Word (.docx)</span>, and{' '}
          <span className="text-primary-400 font-medium">Text (.txt)</span> up to 10MB
        </p>
      </div>

      {/* Documents Grid / List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-dark-100 flex items-center gap-2">
            <span>Uploaded Files</span>
            <span className="text-xs bg-dark-800 text-dark-300 px-2 py-0.5 rounded-full">
              {documents.length}
            </span>
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="spinner-lg" />
          </div>
        ) : documents.length === 0 ? (
          <div className="glass-card p-12 text-center border border-dark-800">
            <File className="w-12 h-12 text-dark-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-dark-200">No documents yet</h3>
            <p className="text-xs text-dark-400 mt-1 max-w-xs mx-auto">
              Upload your syllabus, research papers, or revision notes above to get started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="glass-card glass-card-hover p-5 flex flex-col justify-between border border-dark-700/70"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className={getBadgeClass(doc.file_type)}>
                      {doc.file_type.toUpperCase().replace('.', '')}
                    </span>
                    <button
                      onClick={(e) => handleDelete(doc.id, e)}
                      title="Delete document"
                      className="text-dark-500 hover:text-red-400 p-1 rounded hover:bg-dark-800 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <h3
                    className="font-semibold text-dark-100 text-sm leading-snug line-clamp-2"
                    title={doc.original_filename}
                  >
                    {doc.original_filename}
                  </h3>

                  <div className="mt-3 flex items-center gap-4 text-[11px] text-dark-400">
                    <span className="flex items-center gap-1">
                      <HardDrive size={12} />
                      {formatFileSize(doc.file_size)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(doc.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Document action bar */}
                <div className="mt-5 pt-4 border-t border-dark-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleViewDetail(doc)}
                    className="p-2 text-dark-400 hover:text-dark-100 hover:bg-dark-800 rounded-lg transition-colors"
                    title="Preview extracted text"
                  >
                    <Eye size={16} />
                  </button>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => navigate(`/summary?doc=${doc.id}`)}
                      className="px-2.5 py-1.5 text-xs font-semibold bg-dark-800 hover:bg-primary-600/20 text-dark-300 hover:text-primary-400 rounded-lg border border-dark-700 transition-colors flex items-center gap-1"
                      title="Summarize"
                    >
                      <FileText size={13} />
                      <span>Summary</span>
                    </button>
                    <button
                      onClick={() => navigate(`/ask?doc=${doc.id}`)}
                      className="px-2.5 py-1.5 text-xs font-semibold bg-dark-800 hover:bg-primary-600/20 text-dark-300 hover:text-primary-400 rounded-lg border border-dark-700 transition-colors flex items-center gap-1"
                      title="Ask questions"
                    >
                      <MessageSquare size={13} />
                      <span>Ask</span>
                    </button>
                    <button
                      onClick={() => navigate(`/quiz?doc=${doc.id}`)}
                      className="px-2.5 py-1.5 text-xs font-semibold bg-primary-600/20 text-primary-400 hover:bg-primary-600 hover:text-white rounded-lg border border-primary-500/30 transition-all flex items-center gap-1"
                      title="Generate Quiz"
                    >
                      <Award size={13} />
                      <span>Quiz</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Document Detail Preview Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl max-h-[85vh] glass-card p-6 border border-dark-700 flex flex-col glow-primary">
            <div className="flex items-center justify-between pb-4 border-b border-dark-800">
              <div className="flex items-center gap-2 max-w-[85%]">
                <span className={getBadgeClass(selectedDoc.file_type)}>
                  {selectedDoc.file_type.toUpperCase().replace('.', '')}
                </span>
                <h3 className="font-bold text-dark-100 text-base truncate">
                  {selectedDoc.original_filename}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="text-dark-400 hover:text-dark-100 p-1 rounded-lg hover:bg-dark-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs text-dark-300 leading-relaxed font-mono bg-dark-900/60 p-4 rounded-xl border border-dark-800 my-3">
              {selectedDoc.extracted_text ? (
                <div className="whitespace-pre-wrap">{selectedDoc.extracted_text}</div>
              ) : (
                <p className="text-dark-500 italic">No text extracted from this document.</p>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-dark-800">
              <span className="text-xs text-dark-400">
                Size: {formatFileSize(selectedDoc.file_size)}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const id = selectedDoc.id;
                    setSelectedDoc(null);
                    navigate(`/summary?doc=${id}`);
                  }}
                  className="btn-primary py-2 px-4 text-xs"
                >
                  Generate Summary
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
