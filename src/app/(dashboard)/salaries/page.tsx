'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getFormattedCompensation } from '@/lib/currency';
import styles from './compensation.module.css';

interface SalaryRecord {
  id: string;
  company: string;
  companyId: string;
  jobTitle: string;
  level: string;
  department: string;
  baseSalary: number;
  variablePay: number;
  equity: number;
  totalCompensation: number;
  currency: string;
  location: string;
  yearsOfExperience: number;
  performanceRating: string | null;
  submittedAt: string;
}

export default function CompensationPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [salaries, setSalaries] = useState<SalaryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [targetCurrency, setTargetCurrency] = useState('USD');

  // Read current currency from cookie on mount
  useEffect(() => {
    const cookies = document.cookie.split(';');
    const currencyCookie = cookies.find(c => c.trim().startsWith('currency='));
    if (currencyCookie) {
      setTargetCurrency(currencyCookie.split('=')[1].trim());
    }
  }, []);

  // Fetch salaries when query filters or page change
  useEffect(() => {
    let active = true;
    const fetchSalaries = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: '25'
        });

        if (searchQuery.trim()) {
          params.append('query', searchQuery.trim());
        }

        if (locationQuery.trim()) {
          params.append('location', locationQuery.trim());
        }

        const response = await fetch(`/api/salaries?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to fetch salaries');
        
        const result = await response.json();
        if (active && result.success) {
          setSalaries(result.data);
          setTotalPages(result.pagination.totalPages);
          setTotalCount(result.pagination.totalCount);
        }
      } catch (err) {
        console.error('Failed to load salaries:', err);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchSalaries();

    return () => {
      active = false;
    };
  }, [searchQuery, locationQuery, page]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocationQuery(e.target.value);
    setPage(1);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Explore Compensation Databases</h1>
          <p className={styles.subtitle}>View real, anonymized packages submitted by other technology professionals.</p>
        </div>
      </header>

      {/* Interactive Filters */}
      <section className={`${styles.filterBar} glass-panel`} id="compensation-filters">
        <div className={styles.filterInputWrapper}>
          <span className="material-symbols-outlined">search</span>
          <input 
            type="text" 
            placeholder="Search Job Title or Company..." 
            className={styles.filterInput}
            value={searchQuery}
            onChange={handleSearchChange}
            id="filter-job-title"
          />
        </div>
        <div className={styles.filterInputWrapper}>
          <span className="material-symbols-outlined">location_on</span>
          <input 
            type="text" 
            placeholder="Filter by Location..." 
            className={styles.filterInput}
            value={locationQuery}
            onChange={handleLocationChange}
            id="filter-location"
          />
        </div>
      </section>

      {/* Salaries Data Table */}
      <div className={styles.tableCard}>
        <table className={styles.table} id="compensation-table">
          <thead>
            <tr>
              <th className={styles.th}>Company / Role</th>
              <th className={styles.th}>Location</th>
              <th className={styles.th}>Total Comp</th>
              <th className={styles.th}>Experience</th>
              <th className={styles.th}>Submitted</th>
              <th className={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              // Loading state skeletons
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={`skeleton-${idx}`} className={styles.tr}>
                  <td className={styles.td} colSpan={6}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px 0' }}>
                      <div className="skeleton" style={{ width: '35%', height: '16px', borderRadius: '4px' }}></div>
                      <div className="skeleton" style={{ width: '20%', height: '12px', borderRadius: '4px' }}></div>
                    </div>
                  </td>
                </tr>
              ))
            ) : salaries.length > 0 ? (
              salaries.map((item) => (
                <tr key={item.id} className={styles.tr} id={`row-item-${item.id}`}>
                  <td className={styles.td}>
                    <div className={styles.companyCell}>
                      <span className={styles.companyName} style={{ textTransform: 'capitalize' }}>
                        {item.company}
                      </span>
                      <span className={styles.levelTag}>{item.jobTitle} &bull; {item.level}</span>
                    </div>
                  </td>
                  <td className={styles.td}>{item.location}</td>
                  <td className={styles.td}>
                    <span className={styles.tcText}>
                      {getFormattedCompensation(item.totalCompensation, item.currency, targetCurrency)}
                    </span>
                  </td>
                  <td className={styles.td}>{item.yearsOfExperience} yrs</td>
                  <td className={styles.td}>
                    {new Date(item.submittedAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </td>
                  <td className={styles.td}>
                    <Link href={`/salaries/${item.id}`} className={styles.btnDetail} id={`btn-view-${item.id}`}>
                      Details
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_right</span>
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className={styles.td} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No matching compensation entries found. Try altering your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {!loading && totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginTop: '24px', paddingBottom: '32px' }}>
          <button 
            disabled={page === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className={styles.btnDetail}
            style={{ opacity: page === 1 ? 0.5 : 1, cursor: page === 1 ? 'not-allowed' : 'pointer', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_left</span>
            Previous
          </button>
          <span style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: '500' }}>
            Page {page} of {totalPages} ({totalCount} records)
          </span>
          <button 
            disabled={page === totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            className={styles.btnDetail}
            style={{ opacity: page === totalPages ? 0.5 : 1, cursor: page === totalPages ? 'not-allowed' : 'pointer', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            Next
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_right</span>
          </button>
        </div>
      )}
    </div>
  );
}
