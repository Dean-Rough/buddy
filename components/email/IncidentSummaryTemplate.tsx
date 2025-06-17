import React from 'react';
import { BaseEmailTemplate } from './BaseEmailTemplate';

interface IncidentData {
  childName: string;
  incidentDate: string;
  incidentTime: string;
  severityLevel: 'low' | 'medium' | 'high' | 'critical';
  incidentType: string;
  description: string;
  conversationContext: {
    duration: number;
    messageCount: number;
    topics: string[];
  };
  safetyResponse: {
    immediateAction: string;
    escalationTriggered: boolean;
    responseTime: string;
  };
  childResponse: {
    emotionalState: string;
    cooperationLevel: string;
    understandingShown: boolean;
  };
  recommendations: {
    immediate: string[];
    followUp: string[];
    prevention: string[];
  };
  nextSteps: string[];
  contactInfo: {
    supportEmail: string;
    supportPhone?: string;
  };
  dashboardUrl: string;
  unsubscribeUrl: string;
}

interface IncidentSummaryTemplateProps {
  data: IncidentData;
}

/**
 * Incident summary email template for safety events requiring parent attention
 */
export const IncidentSummaryTemplate: React.FC<
  IncidentSummaryTemplateProps
> = ({ data }) => {
  const severityColors = {
    low: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
    medium: { bg: '#fed7aa', border: '#ea580c', text: '#9a3412' },
    high: { bg: '#fecaca', border: '#dc2626', text: '#991b1b' },
    critical: { bg: '#fca5a5', border: '#b91c1c', text: '#7f1d1d' },
  };

  const severityColor = severityColors[data.severityLevel];
  const preheader = `Safety incident reported for ${data.childName} - ${data.severityLevel} severity`;

  return (
    <BaseEmailTemplate
      title={`Safety Incident Report - ${data.childName}`}
      preheader={preheader}
    >
      {/* Header */}
      <div
        className="email-header"
        style={{
          background: `linear-gradient(135deg, ${severityColor.border} 0%, #dc2626 100%)`,
        }}
      >
        <h1>🚨 Safety Incident Report</h1>
        <p>
          {data.childName} • {data.incidentDate} at {data.incidentTime}
        </p>
      </div>

      <div className="email-content">
        {/* Incident Overview */}
        <div className="email-section">
          <div
            style={{
              backgroundColor: severityColor.bg,
              border: `2px solid ${severityColor.border}`,
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '20px',
            }}
          >
            <h2
              style={{
                margin: '0 0 10px 0',
                color: severityColor.text,
                textTransform: 'uppercase',
                fontSize: '16px',
              }}
            >
              {data.severityLevel} Severity Incident
            </h2>
            <p
              style={{
                margin: '0',
                fontWeight: '600',
                color: severityColor.text,
              }}
            >
              {data.incidentType}
            </p>
          </div>

          <h2>📋 Incident Details</h2>
          <p>{data.description}</p>
        </div>

        {/* Conversation Context */}
        <div className="email-section">
          <h2>💬 Conversation Context</h2>
          <div className="stats-container">
            <div className="stat-item">
              <span className="stat-value">
                {data.conversationContext.duration} mins
              </span>
              <span className="stat-label">Conversation length</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">
                {data.conversationContext.messageCount}
              </span>
              <span className="stat-label">Messages exchanged</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">
                {data.conversationContext.topics.length}
              </span>
              <span className="stat-label">Topics discussed</span>
            </div>
          </div>
          <p>
            <strong>Topics:</strong>{' '}
            {data.conversationContext.topics.join(', ')}
          </p>
        </div>

        {/* Safety Response */}
        <div className="email-section">
          <h2>⚡ Immediate Safety Response</h2>
          <div
            style={{
              backgroundColor: '#f0f9ff',
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '15px',
            }}
          >
            <p>
              <strong>Action Taken:</strong>{' '}
              {data.safetyResponse.immediateAction}
            </p>
            <p>
              <strong>Response Time:</strong> {data.safetyResponse.responseTime}
            </p>
            <p>
              <strong>Escalation Triggered:</strong>{' '}
              {data.safetyResponse.escalationTriggered ? '✅ Yes' : '❌ No'}
            </p>
          </div>
        </div>

        {/* Child Response */}
        <div className="email-section">
          <h2>👤 {data.childName}&apos;s Response</h2>
          <div style={{ display: 'grid', gap: '10px' }}>
            <p>
              <strong>Emotional State:</strong>{' '}
              {data.childResponse.emotionalState}
            </p>
            <p>
              <strong>Cooperation Level:</strong>{' '}
              {data.childResponse.cooperationLevel}
            </p>
            <p>
              <strong>Understanding Shown:</strong>{' '}
              {data.childResponse.understandingShown ? '✅ Yes' : '❌ No'}
            </p>
          </div>
        </div>

        {/* Recommendations */}
        <div className="email-section">
          <h2>💡 Recommendations</h2>

          <div style={{ marginBottom: '20px' }}>
            <h3
              style={{
                fontSize: '16px',
                marginBottom: '8px',
                color: '#dc2626',
              }}
            >
              Immediate Actions
            </h3>
            <ul style={{ paddingLeft: '20px', margin: '0' }}>
              {data.recommendations.immediate.map((action, index) => (
                <li key={index} style={{ margin: '6px 0', color: '#374151' }}>
                  {action}
                </li>
              ))}
            </ul>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h3
              style={{
                fontSize: '16px',
                marginBottom: '8px',
                color: '#ea580c',
              }}
            >
              Follow-up Actions
            </h3>
            <ul style={{ paddingLeft: '20px', margin: '0' }}>
              {data.recommendations.followUp.map((action, index) => (
                <li key={index} style={{ margin: '6px 0', color: '#374151' }}>
                  {action}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3
              style={{
                fontSize: '16px',
                marginBottom: '8px',
                color: '#059669',
              }}
            >
              Prevention Strategies
            </h3>
            <ul style={{ paddingLeft: '20px', margin: '0' }}>
              {data.recommendations.prevention.map((strategy, index) => (
                <li key={index} style={{ margin: '6px 0', color: '#374151' }}>
                  {strategy}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Next Steps */}
        <div className="email-section">
          <h2>📝 Next Steps</h2>
          <div className="conversation-starters">
            <p>Here&apos;s what happens next:</p>
            <ol style={{ paddingLeft: '20px', margin: '10px 0' }}>
              {data.nextSteps.map((step, index) => (
                <li key={index} style={{ margin: '8px 0', color: '#374151' }}>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Contact Information */}
        <div className="email-section">
          <h2>📞 Need Support?</h2>
          <div
            style={{
              backgroundColor: '#f0f9ff',
              padding: '15px',
              borderRadius: '8px',
            }}
          >
            <p style={{ margin: '0 0 10px 0', fontWeight: '600' }}>
              If you need immediate assistance or have questions:
            </p>
            <p style={{ margin: '5px 0' }}>
              📧 Email:{' '}
              <a href={`mailto:${data.contactInfo.supportEmail}`}>
                {data.contactInfo.supportEmail}
              </a>
            </p>
            {data.contactInfo.supportPhone && (
              <p style={{ margin: '5px 0' }}>
                📞 Phone:{' '}
                <a href={`tel:${data.contactInfo.supportPhone}`}>
                  {data.contactInfo.supportPhone}
                </a>
              </p>
            )}
            <p style={{ margin: '5px 0 0 0' }}>
              🌐 Dashboard: <a href={data.dashboardUrl}>View Full Details</a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="email-footer">
          <p>
            Generated by Onda AI Safety System •
            <a href={data.dashboardUrl}>View Dashboard</a> •
            <a href={data.unsubscribeUrl}>Email Settings</a>
          </p>
          <p style={{ marginTop: '10px', fontSize: '12px', color: '#9ca3af' }}>
            Incident reports are generated immediately when safety concerns are
            detected.
            <br />
            Your child&apos;s safety and wellbeing are our top priority.
          </p>
        </div>
      </div>
    </BaseEmailTemplate>
  );
};
