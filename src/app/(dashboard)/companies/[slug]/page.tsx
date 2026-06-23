import { cookies } from 'next/headers';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getFormattedCompensation } from '@/lib/currency';
import styles from './company.module.css';

interface CompanyPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const companies = await prisma.company.findMany({
    select: { slug: true }
  });
  return companies.map(c => ({ slug: c.slug }));
}

const LEVEL_COLORS = [
  '#FF5A5F', // Coral Red
  '#00A699', // Teal
  '#FFB400', // Yellow/Gold
  '#484848', // Charcoal
  '#3B5998', // Classic Blue
  '#8A2BE2', // Purple
  '#767676', // Light Gray
  '#32CD32', // Lime Green
  '#D2691E'  // Chocolate
];

export default async function CompanyDetailPage({ params }: CompanyPageProps) {
  const { slug } = await params;
  
  // Find the company
  const company = await prisma.company.findUnique({
    where: { slug: slug.toLowerCase().trim() }
  });

  if (!company) {
    notFound();
  }

  // Get active currency
  const cookieStore = await cookies();
  const targetCurrency = cookieStore.get('currency')?.value || 'USD';

  // 1. Fetch aggregates
  const aggregations = await prisma.salary.aggregate({
    where: { companyId: company.id },
    _min: { totalCompensation: true },
    _max: { totalCompensation: true },
    _count: { id: true }
  });

  const totalSubmissions = aggregations._count.id;
  const minTC = Number(aggregations._min.totalCompensation || 0);
  const maxTC = Number(aggregations._max.totalCompensation || 0);

  // 2. Fetch median total compensation
  const medianResult = await prisma.$queryRaw<[{ median: number | null }]>`
    SELECT COALESCE(percentile_cont(0.5) WITHIN GROUP (ORDER BY total_compensation)::numeric, 0)::float as median
    FROM salaries
    WHERE company_id = ${company.id}::uuid
  `;
  const medianTC = medianResult[0]?.median || 0;

  // 3. Fetch level distribution
  const levelDistributionQuery = await prisma.salary.groupBy({
    by: ['level'],
    where: { companyId: company.id },
    _count: { id: true }
  });

  const levelDistribution = levelDistributionQuery.map(group => ({
    level: group.level,
    count: group._count.id
  })).sort((a, b) => b.count - a.count);

  // 4. Fetch list of salaries for this company
  const salaries = await prisma.salary.findMany({
    where: { companyId: company.id },
    orderBy: { submittedAt: 'desc' }
  });

  return (
    <div className={styles.container}>
      <Link href="/companies" className={styles.backLink}>
        <span className="material-symbols-outlined">arrow_back</span>
        Back to Companies
      </Link>

      {/* Header section */}
      <header className={styles.headerCard}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className={styles.industryTag}>{company.industry || 'Technology'}</span>
          </div>
          <h1 className={styles.companyTitle}>{company.name}</h1>
          <div className={styles.metaRow}>
            <span className={styles.metaItem}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>location_on</span>
              {company.headquarters || 'San Francisco, CA'}
            </span>
            {company.foundedYear && (
              <span className={styles.metaItem}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>calendar_today</span>
                Founded {company.foundedYear}
              </span>
            )}
            {company.headcountRange && (
              <span className={styles.metaItem}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>groups</span>
                {company.headcountRange} employees
              </span>
            )}
          </div>
        </div>
        <div className={styles.actionArea}>
          <Link 
            href={`/compare?c1=${company.slug}`} 
            className={styles.compareBtn}
            id={`btn-compare-${company.slug}`}
          >
            <span className="material-symbols-outlined">compare_arrows</span>
            Compare Company
          </Link>
        </div>
      </header>

      {/* Insights Section */}
      <div className={styles.overviewSection}>
        {/* Stats card */}
        <section className={styles.statsCard}>
          <h2 className={styles.statsTitle}>
            <span className="material-symbols-outlined">analytics</span>
            Compensation Summary
          </h2>
          <div className={styles.medianBadge}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Median Total Comp
            </span>
            <div className={styles.medianVal}>
              {medianTC > 0 
                ? getFormattedCompensation(medianTC, 'USD', targetCurrency)
                : 'N/A'
              }
            </div>
          </div>
          <div className={styles.rangeRow}>
            <span className={styles.rangeLabel}>Lowest Package</span>
            <span className={styles.rangeVal}>
              {minTC > 0 ? getFormattedCompensation(minTC, 'USD', targetCurrency) : 'N/A'}
            </span>
          </div>
          <div className={styles.rangeRow}>
            <span className={styles.rangeLabel}>Highest Package</span>
            <span className={styles.rangeVal}>
              {maxTC > 0 ? getFormattedCompensation(maxTC, 'USD', targetCurrency) : 'N/A'}
            </span>
          </div>
          <div className={styles.rangeRow} style={{ borderBottom: 'none' }}>
            <span className={styles.rangeLabel}>Submissions count</span>
            <span className={styles.rangeVal}>{totalSubmissions} records</span>
          </div>
        </section>

        {/* Level Distribution Stacked Bar */}
        <section className={styles.distributionCard}>
          <h2 className={styles.statsTitle}>
            <span className="material-symbols-outlined">bar_chart</span>
            Level Distribution
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 16px 0' }}>
            A proportional breakdown of submission levels reported by employees at {company.name}. Hover over segments to see details.
          </p>

          {totalSubmissions > 0 ? (
            <>
              <div className={styles.distributionBar}>
                {levelDistribution.map((item, index) => {
                  const percentage = (item.count / totalSubmissions) * 100;
                  const color = LEVEL_COLORS[index % LEVEL_COLORS.length];
                  return (
                    <div 
                      key={`seg-${item.level}`}
                      className={styles.distributionSegment}
                      style={{ 
                        width: `${percentage}%`, 
                        backgroundColor: color 
                      }}
                    >
                      <div className={styles.segmentTooltip}>
                        {item.level}: {item.count} ({percentage.toFixed(0)}%)
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className={styles.legendGrid}>
                {levelDistribution.map((item, index) => {
                  const percentage = (item.count / totalSubmissions) * 100;
                  const color = LEVEL_COLORS[index % LEVEL_COLORS.length];
                  return (
                    <div key={`legend-${item.level}`} className={styles.legendItem}>
                      <div className={styles.legendDot} style={{ backgroundColor: color }}></div>
                      <span>
                        <strong>{item.level}</strong> &bull; {percentage.toFixed(0)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
              No levels data available yet.
            </div>
          )}
        </section>
      </div>

      {/* Salary List Table */}
      <section className={styles.tableSection}>
        <div className={styles.tableHeader}>
          <h2 className={styles.tableTitle}>Salary Listings</h2>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Showing {salaries.length} verified employee payouts
          </span>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Role / Title</th>
                <th className={styles.th}>Level</th>
                <th className={styles.th}>Location</th>
                <th className={styles.th}>Base Salary</th>
                <th className={styles.th}>Bonus</th>
                <th className={styles.th}>Stock</th>
                <th className={styles.th}>Total Comp</th>
                <th className={styles.th}>Source</th>
                <th className={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {salaries.length > 0 ? (
                salaries.map((item) => {
                  let sourceClass = styles.sourceContributor;
                  if (item.source === 'SCRAPED') sourceClass = styles.sourceScraped;
                  else if (item.source === 'AI_INFERRED') sourceClass = styles.sourceInferred;

                  return (
                    <tr key={item.id} className={styles.tr}>
                      <td className={`${styles.td} ${styles.roleCell}`}>{item.role}</td>
                      <td className={styles.td}>
                        <span className={styles.levelCell}>{item.level}</span>
                      </td>
                      <td className={styles.td}>{item.location}</td>
                      <td className={styles.td}>
                        {getFormattedCompensation(Number(item.baseSalary), item.currency, targetCurrency)}
                      </td>
                      <td className={styles.td}>
                        {getFormattedCompensation(Number(item.bonus), item.currency, targetCurrency)}
                      </td>
                      <td className={styles.td}>
                        {getFormattedCompensation(Number(item.stock), item.currency, targetCurrency)}
                      </td>
                      <td className={`${styles.td} ${styles.compCell}`}>
                        {getFormattedCompensation(Number(item.totalCompensation), item.currency, targetCurrency)}
                      </td>
                      <td className={styles.td}>
                        <span className={`${styles.sourceBadge} ${sourceClass}`}>
                          {item.source.replace('_', ' ')}
                        </span>
                      </td>
                      <td className={styles.td}>
                        <Link 
                          href={`/salaries/${item.id}`} 
                          className={styles.btnDetail}
                          id={`btn-view-${item.id}`}
                        >
                          Details
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_right</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                    No salary records found for this company.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
