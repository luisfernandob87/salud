import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import MobileTabs from './MobileTabs';
import FloatingRegister from './FloatingRegister';
import QuickAdd from '../quickAdd/QuickAdd';
import { useUi } from '../../stores/ui';
import { useAuth } from '../../stores/auth';

export default function AppShell() {
  const { quickAddOpen } = useUi();
  const { familyLoaded, fetchFamily } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    if (!familyLoaded) fetchFamily();
  }, [familyLoaded, fetchFamily]);

  return (
    <div className="min-h-screen bg-ink-50">
      <Sidebar />
      <div className="lg:pl-64">
        <TopBar onOpenSearch={() => setSearchOpen(true)} />
        <main className="px-4 sm:px-6 lg:px-10 pt-4 lg:pt-8 pb-28 lg:pb-16 max-w-5xl mx-auto">
          <Outlet context={{ searchOpen, setSearchOpen }} />
        </main>
      </div>
      <MobileTabs />
      <FloatingRegister />
      <QuickAdd open={quickAddOpen} />
    </div>
  );
}
