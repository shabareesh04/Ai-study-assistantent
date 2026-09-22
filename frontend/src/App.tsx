import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';

import { Dashboard } from './pages/Dashboard';
import { Documents } from './pages/Documents';
import { Summarizer } from './pages/Summarizer';
import { DocumentChat } from './pages/DocumentChat';
import { QuizPage } from './pages/QuizPage';
import { Explainer } from './pages/Explainer';
import { ShortQuestionsPage } from './pages/ShortQuestionsPage';

export const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <AuthProvider>
      <div className="min-h-screen bg-dark-950 text-dark-100 flex">
        {/* Left Navigation Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
          <Navbar
            onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
            onOpenAuth={() => setIsAuthModalOpen(true)}
          />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/documents" element={<Documents />} />
              <Route path="/summary" element={<Summarizer />} />
              <Route path="/ask" element={<DocumentChat />} />
              <Route path="/quiz" element={<QuizPage />} />
              <Route path="/explain" element={<Explainer />} />
              <Route path="/questions" element={<ShortQuestionsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>

        {/* Authentication Modal */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
        />
      </div>
    </AuthProvider>
  );
};

export default App;
