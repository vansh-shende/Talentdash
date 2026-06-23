'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SIDEBAR_NAV_ITEMS } from '@/constants/navigation';
import styles from './sidebar.module.css';

export default function Sidebar() {
  const pathname = usePathname();
  const [currency, setCurrency] = useState('USD');

  // Read current currency from cookie on mount
  useEffect(() => {
    const cookies = document.cookie.split(';');
    const currencyCookie = cookies.find(c => c.trim().startsWith('currency='));
    if (currencyCookie) {
      setCurrency(currencyCookie.split('=')[1].trim());
    }
  }, []);

  const toggleCurrency = () => {
    const nextCurrency = currency === 'USD' ? 'INR' : 'USD';
    document.cookie = `currency=${nextCurrency}; path=/; max-age=31536000`;
    setCurrency(nextCurrency);
    // Reload page to force both Server and Client Components to re-render in the new currency
    window.location.reload();
  };

  return (
    <aside className={styles.sidebar} id="td-sidebar">
      <div className={styles.logoContainer}>
        <span className="material-symbols-outlined text-primary">analytics</span>
        <h1 className={styles.logoText}>Talent<span className={styles.logoHighlight}>Dash</span></h1>
      </div>
      
      <nav className={styles.navMenu}>
        {SIDEBAR_NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link 
              key={item.href} 
              href={item.href}
              id={`sidebar-link-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Global Currency Toggle */}
      <div className={styles.currencyContainer}>
        <span className={styles.currencyLabel}>Global Currency</span>
        <button 
          id="btn-currency-toggle"
          onClick={toggleCurrency} 
          className={styles.currencyToggleBtn}
          title="Toggle display currency between USD and INR"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary)' }}>payments</span>
            <span>Display in</span>
          </div>
          <span className={styles.currencyBadge}>{currency}</span>
        </button>
      </div>

      <div className={styles.submitContainer}>
        <Link 
          href="/submit" 
          id="sidebar-btn-submit-salary" 
          className={styles.submitBtn}
        >
          <span className="material-symbols-outlined">add</span>
          <span>Submit Salary</span>
        </Link>
      </div>

      <div className={styles.userSection}>
        <div className={styles.avatar}>U</div>
        <div className={styles.userInfo}>
          <span className={styles.userName}>Demo User</span>
          <span className={styles.userRole}>Software Engineer</span>
        </div>
        <Link 
          href="/settings" 
          id="sidebar-link-settings" 
          className={styles.settingsBtn}
          title="Account Settings"
        >
          <span className="material-symbols-outlined">settings</span>
        </Link>
      </div>
    </aside>
  );
}
