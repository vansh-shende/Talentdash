'use client';

import { useState } from 'react';
import Sidebar from '@/components/layout/sidebar';
import styles from './layout.module.css';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className={styles.layoutContainer}>
      {/* Mobile Top Bar */}
      <header className={styles.mobileHeader}>
        <button 
          className={styles.menuToggle}
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          aria-label="Toggle Navigation"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <span className={styles.mobileLogo}>
          Talent<span className={styles.logoHighlight}>Dash</span>
        </span>
        <div style={{ width: '40px' }} /> {/* Spacing element to balance the flex layout */}
      </header>

      {/* Sidebar Overlay */}
      {isMobileOpen && (
        <div 
          className={styles.sidebarOverlay} 
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <Sidebar isOpen={isMobileOpen} onClose={() => setIsMobileOpen(false)} />
      
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
}
