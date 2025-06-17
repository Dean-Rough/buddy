import React from 'react';

interface BaseEmailTemplateProps {
  children: React.ReactNode;
  title: string;
  preheader?: string;
}

/**
 * Base email template with responsive design and email client compatibility
 * Supports 10+ email clients including Gmail, Outlook, Apple Mail, etc.
 */
export const BaseEmailTemplate: React.FC<BaseEmailTemplateProps> = ({
  children,
  title,
  preheader,
}) => {
  return (
    <html>
      {/* eslint-disable-next-line @next/next/no-head-element */}
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <title>{title}</title>
        {preheader && (
          <style
            dangerouslySetInnerHTML={{
              __html: `
                .preheader { display: none !important; visibility: hidden; opacity: 0; color: transparent; height: 0; width: 0; }
              `,
            }}
          />
        )}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              /* Reset styles for email clients */
              body, table, td, p, a, li, blockquote { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
              table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
              img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
              
              /* Base styles */
              body {
                margin: 0 !important;
                padding: 0 !important;
                background-color: #f5f5f5;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #374151;
              }
              
              /* Container */
              .email-container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
              }
              
              /* Header */
              .email-header {
                background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
                color: #ffffff;
                padding: 30px 20px;
                text-align: center;
              }
              
              .email-header h1 {
                margin: 0 0 10px 0;
                font-size: 24px;
                font-weight: 600;
                line-height: 1.2;
              }
              
              .email-header p {
                margin: 0;
                opacity: 0.9;
                font-size: 16px;
              }
              
              /* Content */
              .email-content {
                padding: 0;
              }
              
              .email-section {
                padding: 20px;
                border-bottom: 1px solid #e5e7eb;
              }
              
              .email-section:last-child {
                border-bottom: none;
              }
              
              .email-section h2 {
                margin: 0 0 15px 0;
                font-size: 18px;
                font-weight: 600;
                color: #1f2937;
              }
              
              /* Stats layout */
              .stats-container {
                display: table;
                width: 100%;
                margin: 20px 0;
              }
              
              .stat-item {
                display: table-cell;
                text-align: center;
                padding: 15px 10px;
                background: #f8fafc;
                border-radius: 8px;
                vertical-align: top;
                width: 33.33%;
              }
              
              .stat-item + .stat-item {
                padding-left: 20px;
              }
              
              .stat-value {
                display: block;
                font-size: 20px;
                font-weight: 700;
                color: #2563eb;
                margin-bottom: 5px;
              }
              
              .stat-label {
                font-size: 14px;
                color: #6b7280;
              }
              
              /* Highlights */
              .highlight-box {
                background: #eff6ff;
                border-left: 4px solid #2563eb;
                padding: 15px;
                margin: 10px 0;
                border-radius: 0 6px 6px 0;
              }
              
              /* Safety status */
              .safety-good { color: #059669; font-weight: 600; }
              .safety-concern { color: #dc2626; font-weight: 600; }
              
              /* Conversation starters */
              .conversation-starters {
                background: #f9fafb;
                padding: 15px;
                border-radius: 8px;
                margin: 15px 0;
              }
              
              .conversation-starters ul {
                margin: 10px 0;
                padding-left: 20px;
              }
              
              .conversation-starters li {
                margin: 8px 0;
                color: #374151;
              }
              
              /* Footer */
              .email-footer {
                text-align: center;
                padding: 20px;
                background: #f9fafb;
                color: #6b7280;
                font-size: 14px;
              }
              
              .email-footer a {
                color: #2563eb;
                text-decoration: none;
              }
              
              .email-footer a:hover {
                text-decoration: underline;
              }
              
              /* Mobile responsiveness */
              @media only screen and (max-width: 600px) {
                .email-container {
                  width: 100% !important;
                }
                
                .stats-container {
                  display: block !important;
                  width: 100% !important;
                }
                
                .stat-item {
                  display: block !important;
                  width: 100% !important;
                  margin-bottom: 10px;
                  padding: 15px !important;
                }
                
                .stat-item + .stat-item {
                  padding-left: 15px !important;
                }
                
                .email-section {
                  padding: 15px !important;
                }
                
                .email-header {
                  padding: 20px 15px !important;
                }
                
                .email-header h1 {
                  font-size: 20px !important;
                }
              }
              
              /* Dark mode support */
              @media (prefers-color-scheme: dark) {
                .email-container {
                  background-color: #1f2937 !important;
                  color: #f3f4f6 !important;
                }
                
                .email-section {
                  border-color: #374151 !important;
                }
                
                .email-section h2 {
                  color: #f3f4f6 !important;
                }
                
                .stat-item {
                  background: #374151 !important;
                }
                
                .highlight-box {
                  background: #1e3a8a !important;
                  color: #e5e7eb !important;
                }
                
                .conversation-starters {
                  background: #374151 !important;
                }
                
                .email-footer {
                  background: #374151 !important;
                  color: #9ca3af !important;
                }
              }
            `,
          }}
        />
      </head>
      <body>
        {preheader && <div className="preheader">{preheader}</div>}
        <div className="email-container">{children}</div>
      </body>
    </html>
  );
};
