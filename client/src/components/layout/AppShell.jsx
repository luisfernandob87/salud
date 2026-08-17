import { useState, useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import MobileTabs from './MobileTabs';
import FloatingRegister from './FloatingRegister';
import QuickAdd from '../quickAdd/QuickAdd';
import { useUi } from '../../stores/ui';
import { useAuth } from '../../stores/auth';

export default function AppShell() {
  const quickAddOpen = useUi((s) => s.quickAddOpen);
  const familyLoaded = useAuth((s) => s.familyLoaded);
  const fetchFamily = useAuth((s) => s.fetchFamily);
  const navigate = useNavigate();

  function openSearch() {
    navigate('/search');
  }

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target;
      if (t instanceof HTMLElement && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
      e.preventDefault();
      navigate('/search');
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [navigate]);

  useEffect(() => {
    if (!familyLoaded) fetchFamily();
  }, [familyLoaded, fetchFamily]);

  return (
    <div className="min-h-screen bg-ink-50">
      <Sidebar />
      <div className="lg:pl-64">
        <TopBar onOpenSearch={openSearch} />
        <main className="px-4 sm:px-6 lg:px-10 pt-4 lg:pt-8 pb-28 lg:pb-16 max-w-5xl mx-auto">
          <Outlet />
        </main>
      </div>
      <MobileTabs />
      <FloatingRegister />
      <QuickAdd open={quickAddOpen} />
    </div>
  );
}
