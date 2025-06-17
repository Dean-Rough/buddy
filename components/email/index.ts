// Email template components
export { BaseEmailTemplate } from './BaseEmailTemplate';
export { WeeklySummaryTemplate } from './WeeklySummaryTemplate';
export { MonthlySummaryTemplate } from './MonthlySummaryTemplate';
export { IncidentSummaryTemplate } from './IncidentSummaryTemplate';

// Email utilities and renderer
export { EmailRenderer } from './EmailRenderer';
export type {
  EmailTemplateType,
  MonthlyEmailData,
  IncidentEmailData,
} from './EmailRenderer';

// Email management components
export { EmailPreview } from './EmailPreview';
export { EmailPreferences } from './EmailPreferences';

// Email template data types (re-exported from lib)
export type { EmailTemplateData } from '@/lib/email-summary/types';
