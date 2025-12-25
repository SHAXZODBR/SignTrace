'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';

interface CaseItem {
  id: string;
  type: string;
  institution: string;
  status: string;
  risk: string | null;
  compliance: number | null;
  date: string;
}

interface ActionItem {
  id: number;
  case: string;
  action: string;
  priority: string;
  age: string;
}

interface DashboardData {
  stats: {
    totalCases: number;
    pendingReview: number;
    highRiskCases: number;
    avgCompliance: number;
  };
  recentCases: CaseItem[];
  pendingActions: ActionItem[];
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);

    // Fetch dashboard data
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(result => {
        setData(result);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    return () => clearInterval(timer);
  }, []);

  const getComplianceColor = (score: number | null) => {
    if (score === null) return 'var(--text-muted)';
    if (score >= 70) return 'var(--success)';
    if (score >= 50) return 'var(--warning)';
    return 'var(--danger)';
  };

  const getRiskBadgeClass = (risk: string | null) => {
    if (!risk) return 'badge-pending';
    return `badge-${risk}`;
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'completed': return 'badge-completed';
      case 'analyzing':
      case 'transcribing': return 'badge-processing';
      default: return 'badge-pending';
    }
  };

  return (
    <>
      <Header
        title="Dashboard"
        subtitle={currentTime ? `${currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}` : 'Loading...'}
      />

      {/* Stats Grid */}
      <div className="stats-grid mb-8">
        <div className="stat-card">
          <div className="stat-label">Jami ishlar</div>
          <div className="stat-value">{loading ? '...' : data?.stats.totalCases.toLocaleString()}</div>
          <div className="stat-change positive">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            </svg>
            +12% from last month
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Ko'rib chiqish kutilmoqda</div>
          <div className="stat-value">{loading ? '...' : data?.stats.pendingReview}</div>
          <div className="stat-change" style={{ color: 'var(--text-muted)' }}>
            Inson ko'rigi kerak
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Yuqori xavfli</div>
          <div className="stat-value" style={{ color: 'var(--danger)' }}>{loading ? '...' : data?.stats.highRiskCases}</div>
          <div className="stat-change negative">
            Shoshilinch e'tibor kerak
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">O'rtacha muvofiqlik</div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>{loading ? '...' : data?.stats.avgCompliance}%</div>
          <div className="stat-change positive">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            </svg>
            +3% from last week
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 'var(--space-6)' }}>
        {/* Recent Cases */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Recent Cases</h3>
              <p className="card-subtitle">Latest recordings and analysis status</p>
            </div>
            <Link href="/cases" className="btn btn-sm btn-secondary">
              View All
            </Link>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Case ID</th>
                <th>Type</th>
                <th>Status</th>
                <th>Risk</th>
                <th>Compliance</th>
              </tr>
            </thead>
            <tbody>
              {(data?.recentCases || []).map((caseItem: CaseItem) => (
                <tr key={caseItem.id} style={{ cursor: 'pointer' }}>
                  <td>
                    <div style={{ fontWeight: 500, fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>
                      {caseItem.id}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {caseItem.institution}
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{caseItem.type}</td>
                  <td>
                    <span className={`badge ${getStatusBadgeClass(caseItem.status)}`}>
                      {caseItem.status}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${getRiskBadgeClass(caseItem.risk)}`}>
                      {caseItem.risk || 'N/A'}
                    </span>
                  </td>
                  <td>
                    {caseItem.compliance !== null ? (
                      <div className="risk-score">
                        <div className="risk-score-bar">
                          <div
                            className="risk-score-fill"
                            style={{
                              width: `${caseItem.compliance}%`,
                              background: getComplianceColor(caseItem.compliance),
                            }}
                          />
                        </div>
                        <span className="risk-score-value" style={{ color: getComplianceColor(caseItem.compliance) }}>
                          {caseItem.compliance}%
                        </span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Quick Actions */}
          <div className="card">
            <h3 className="card-title mb-4">Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <Link href="/upload" className="btn btn-primary" style={{ justifyContent: 'flex-start' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17,8 12,3 7,8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Upload Recording
              </Link>
              <Link href="/cases?filter=high-risk" className="btn btn-danger" style={{ justifyContent: 'flex-start' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                </svg>
                Review High Risk
              </Link>
              <Link href="/analytics" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
                View Analytics
              </Link>
            </div>
          </div>

          {/* Pending Actions */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: 'var(--space-4)' }}>
              <h3 className="card-title">Pending Actions</h3>
              <span className="badge badge-processing">{data?.pendingActions?.length || 0}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {(data?.pendingActions || []).map((action: ActionItem) => (
                <div
                  key={action.id}
                  style={{
                    padding: 'var(--space-3)',
                    background: 'var(--bg-elevated)',
                    borderRadius: 'var(--radius-lg)',
                    borderLeft: `3px solid ${action.priority === 'critical' ? 'var(--danger)' : action.priority === 'high' ? '#f97316' : 'var(--warning)'}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 500 }}>
                      {action.case}
                    </span>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{action.age}</span>
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{action.action}</p>
                </div>
              ))}
            </div>
          </div>

          {/* System Status */}
          <div className="card" style={{ background: 'var(--bg-secondary)' }}>
            <h3 className="card-title mb-4">System Status</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Transcription Engine</span>
                <span className="live-indicator">Online</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Compliance Analysis</span>
                <span className="live-indicator">Online</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Bias Detection</span>
                <span className="live-indicator">Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
