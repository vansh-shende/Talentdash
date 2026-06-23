import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getFormattedCompensation } from '@/lib/currency';
import styles from './overview.module.css';

function getRelativeTime(date: Date) {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 0) return 'Just now';
  
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) {
    return `${Math.max(1, diffMins)}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else {
    return `${diffDays}d ago`;
  }
}

export default async function OverviewPage() {
  const userRole = "Software Engineer III";
  const userLocation = "San Francisco, CA";

  // Read the currency cookie on the server
  const cookieStore = await cookies();
  const targetCurrency = cookieStore.get('currency')?.value || 'USD';

  // 1. Fetch overall database metrics
  let stats: any = { _avg: { baseSalary: null, variablePay: null, equity: null, totalCompensation: null }, _count: 0 };
  let benchmarks: any[] = [];
  let recentSubmissions: any[] = [];
  let dbError = false;

  try {
    stats = await prisma.compensationRecord.aggregate({
      _avg: {
        baseSalary: true,
        variablePay: true,
        equity: true,
        totalCompensation: true
      },
      _count: true
    });

    benchmarks = await prisma.$queryRaw<any[]>`
      SELECT 
        c.name, 
        COALESCE(percentile_cont(0.5) WITHIN GROUP (ORDER BY r.total_compensation)::numeric, 0)::float as median_tc
      FROM companies c
      JOIN salaries r ON c.id = r.company_id
      GROUP BY c.name
      ORDER BY median_tc DESC
      LIMIT 4;
    `;

    recentSubmissions = await prisma.compensationRecord.findMany({
      orderBy: { submittedAt: 'desc' },
      take: 4,
      include: { company: true }
    });
  } catch (err: any) {
    console.error('Database connection error in Overview:', err.message);
    dbError = true;
  }

  const avgBase = Number(stats?._avg?.baseSalary || 0);
  const avgBonus = Number(stats?._avg?.variablePay || 0);
  const avgEquity = Number(stats?._avg?.equity || 0);
  const avgTotal = Number(stats?._avg?.totalCompensation || 0);

  return (
    <div className={styles.container}>
      {dbError && (
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '28px',
          color: '#ef4444',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '16px',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '32px', color: '#ef4444' }}>database_off</span>
          <div>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 600, color: '#ef4444' }}>Database Connection Offline</h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.5' }}>
              We could not connect to your PostgreSQL database. This usually means the <strong>DATABASE_URL</strong> environment variable is not configured or is incorrect in your Vercel Project Settings.
              <br />
              <span style={{ display: 'inline-block', marginTop: '6px', fontWeight: '500', color: 'var(--text-primary)' }}>
                Please add the <strong>DATABASE_URL</strong> variable in Vercel, then redeploy the application.
              </span>
            </p>
          </div>
        </div>
      )}

      <header className={styles.header}>
        <h1 className={styles.title}>Welcome back, Demo User</h1>
        <p className={styles.subtitle}>Here is how your compensation compares to the latest market benchmarks.</p>
      </header>

      <div className={styles.grid}>
        {/* Widget 1: Personal Market Value Card */}
        <section className={`${styles.card} glass-panel ${styles.halfWidth}`} id="widget-market-value">
          <h2 className={styles.cardTitle}>
            <span className="material-symbols-outlined">account_balance_wallet</span>
            Estimated Market Value
          </h2>
          <p className={styles.salaryLabel} style={{ marginBottom: '12px' }}>
            Based on average market data for: <strong>{userRole}</strong> in <strong>{userLocation}</strong>
          </p>
          <div className={styles.marketValueContainer}>
            <div className={styles.salaryMetric}>
              <span className={styles.salaryValue}>
                {avgTotal > 0 
                  ? getFormattedCompensation(avgTotal, 'USD', targetCurrency)
                  : getFormattedCompensation(185000, 'USD', targetCurrency)
                }
              </span>
              <span className={styles.salaryLabel}>Average Market Total Compensation (TC)</span>
            </div>
            <div className={styles.percentileBadge}>
              {stats._count > 0 ? `Based on ${stats._count} records` : 'Benchmark Estimate'}
            </div>
          </div>
          <div style={{ marginTop: '24px', display: 'flex', gap: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Base Salary</span>
              <div style={{ fontWeight: 600 }}>
                {avgBase > 0 
                  ? getFormattedCompensation(avgBase, 'USD', targetCurrency)
                  : getFormattedCompensation(150000, 'USD', targetCurrency)
                }
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Annual Bonus</span>
              <div style={{ fontWeight: 600 }}>
                {avgBonus > 0 
                  ? getFormattedCompensation(avgBonus, 'USD', targetCurrency)
                  : getFormattedCompensation(15000, 'USD', targetCurrency)
                }
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Stock / Equity</span>
              <div style={{ fontWeight: 600 }}>
                {avgEquity > 0 
                  ? `${getFormattedCompensation(avgEquity, 'USD', targetCurrency)}/yr`
                  : `${getFormattedCompensation(20000, 'USD', targetCurrency)}/yr`
                }
              </div>
            </div>
          </div>
        </section>

        {/* Widget 2: Custom Benchmarking Tracker */}
        <section className={`${styles.card} glass-panel ${styles.halfWidth}`} id="widget-benchmark-tracker">
          <h2 className={styles.cardTitle}>
            <span className="material-symbols-outlined">monitoring</span>
            Custom Benchmarking Tracker
          </h2>
          <div className={styles.benchmarkList}>
            {benchmarks.length > 0 ? (
              benchmarks.map((company, index) => (
                <div key={`bench-${index}`} className={styles.benchmarkItem}>
                  <div>
                    <div className={styles.companyName} style={{ textTransform: 'capitalize' }}>
                      {company.name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>L4/E4 Median equivalent</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className={styles.compValue}>
                      {getFormattedCompensation(company.median_tc, 'USD', targetCurrency)}
                    </div>
                    <span className={`${styles.trendBadge} ${styles.trendUp}`}>
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                        trending_up
                      </span>
                      +3.2%
                    </span>
                  </div>
                </div>
              ))
            ) : (
              // Fallback default benchmarks if database has no records yet
              [
                { name: "Google", median: 224000 },
                { name: "Stripe", median: 215000 },
                { name: "Meta", median: 238000 },
                { name: "Amazon", median: 195000 }
              ].map((company, index) => (
                <div key={`bench-fallback-${index}`} className={styles.benchmarkItem}>
                  <div>
                    <div className={styles.companyName}>{company.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>L4/E4 Median equivalent</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className={styles.compValue}>
                      {getFormattedCompensation(company.median, 'USD', targetCurrency)}
                    </div>
                    <span className={`${styles.trendBadge} ${styles.trendUp}`}>
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                        trending_up
                      </span>
                      +3.2%
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Widget 3: Live Compensation Ticker */}
        <section className={`${styles.card} glass-panel ${styles.fullWidth}`} id="widget-live-ticker">
          <h2 className={styles.cardTitle}>
            <span className="material-symbols-outlined">campaign</span>
            Live Compensation Submissions
          </h2>
          <div className={styles.tickerContainer}>
            {recentSubmissions.length > 0 ? (
              recentSubmissions.map((item) => (
                <div key={item.id} className={styles.tickerItem}>
                  <div className={styles.tickerJob}>
                    <span className={styles.jobTitle}>{item.jobTitle}</span>
                    <span className={styles.jobMeta} style={{ textTransform: 'capitalize' }}>
                      {item.company.name} &bull; {item.location}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontWeight: 700, color: 'var(--secondary)' }}>
                      {getFormattedCompensation(item.totalCompensation, item.currency, targetCurrency)} total
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {getRelativeTime(item.submittedAt)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '14px' }}>
                No recent submissions found. Submit a package to begin the feed.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
