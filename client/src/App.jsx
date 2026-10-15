import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore.js';
import { useThemeStore } from './store/useThemeStore.js';
import { useSocketStore } from './store/useSocketStore.js';
import { Header } from './components/common/Header.jsx';
import { Sidebar } from './components/common/Sidebar.jsx';
import { BottomNav } from './components/common/BottomNav.jsx';
import { BackgroundOrbs } from './components/common/BackgroundOrbs.jsx';
import { LovePokeOverlay } from './components/common/LovePokeOverlay.jsx';
import { LovePokeModal } from './components/chat/LovePokeModal.jsx';

import { HomePage } from './pages/HomePage.jsx';
import { ChatPage } from './pages/ChatPage.jsx';
import { PapPage } from './pages/PapPage.jsx';
import { LocationPage } from './pages/LocationPage.jsx';
import { ProfilePage } from './pages/ProfilePage.jsx';
import { AuthPage } from './pages/AuthPage.jsx';
import { PairingPage } from './pages/PairingPage.jsx';

import { Toaster } from 'sonner';
import { Heart, Loader2 } from 'lucide-react';

export default function App() {
  const { user, space, partner, isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const { theme } = useThemeStore();
  const { connectSocket, disconnectSocket } = useSocketStore();
  const [isPokeModalOpen, setIsPokeModalOpen] = useState(false);

  // Sync theme class on html document element
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Check auth session on startup
  useEffect(() => {
    checkAuth();
  }, []);

  // Connect socket when authenticated
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      connectSocket(user.space_id, user.id);
    } else {
      disconnectSocket();
    }
    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated, user?.id, user?.space_id]);

  // Loading state during initial authentication check
  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-charcoal-950 text-slate-100">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-romantic-600 via-rose-500 to-plum-600 flex items-center justify-center text-white mb-4 shadow-xl shadow-romantic-600/30 animate-heartbeat">
          <Heart className="w-8 h-8 fill-white" />
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <Loader2 className="w-4 h-4 animate-spin text-romantic-400" />
          <span>Membuka Ruang Cinta Asit &amp; Nisya...</span>
        </div>
      </div>
    );
  }

  // Unauthenticated: Show Auth Screen
  if (!isAuthenticated) {
    return (
      <>
        <Toaster position="top-center" richColors theme="dark" />
        <AuthPage />
      </>
    );
  }

  // Unpaired: Show Dedicated Pairing Screen (Create Code or Enter Code)
  const isPaired = Boolean(partner || (space && space.partner2_id));
  if (!isPaired) {
    return (
      <>
        <Toaster position="top-center" richColors theme="dark" />
        <PairingPage />
      </>
    );
  }

  // Authenticated & Paired: Render Main App Shell
  return (
    <BrowserRouter>
      <Toaster position="top-center" richColors theme="dark" />
      
      {/* Love Poke Fullscreen Alert when received */}
      <LovePokeOverlay />

      {/* Love Poke Sending Modal */}
      <LovePokeModal
        isOpen={isPokeModalOpen}
        onClose={() => setIsPokeModalOpen(false)}
      />

      <div className="relative flex min-h-screen bg-charcoal-950 text-slate-100 selection:bg-romantic-500/30 selection:text-romantic-200">
        {/* Ambient background glow orbs */}
        <BackgroundOrbs />

        {/* Desktop Sidebar Navigation */}
        <Sidebar onOpenLovePoke={() => setIsPokeModalOpen(true)} />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-6 relative z-10">
          {/* Top Header */}
          <Header onOpenLovePoke={() => setIsPokeModalOpen(true)} />

          {/* Page Routing Views */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            <Routes>
              <Route path="/" element={<HomePage onOpenLovePoke={() => setIsPokeModalOpen(true)} />} />
              <Route path="/chat" element={<ChatPage onOpenLovePoke={() => setIsPokeModalOpen(true)} />} />
              <Route path="/pap" element={<PapPage />} />
              <Route path="/memories" element={<Navigate to="/pap" replace />} />
              <Route path="/location" element={<LocationPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>

        {/* Mobile Bottom Navigation Bar */}
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}
