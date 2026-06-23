import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.container}>
      {/* Navigation Header */}
      <nav className={styles.nav}>
        <div className={styles.logo}>
          <span className="material-symbols-outlined">analytics</span>
          <span>TalentDash</span>
        </div>
        <div className={styles.navLinks}>
          <Link href="/compensation" className={styles.navItem}>
            Salaries
          </Link>
          <Link href="/levels" className={styles.navItem}>
            Levels
          </Link>
          <Link href="/compare" className={styles.navItem}>
            Compare
          </Link>
          <Link href="/overview" className={styles.btnPrimary}>
            Go to Dashboard
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className={styles.hero}>
        <h1 className={styles.title}>
          Democratizing <br />
          <span className={styles.titleHighlight}>Compensation Intelligence</span>
        </h1>
        <p className={styles.subtitle}>
          Compare salary bands, verify total compensation distributions, and level up your negotiation with crowd-sourced salary data.
        </p>

        {/* Universal Search Bar */}
        <div className={`${styles.searchBox} glass-panel`}>
          <div className={styles.searchInputWrapper}>
            <span className="material-symbols-outlined">search</span>
            <input 
              type="text" 
              placeholder="Job Title or Company..." 
              className={styles.input}
              id="landing-search-job"
            />
          </div>
          <div className={styles.searchInputWrapper}>
            <span className="material-symbols-outlined">location_on</span>
            <input 
              type="text" 
              placeholder="City or 'Remote'..." 
              className={styles.input}
              id="landing-search-location"
            />
          </div>
          <Link 
            href="/compensation" 
            className={styles.searchBtn}
            id="landing-search-submit"
            title="Search Salaries"
          >
            <span className="material-symbols-outlined">arrow_forward</span>
          </Link>
        </div>

        {/* Quick statistics */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statNum}>104k+</span>
            <span className={styles.statLabel}>Salary Submissions</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNum}>1,420+</span>
            <span className={styles.statLabel}>Verified Tech Companies</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNum}>98.4%</span>
            <span className={styles.statLabel}>Data Accuracy Score</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>&copy; {new Date().getFullYear()} TalentDash. Dedicated to salary transparency.</p>
      </footer>
    </div>
  );
}
