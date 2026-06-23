import styles from './levels.module.css';

export default function LevelsPage() {
  const levelMatrix = [
    { tier: "Entry / Junior", google: "L3", meta: "E3", stripe: "L1", amazon: "L4", apple: "ICT2", microsoft: "59/60" },
    { tier: "Intermediate / Mid", google: "L4", meta: "E4", stripe: "L2", amazon: "L5", apple: "ICT3", microsoft: "61/62" },
    { tier: "Senior Engineer", google: "L5", meta: "E5", stripe: "L3", amazon: "L6", apple: "ICT4", microsoft: "63/64" },
    { tier: "Staff / Tech Lead", google: "L6", meta: "E6", stripe: "L4", amazon: "L7", apple: "ICT5", microsoft: "65/66" },
    { tier: "Principal / Director", google: "L7", meta: "E7", stripe: "L5", amazon: "L8", apple: "ICT6", microsoft: "67/68" }
  ];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Normalized Leveling Matrix</h1>
        <p className={styles.subtitle}>Map equivalent software engineering levels across top technology companies.</p>
      </header>

      <div className={styles.tableCard}>
        <table className={styles.table} id="levels-table">
          <thead>
            <tr>
              <th className={styles.th}>Normalized Tier</th>
              <th className={styles.th}>Google</th>
              <th className={styles.th}>Meta</th>
              <th className={styles.th}>Stripe</th>
              <th className={styles.th}>Amazon</th>
              <th className={styles.th}>Apple</th>
              <th className={styles.th}>Microsoft</th>
            </tr>
          </thead>
          <tbody>
            {levelMatrix.map((row, index) => (
              <tr key={index} className={styles.tr}>
                <td className={styles.td}>
                  <span className={styles.tierLabel}>{row.tier}</span>
                </td>
                <td className={styles.td}>
                  <span className={styles.levelCode}>{row.google}</span>
                </td>
                <td className={styles.td}>
                  <span className={styles.levelCode}>{row.meta}</span>
                </td>
                <td className={styles.td}>
                  <span className={styles.levelCode}>{row.stripe}</span>
                </td>
                <td className={styles.td}>
                  <span className={styles.levelCode}>{row.amazon}</span>
                </td>
                <td className={styles.td}>
                  <span className={styles.levelCode}>{row.apple}</span>
                </td>
                <td className={styles.td}>
                  <span className={styles.levelCode}>{row.microsoft}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
