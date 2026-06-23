import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getFormattedCompensation } from '@/lib/currency';
import styles from './companies.module.css';

const ICON_MAP: Record<string, string> = {
  google: 'cloud',
  meta: 'groups',
  stripe: 'payments',
  apple: 'devices',
  amazon: 'shopping_cart',
  netflix: 'movie',
  uber: 'local_taxi'
};

export default async function CompaniesPage() {
  // Read the currency cookie on the server
  const cookieStore = await cookies();
  const targetCurrency = cookieStore.get('currency')?.value || 'USD';

  // Query all companies with their submission count and median total compensation using standard PostgreSQL aggregations
  const companies = await prisma.$queryRaw<any[]>`
    SELECT 
      c.id, 
      c.name, 
      c.industry, 
      c.verified,
      COALESCE(percentile_cont(0.5) WITHIN GROUP (ORDER BY r.total_compensation)::numeric, 0)::float as median_tc,
      COUNT(r.id)::int as submission_count
    FROM companies c
    LEFT JOIN salaries r ON c.id = r.company_id
    GROUP BY c.id, c.name, c.industry, c.verified
    ORDER BY submission_count DESC, median_tc DESC;
  `;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Company Explorer</h1>
        <p className={styles.subtitle}>Browse through target employers to study average pay scales, culture scores, and workplace rankings.</p>
      </header>

      <div className={styles.list} id="companies-grid">
        {companies.length > 0 ? (
          companies.map((company) => {
            const normalizedName = company.name.toLowerCase();
            const iconName = ICON_MAP[normalizedName] || 'business';

            return (
              <div key={company.id} className={`${styles.companyCard} glass-panel`} id={`company-card-${normalizedName}`}>
                <div className={styles.logoArea}>
                  <div className={styles.icon}>
                    <span className="material-symbols-outlined">{iconName}</span>
                  </div>
                  <div>
                    <h2 className={styles.companyName} style={{ textTransform: 'capitalize' }}>
                      {company.name}
                    </h2>
                    <span className={styles.industry}>{company.industry || 'Technology'}</span>
                  </div>
                </div>

                <div className={styles.statsRow}>
                  <div className={styles.statItem}>
                    <span className={styles.statValue}>
                      {company.median_tc > 0 
                        ? getFormattedCompensation(company.median_tc, 'USD', targetCurrency)
                        : 'N/A'
                      }
                    </span>
                    <span className={styles.statLabel}>Median TC</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statValue}>
                      {company.submission_count}
                    </span>
                    <span className={styles.statLabel}>Submissions</span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            No companies found in the database. Please seed the database or submit a salary package.
          </div>
        )}
      </div>
    </div>
  );
}
