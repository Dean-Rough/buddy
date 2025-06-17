import React from 'react';
import { BaseEmailTemplate } from './BaseEmailTemplate';

interface MonthlyData {
  childName: string;
  childAge: number;
  monthDateRange: string;
  totalChatTime: string;
  totalSessions: number;
  avgSessionLength: number;
  weeklyTrends: {
    week: string;
    sessions: number;
    chatTime: string;
    avgMood: string;
  }[];
  monthlyHighlights: string[];
  developmentalMilestones: string[];
  concernsToMonitor: string[];
  topInterests: string[];
  emotionalGrowth: string;
  socialDevelopment: string;
  safetyOverview: {
    status: 'excellent' | 'good' | 'needs_attention';
    details: string;
  };
  parentRecommendations: string[];
  dashboardUrl: string;
  unsubscribeUrl: string;
}

interface MonthlySummaryTemplateProps {
  data: MonthlyData;
}

/**
 * Monthly summary email template with developmental insights and trends
 */
export const MonthlySummaryTemplate: React.FC<MonthlySummaryTemplateProps> = ({
  data,
}) => {
  const preheader = `${data.childName}&apos;s monthly development summary: ${data.totalSessions} conversations and key growth insights`;

  return (
    <BaseEmailTemplate
      title={`${data.childName}&apos;s Monthly Development Summary`}
      preheader={preheader}
    >
      {/* Header */}
      <div className="email-header">
        <h1>📈 {data.childName}&apos;s Monthly Summary</h1>
        <p>{data.monthDateRange}</p>
      </div>

      <div className="email-content">
        {/* Monthly Overview */}
        <div className="email-section">
          <h2>📊 Monthly Overview</h2>
          <div className="stats-container">
            <div className="stat-item">
              <span className="stat-value">{data.totalChatTime}</span>
              <span className="stat-label">Total chat time</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{data.totalSessions}</span>
              <span className="stat-label">Total conversations</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{data.avgSessionLength} mins</span>
              <span className="stat-label">Average length</span>
            </div>
          </div>
        </div>

        {/* Weekly Trends */}
        <div className="email-section">
          <h2>📈 Weekly Trends</h2>
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                marginTop: '10px',
              }}
            >
              <thead>
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  <th
                    style={{
                      padding: '8px',
                      textAlign: 'left',
                      fontSize: '14px',
                      fontWeight: '600',
                    }}
                  >
                    Week
                  </th>
                  <th
                    style={{
                      padding: '8px',
                      textAlign: 'center',
                      fontSize: '14px',
                      fontWeight: '600',
                    }}
                  >
                    Sessions
                  </th>
                  <th
                    style={{
                      padding: '8px',
                      textAlign: 'center',
                      fontSize: '14px',
                      fontWeight: '600',
                    }}
                  >
                    Chat Time
                  </th>
                  <th
                    style={{
                      padding: '8px',
                      textAlign: 'center',
                      fontSize: '14px',
                      fontWeight: '600',
                    }}
                  >
                    Avg Mood
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.weeklyTrends.map((week, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '8px', fontSize: '14px' }}>
                      {week.week}
                    </td>
                    <td
                      style={{
                        padding: '8px',
                        textAlign: 'center',
                        fontSize: '14px',
                      }}
                    >
                      {week.sessions}
                    </td>
                    <td
                      style={{
                        padding: '8px',
                        textAlign: 'center',
                        fontSize: '14px',
                      }}
                    >
                      {week.chatTime}
                    </td>
                    <td
                      style={{
                        padding: '8px',
                        textAlign: 'center',
                        fontSize: '14px',
                      }}
                    >
                      {week.avgMood}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Developmental Milestones */}
        <div className="email-section">
          <h2>🌟 Developmental Progress</h2>
          <p style={{ marginBottom: '15px', fontWeight: '600' }}>
            Key milestones observed this month:
          </p>
          {data.developmentalMilestones.map((milestone, index) => (
            <div key={index} className="highlight-box">
              {milestone}
            </div>
          ))}
        </div>

        {/* Top Interests */}
        <div className="email-section">
          <h2>🎯 Top Interests & Topics</h2>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              marginTop: '10px',
            }}
          >
            {data.topInterests.map((interest, index) => (
              <span
                key={index}
                style={{
                  backgroundColor: '#eff6ff',
                  color: '#2563eb',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
              >
                {interest}
              </span>
            ))}
          </div>
        </div>

        {/* Emotional & Social Growth */}
        <div className="email-section">
          <h2>💝 Emotional & Social Growth</h2>
          <div style={{ marginBottom: '15px' }}>
            <h3
              style={{
                fontSize: '16px',
                marginBottom: '8px',
                color: '#374151',
              }}
            >
              Emotional Development
            </h3>
            <p>{data.emotionalGrowth}</p>
          </div>
          <div>
            <h3
              style={{
                fontSize: '16px',
                marginBottom: '8px',
                color: '#374151',
              }}
            >
              Social Development
            </h3>
            <p>{data.socialDevelopment}</p>
          </div>
        </div>

        {/* Monthly Highlights */}
        {data.monthlyHighlights.length > 0 && (
          <div className="email-section">
            <h2>✨ Month&apos;s Biggest Highlights</h2>
            {data.monthlyHighlights.map((highlight, index) => (
              <div key={index} className="highlight-box">
                {highlight}
              </div>
            ))}
          </div>
        )}

        {/* Safety Overview */}
        <div className="email-section">
          <h2>🛡️ Safety Overview</h2>
          <p
            className={
              data.safetyOverview.status === 'excellent'
                ? 'safety-good'
                : data.safetyOverview.status === 'good'
                  ? 'safety-good'
                  : 'safety-concern'
            }
          >
            {data.safetyOverview.status === 'excellent' &&
              '✅ Excellent - All conversations were highly appropriate'}
            {data.safetyOverview.status === 'good' &&
              '✅ Good - Conversations were generally appropriate'}
            {data.safetyOverview.status === 'needs_attention' &&
              '⚠️ Needs Attention - Some safety considerations noted'}
          </p>
          {data.safetyOverview.details && <p>{data.safetyOverview.details}</p>}
        </div>

        {/* Areas to Monitor */}
        {data.concernsToMonitor.length > 0 && (
          <div className="email-section">
            <h2>👁️ Areas to Monitor</h2>
            <p
              style={{
                marginBottom: '10px',
                fontSize: '14px',
                color: '#6b7280',
              }}
            >
              These aren&apos;t concerns, but areas where gentle attention might
              be beneficial:
            </p>
            <ul style={{ paddingLeft: '20px' }}>
              {data.concernsToMonitor.map((concern, index) => (
                <li key={index} style={{ margin: '6px 0', color: '#374151' }}>
                  {concern}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Parent Recommendations */}
        <div className="email-section">
          <h2>💡 Recommendations for Next Month</h2>
          <div className="conversation-starters">
            <p>
              Based on this month&apos;s patterns, here are some suggestions:
            </p>
            <ul>
              {data.parentRecommendations.map((recommendation, index) => (
                <li key={index}>{recommendation}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="email-footer">
          <p>
            Generated by Onda AI •
            <a href={data.dashboardUrl}>View Full Dashboard</a> •
            <a href={data.unsubscribeUrl}>Email Settings</a>
          </p>
          <p style={{ marginTop: '10px', fontSize: '12px', color: '#9ca3af' }}>
            Monthly summaries provide deeper developmental insights using
            aggregated conversation patterns.
            <br />
            Individual conversation content remains private and secure.
          </p>
        </div>
      </div>
    </BaseEmailTemplate>
  );
};
