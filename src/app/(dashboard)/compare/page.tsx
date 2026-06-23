'use client';

import { useState, useEffect } from 'react';
import { getFormattedCompensation } from '@/lib/currency';
import styles from './compare.module.css';

interface CompanyListItem {
  id: string;
  name: string;
}

interface CompanyStats {
  medianTotalCompensation: number;
  averageTotalCompensation: number;
  averageBaseSalary: number;
  averageVariablePay: number;
  averageEquity: number;
  totalSubmissions: number;
}

interface CompanyProfile {
  company: {
    id: string;
    name: string;
    domain: string | null;
    industry: string | null;
    sizeRange: string | null;
    verified: boolean;
  };
  stats: CompanyStats;
  levelDistribution: Array<{ level: string; count: number }>;
}

export default function ComparePage() {
  const [companiesList, setCompaniesList] = useState<CompanyListItem[]>([]);
  const [compA, setCompA] = useState('');
  const [compB, setCompB] = useState('');
  const [profileA, setProfileA] = useState<CompanyProfile | null>(null);
  const [profileB, setProfileB] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [targetCurrency, setTargetCurrency] = useState('USD');

  // 1. Read current currency from cookie on mount
  useEffect(() => {
    const cookies = document.cookie.split(';');
    const currencyCookie = cookies.find(c => c.trim().startsWith('currency='));
    if (currencyCookie) {
      setTargetCurrency(currencyCookie.split('=')[1].trim());
    }
  }, []);

  // 2. Fetch companies list on mount
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await fetch('/api/companies');
        if (!res.ok) throw new Error('Failed to load companies list');
        const result = await res.json();
        if (result.success && result.data.length > 0) {
          setCompaniesList(result.data);
          // Set initial defaults
          setCompA(result.data[0].name);
          if (result.data.length > 1) {
            setCompB(result.data[1].name);
          } else {
            setCompB(result.data[0].name);
          }
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCompanies();
  }, []);

  // 3. Fetch profiles when selections change
  useEffect(() => {
    if (!compA && !compB) return;

    const fetchProfiles = async () => {
      setLoadingStats(true);
      try {
        const promises = [];
        if (compA) promises.push(fetch(`/api/companies/${compA}`).then(r => r.json()));
        if (compB) promises.push(fetch(`/api/companies/${compB}`).then(r => r.json()));

        const [resA, resB] = await Promise.all(promises);

        if (resA && resA.success) setProfileA(resA);
        if (resB && resB.success) setProfileB(resB);
      } catch (err) {
        console.error('Error loading profiles:', err);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchProfiles();
  }, [compA, compB]);

  const getDelta = (valA: number | undefined, valB: number | undefined) => {
    if (valA === undefined || valB === undefined) return null;
    const diff = valB - valA;
    const prefix = diff > 0 ? '+' : '';
    return `${prefix}${getFormattedCompensation(diff, 'USD', targetCurrency)}`;
  };

  const getDeltaColor = (valA: number | undefined, valB: number | undefined) => {
    if (valA === undefined || valB === undefined) return '';
    const diff = valB - valA;
    if (diff > 0) return '#10b981'; // Green
    if (diff < 0) return '#ef4444'; // Red
    return 'var(--text-secondary)';
  };

  if (loading) {
    return (
      <div className={styles.container} style={{ textAlign: 'center', padding: '100px 0' }}>
        <div className="skeleton" style={{ width: '300px', height: '40px', margin: '0 auto 24px auto', borderRadius: '8px' }}></div>
        <div className="skeleton" style={{ width: '500px', height: '20px', margin: '0 auto', borderRadius: '4px' }}></div>
      </div>
    );
  }

  if (companiesList.length === 0) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Compare Companies Side-by-Side</h1>
          <p className={styles.subtitle}>Analyze compensation metrics, remote work policies, and employee benefits ratings.</p>
        </header>
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 40px', color: 'var(--text-secondary)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            error_med
          </span>
          <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>No Company Data Available</h2>
          <p>We need at least one submission or seeded company in the database to enable comparison analytics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Compare Companies Side-by-Side</h1>
        <p className={styles.subtitle}>Analyze compensation metrics, remote work policies, and employee benefits ratings.</p>
      </header>

      {/* Selectors */}
      <section className={styles.selectorBar}>
        <div className={`${styles.selectorCard} glass-panel`}>
          <label className={styles.selectLabel} htmlFor="compare-select-a">Select First Company</label>
          <select 
            id="compare-select-a"
            value={compA} 
            onChange={(e) => setCompA(e.target.value)} 
            className={styles.selectInput}
          >
            {companiesList.map(item => (
              <option key={`list-a-${item.id}`} value={item.name} disabled={item.name === compB && companiesList.length > 1}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        <div className={`${styles.selectorCard} glass-panel`}>
          <label className={styles.selectLabel} htmlFor="compare-select-b">Select Second Company</label>
          <select 
            id="compare-select-b"
            value={compB} 
            onChange={(e) => setCompB(e.target.value)} 
            className={styles.selectInput}
          >
            {companiesList.map(item => (
              <option key={`list-b-${item.id}`} value={item.name} disabled={item.name === compA && companiesList.length > 1}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Comparison Grid */}
      <div className={styles.comparisonGrid} style={{ opacity: loadingStats ? 0.6 : 1, transition: 'opacity 0.2s' }}>
        {/* Company A Column */}
        {profileA && (
          <div className={styles.companyColumn} id="compare-col-a">
            <header className={`${styles.columnHeader} glass-panel`}>
              <div className={styles.compLabel}>Company A</div>
              <h2 className={styles.compName} style={{ textTransform: 'capitalize' }}>{profileA.company.name}</h2>
              <div className={styles.compMedian}>
                {getFormattedCompensation(profileA.stats.medianTotalCompensation, 'USD', targetCurrency)}
              </div>
              <div className={styles.compLabel}>Median Total Comp (TC)</div>
            </header>

            <div className={`${styles.infoCard} glass-panel`}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', color: 'var(--primary)' }}>Salary Breakdown (Averages)</h3>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Base Salary</span>
                <span className={styles.infoValue}>
                  {getFormattedCompensation(profileA.stats.averageBaseSalary, 'USD', targetCurrency)}
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Annual Bonus</span>
                <span className={styles.infoValue}>
                  {getFormattedCompensation(profileA.stats.averageVariablePay, 'USD', targetCurrency)}
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Stock / Equity</span>
                <span className={styles.infoValue}>
                  {getFormattedCompensation(profileA.stats.averageEquity, 'USD', targetCurrency)}
                </span>
              </div>
            </div>

            <div className={`${styles.infoCard} glass-panel`}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', color: 'var(--primary)' }}>Metadata & Levels</h3>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Industry</span>
                <span className={styles.infoValue}>{profileA.company.industry || 'Technology'}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Submissions</span>
                <span className={styles.infoValue}>{profileA.stats.totalSubmissions} records</span>
              </div>
              <div style={{ marginTop: '16px' }}>
                <span className={styles.infoLabel} style={{ display: 'block', marginBottom: '8px' }}>Level Distribution</span>
                {profileA.levelDistribution.map(ld => (
                  <div key={`ld-a-${ld.level}`} style={{ marginBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      <span>{ld.level}</span>
                      <span>{ld.count}</span>
                    </div>
                    <div style={{ height: '6px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min(100, (ld.count / profileA.stats.totalSubmissions) * 100)}%`, backgroundColor: 'var(--secondary)', borderRadius: '3px' }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Company B Column */}
        {profileB && (
          <div className={styles.companyColumn} id="compare-col-b">
            <header className={`${styles.columnHeader} glass-panel`}>
              <div className={styles.compLabel}>Company B</div>
              <h2 className={styles.compName} style={{ textTransform: 'capitalize' }}>{profileB.company.name}</h2>
              <div className={styles.compMedian}>
                {getFormattedCompensation(profileB.stats.medianTotalCompensation, 'USD', targetCurrency)}
              </div>
              <div className={styles.compLabel}>Median Total Comp (TC)</div>
            </header>

            <div className={`${styles.infoCard} glass-panel`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--primary)', margin: 0 }}>Salary Breakdown (Averages)</h3>
                <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>Delta vs A</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Base Salary</span>
                <div style={{ textAlign: 'right' }}>
                  <span className={styles.infoValue} style={{ display: 'block' }}>
                    {getFormattedCompensation(profileB.stats.averageBaseSalary, 'USD', targetCurrency)}
                  </span>
                  {profileA && (
                    <span style={{ fontSize: '11px', fontWeight: 600, color: getDeltaColor(profileA.stats.averageBaseSalary, profileB.stats.averageBaseSalary) }}>
                      {getDelta(profileA.stats.averageBaseSalary, profileB.stats.averageBaseSalary)}
                    </span>
                  )}
                </div>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Annual Bonus</span>
                <div style={{ textAlign: 'right' }}>
                  <span className={styles.infoValue} style={{ display: 'block' }}>
                    {getFormattedCompensation(profileB.stats.averageVariablePay, 'USD', targetCurrency)}
                  </span>
                  {profileA && (
                    <span style={{ fontSize: '11px', fontWeight: 600, color: getDeltaColor(profileA.stats.averageVariablePay, profileB.stats.averageVariablePay) }}>
                      {getDelta(profileA.stats.averageVariablePay, profileB.stats.averageVariablePay)}
                    </span>
                  )}
                </div>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Stock / Equity</span>
                <div style={{ textAlign: 'right' }}>
                  <span className={styles.infoValue} style={{ display: 'block' }}>
                    {getFormattedCompensation(profileB.stats.averageEquity, 'USD', targetCurrency)}
                  </span>
                  {profileA && (
                    <span style={{ fontSize: '11px', fontWeight: 600, color: getDeltaColor(profileA.stats.averageEquity, profileB.stats.averageEquity) }}>
                      {getDelta(profileA.stats.averageEquity, profileB.stats.averageEquity)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className={`${styles.infoCard} glass-panel`}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', color: 'var(--primary)' }}>Metadata & Levels</h3>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Industry</span>
                <span className={styles.infoValue}>{profileB.company.industry || 'Technology'}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Submissions</span>
                <span className={styles.infoValue}>{profileB.stats.totalSubmissions} records</span>
              </div>
              <div style={{ marginTop: '16px' }}>
                <span className={styles.infoLabel} style={{ display: 'block', marginBottom: '8px' }}>Level Distribution</span>
                {profileB.levelDistribution.map(ld => (
                  <div key={`ld-b-${ld.level}`} style={{ marginBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      <span>{ld.level}</span>
                      <span>{ld.count}</span>
                    </div>
                    <div style={{ height: '6px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min(100, (ld.count / profileB.stats.totalSubmissions) * 100)}%`, backgroundColor: 'var(--secondary)', borderRadius: '3px' }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
