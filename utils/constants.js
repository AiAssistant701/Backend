export const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
export const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// task types
export const RESEARCH_ANALYSIS = "research_analysis";
export const MESSAGE_PROCESSING = "message_processing";
export const UPLOAD_FILE = "upload_file";
export const FILE_RETRIEVAL = "file_retrieval";
export const ORGANIZE_FILES = "organize_files";
export const FINANCE_ANALYSIS = "finance_analysis";
export const SEND_EMAIL = "send_email";
export const FETCH_UNREAD_EMAILS = "fetch_unread_emails";
export const SUMMARIZE_EMAILS = "summarize_emails";
export const SEARCH_EMAILS = "search_emails";
export const MEETING_SCHEDULING = "meeting_scheduling";
export const FETCH_UPCOMING_EVENTS = "fetch_upcoming_events";
export const MARKET_RESEARCH = "market_research";
export const QUICK_ANSWERS = "quick_answers";
export const REPORT_GENERATION = "report_generation";
export const PROGRESS_TRACKING = "progress_tracking";
export const HEALTH_REMINDERS = "health_reminders";

// models
export const OPENAI = "openai";
export const COHERE = "cohere";
export const HUGGINGFACE = "huggingface";
export const ANTHROPIC = "anthropic";
export const MISTRAL = "mistral";
export const GEMINI = "gemini";
export const GROK = "grok";
