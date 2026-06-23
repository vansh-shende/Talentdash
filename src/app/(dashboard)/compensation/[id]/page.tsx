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
  const record = await prisma.compensationRecord.findUnique({
    where: { id },
    include: { company: true }
  });

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
