import nodemailer from 'nodemailer';

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = this.createTransporter();
  }

  /**
   * Create email transporter based on environment
   */
  private createTransporter(): nodemailer.Transporter {
    // Check for Resend configuration (FREE: 3,000 emails/month - RECOMMENDED)
    if (process.env.RESEND_API_KEY) {
      return nodemailer.createTransport({
        host: 'smtp.resend.com',
        port: 587,
        secure: false,
        auth: {
          user: 'resend',
          pass: process.env.RESEND_API_KEY,
        },
      });
    }

    // Check for SendGrid configuration (FREE: 100 emails/day)
    if (process.env.SENDGRID_API_KEY) {
      return nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: 'apikey',
          pass: process.env.SENDGRID_API_KEY,
        },
      });
    }

    // Fallback to SMTP configuration
    if (process.env.SMTP_HOST) {
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }

    // Development mode - log to console
    if (process.env.NODE_ENV === 'development') {
      return nodemailer.createTransport({
        streamTransport: true,
        newline: 'unix',
        buffer: true,
      });
    }

    throw new Error(
      'No email service configured. Please set up SendGrid, Resend, or SMTP credentials.'
    );
  }

  /**
   * Send weekly summary email
   */
  async sendSummaryEmail(
    parentEmail: string,
    subject: string,
    htmlContent: string,
    plainTextContent?: string
  ): Promise<void> {
    const fromEmail = process.env.FROM_EMAIL || 'noreply@onda.ai';
    const fromName = process.env.FROM_NAME || 'Onda AI';

    const mailOptions = {
      from: `${fromName} <${fromEmail}>`,
      to: parentEmail,
      subject: subject,
      html: htmlContent,
      text: plainTextContent || this.stripHtml(htmlContent),
      headers: {
        'List-Unsubscribe': `<${process.env.NEXT_PUBLIC_BASE_URL}/parent/email-settings>`,
        'X-Mailer': 'Onda AI Summary Service',
      },
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);

      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Email would be sent to:', parentEmail);
        console.log('Subject:', subject);
        console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
      } else {
        console.log('📧 Email sent successfully to:', parentEmail);
        console.log('Message ID:', info.messageId);
      }
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new Error(`Email delivery failed: ${error}`);
    }
  }

  /**
   * Send error notification to admin
   */
  async sendErrorNotification(error: Error, context: string): Promise<void> {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      console.log('No admin email configured for error notifications');
      return;
    }

    const subject = `Onda AI: Weekly Summary Generation Error`;
    const htmlContent = `
      <h2>Weekly Summary Generation Error</h2>
      <p><strong>Context:</strong> ${context}</p>
      <p><strong>Error:</strong> ${error.message}</p>
      <pre>${error.stack}</pre>
      <p><em>Time:</em> ${new Date().toISOString()}</p>
    `;

    try {
      await this.sendSummaryEmail(adminEmail, subject, htmlContent);
    } catch (emailError) {
      console.error('Failed to send error notification:', emailError);
    }
  }

  /**
   * Test email configuration
   */
  async testEmailConfiguration(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('✅ Email configuration is valid');
      return true;
    } catch (error) {
      console.error('❌ Email configuration failed:', error);
      return false;
    }
  }

  /**
   * Send test email
   */
  async sendTestEmail(toEmail: string): Promise<void> {
    const subject = 'Onda AI - Email Configuration Test';
    const htmlContent = `
      <h2>Email Configuration Test</h2>
      <p>This is a test email to verify that email delivery is working correctly.</p>
      <p><strong>Sent at:</strong> ${new Date().toISOString()}</p>
      <p>If you received this email, your email configuration is working properly.</p>
    `;

    await this.sendSummaryEmail(toEmail, subject, htmlContent);
  }

  /**
   * Strip HTML tags for plain text fallback
   */
  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Format email for development preview
   */
  private formatEmailPreview(subject: string, htmlContent: string): string {
    return `
=== EMAIL PREVIEW ===
Subject: ${subject}
Content: 
${htmlContent}
=== END PREVIEW ===
    `;
  }
}
