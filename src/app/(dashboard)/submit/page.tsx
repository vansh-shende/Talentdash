'use client';

import { useState } from 'react';
import styles from './submit.module.css';

export default function SubmitSalaryPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    companyName: '',
    jobTitle: '',
    level: '',
    location: '',
    yearsOfExperience: '',
    baseSalary: '',
    variablePay: '',
    equity: '',
    currency: 'USD'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ingest-salary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const text = await response.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch (err) {
        throw new Error(`Server returned non-JSON response (status ${response.status}): ${text.slice(0, 150) || '(empty)'}`);
      }

      if (!response.ok) {
        throw new Error(result.error || 'Submission failed');
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className={styles.container}>
        <div className={`${styles.formCard} glass-panel`} style={{ textAlign: 'center', padding: '48px 32px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '64px', color: 'var(--secondary)', marginBottom: '16px' }}>
            check_circle
          </span>
          <h2 className={styles.title}>Thank You for Submitting!</h2>
          <p className={styles.subtitle} style={{ marginBottom: '24px' }}>
            Your compensation entry for <strong>{formData.companyName}</strong> has been submitted for moderation.
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '480px', margin: '0 auto 32px auto', lineHeight: '1.5' }}>
            Our analysts review all submissions within 24 hours. Your access to the TalentDash databases has been extended by 1 year.
          </p>
          <button 
            onClick={() => setSubmitted(false)} 
            className={styles.submitBtn} 
            style={{ maxWidth: '200px', margin: '0 auto' }}
          >
            Submit Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Submit Your Compensation Package</h1>
        <p className={styles.subtitle}>Help democratize salary intelligence. Submissions are 100% anonymous.</p>
      </header>

      <div className={`${styles.formCard} glass-panel`}>
        <form onSubmit={handleSubmit} id="salary-submission-form">
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="companyName">Company Name</label>
            <input 
              type="text" 
              name="companyName" 
              id="companyName"
              placeholder="e.g., Stripe" 
              className={styles.input} 
              required
              value={formData.companyName}
              onChange={handleChange}
            />
          </div>

          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="jobTitle">Job Title</label>
              <input 
                type="text" 
                name="jobTitle" 
                id="jobTitle"
                placeholder="e.g., Software Engineer" 
                className={styles.input} 
                required
                value={formData.jobTitle}
                onChange={handleChange}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="level">Level / Tier</label>
              <select 
                name="level" 
                id="level"
                className={styles.select}
                required
                value={formData.level}
                onChange={handleChange}
              >
                <option value="" disabled>Select Level</option>
                <option value="L3">L3</option>
                <option value="L4">L4</option>
                <option value="L5">L5</option>
                <option value="L6">L6</option>
                <option value="SDE-I">SDE-I</option>
                <option value="SDE-II">SDE-II</option>
                <option value="SDE-III">SDE-III</option>
                <option value="Staff">Staff</option>
                <option value="Principal">Principal</option>
                <option value="IC4">IC4</option>
                <option value="IC5">IC5</option>
              </select>
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="location">Location</label>
              <input 
                type="text" 
                name="location" 
                id="location"
                placeholder="e.g., San Francisco, CA or Remote" 
                className={styles.input} 
                required
                value={formData.location}
                onChange={handleChange}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="yearsOfExperience">Years of Experience</label>
              <input 
                type="number" 
                name="yearsOfExperience" 
                id="yearsOfExperience"
                placeholder="e.g., 4" 
                className={styles.input} 
                required
                value={formData.yearsOfExperience}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="currency">Currency</label>
              <select 
                name="currency" 
                id="currency"
                className={styles.select}
                value={formData.currency}
                onChange={handleChange}
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="INR">INR (₹)</option>
                <option value="CAD">CAD ($)</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="baseSalary">Base Salary (Annual)</label>
              <input 
                type="number" 
                name="baseSalary" 
                id="baseSalary"
                placeholder="e.g., 140000" 
                className={styles.input} 
                required
                value={formData.baseSalary}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="variablePay">Annual Bonus / Variable</label>
              <input 
                type="number" 
                name="variablePay" 
                id="variablePay"
                placeholder="e.g., 15000 (Optional)" 
                className={styles.input}
                value={formData.variablePay}
                onChange={handleChange}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="equity">Stock / Equity value (per year)</label>
              <input 
                type="number" 
                name="equity" 
                id="equity"
                placeholder="e.g., 30000 (Optional)" 
                className={styles.input}
                value={formData.equity}
                onChange={handleChange}
              />
            </div>
          </div>

          {error && (
            <div style={{ color: '#ff4d4d', backgroundColor: 'rgba(255,77,77,0.1)', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', border: '1px solid rgba(255,77,77,0.2)', textAlign: 'left' }}>
              <strong>Error:</strong> {error}
            </div>
          )}

          <button 
            type="submit" 
            className={styles.submitBtn} 
            id="btn-submit-salary-form"
            disabled={loading}
          >
            <span className={`material-symbols-outlined ${loading ? 'spin' : ''}`}>
              {loading ? 'sync' : 'send'}
            </span>
            {loading ? 'Submitting securely...' : 'Submit Securely & Anonymously'}
          </button>
        </form>
      </div>
    </div>
  );
}
