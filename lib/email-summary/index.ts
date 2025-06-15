// Email Summary System - Main exports
export { WeeklySummaryGenerator } from './summary-generator';
export { WeeklyDataCollector } from './data-collector';
export { LLMAnalyzer } from './llm-analyzer';
export { EmailTemplateGenerator } from './email-template';
export { EmailService } from './email-service';

export type {
  WeeklyData,
  ConversationSummary,
  SafetyEventSummary,
  SummaryAnalysis,
  EmailTemplateData,
} from './types';
