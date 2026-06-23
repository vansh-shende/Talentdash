import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getFormattedCompensation } from '@/lib/currency';
import styles from './detail.module.css';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CompensationDetailPage({ params }: PageProps) {
  const { id } = await params;

  // Validate UUID format before querying the database to prevent database level crashes
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    notFound();
  }

  // Read the currency cookie on the server
  const cookieStore = await cookies();
  const targetCurrency = cookieStore.get('currency')?.value || 'USD';

  // Fetch the record directly from the database
  let record = null;
  let dbError = false;
  try {
    record = await prisma.compensationRecord.findUnique({
      where: { id },
      include: { company: true }
    });
  } catch (err: any) {
    console.error('Database connection error in details page:', err.message);
    dbError = true;
  }

  if (dbError) {
    return (
      <div className={styles.container}>
        <Link href="/compensation" className={styles.backLink}>
          <span className="material-symbols-outlined">arrow_back</span>
          Back to Salaries
        </Link>
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          borderRadius: '12px',
          padding: '24px',
          marginTop: '16px',
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
      </div>
    );
  }

  if (!record) {
    notFound();
  }

  const isVerified = record.company.verified || record.status === 'APPROVED';

  return (
    <div className={styles.container}>
      <Link href="/compensation" className={styles.backLink}>
        <span className="material-symbols-outlined">arrow_back</span>
        Back to Salaries
      </Link>

      <div className={`${styles.card} glass-panel`}>
        <header className={styles.header}>
          <div className={styles.companyInfo}>
            <h1 className={styles.companyName} style={{ textTransform: 'capitalize' }}>
              {record.company.name}
            </h1>
            <span className={styles.roleTitle}>{record.jobTitle} &bull; {record.level}</span>
          </div>
          <div className={styles.tcContainer}>
            <span className={styles.tcLabel}>Total Compensation</span>
            <div className={styles.tcValue}>
              {getFormattedCompensation(record.totalCompensation, record.currency, targetCurrency)}
            </div>
          </div>
        </header>

        <section>
          <h2 className={styles.sectionTitle}>Compensation Breakdown</h2>
          <div className={styles.grid}>
            <div className={styles.metricBox}>
              <div className={styles.metricValue}>
                {getFormattedCompensation(record.baseSalary, record.currency, targetCurrency)}
              </div>
              <div className={styles.metricLabel}>Base Salary</div>
            </div>
            <div className={styles.metricBox}>
              <div className={styles.metricValue}>
                {getFormattedCompensation(record.variablePay, record.currency, targetCurrency)}
              </div>
              <div className={styles.metricLabel}>Annual Bonus</div>
            </div>
            <div className={styles.metricBox}>
              <div className={styles.metricValue}>
                {getFormattedCompensation(record.equity, record.currency, targetCurrency)}
              </div>
              <div className={styles.metricLabel}>Stock / Equity (per year)</div>
            </div>
          </div>
        </section>

        <section>
          <h2 className={styles.sectionTitle}>Details & Metadata</h2>
          <div className={styles.metaGrid}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Location</span>
              <span className={styles.metaValue}>{record.location}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Experience Required</span>
              <span className={styles.metaValue}>{record.yearsOfExperience} years</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Industry</span>
              <span className={styles.metaValue}>{record.company.industry || 'Tech'}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Currency</span>
              <span className={styles.metaValue}>{targetCurrency}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Submission Date</span>
              <span className={styles.metaValue}>
                {new Date(record.submittedAt).toLocaleDateString(undefined, {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Performance Rating</span>
              <span className={styles.metaValue}>{record.performanceRating || 'Not Rated'}</span>
            </div>
          </div>
        </section>

        {isVerified ? (
          <div className={styles.verificationBanner}>
            <span className="material-symbols-outlined">verified</span>
            <div>
              <div className={styles.verificationTitle}>Verified Submission</div>
              <div className={styles.verificationDesc}>
                This compensation package was verified by a TalentDash analyst using a secure upload of an offer letter or pay stub.
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.verificationBanner} style={{ backgroundColor: 'rgba(245, 158, 11, 0.05)', borderColor: 'rgba(245, 158, 11, 0.2)' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--warning)' }}>warning</span>
            <div>
              <div className={styles.verificationTitle}>Unverified Submission</div>
              <div className={styles.verificationDesc}>
                This data was self-reported by a community user and has not been backed by an official verification document.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
