import axios from "axios";
import dotenv from "dotenv";
import logger from "./logger.js";

dotenv.config();

const HF_API_URL =
  "https://api-inference.huggingface.co/models/facebook/bart-large-mnli";
const HF_API_TOKEN = process.env.HUGGINGFACE_TOKEN;

// =======================
// // Function to call Hugging Face's zero-shot classification API
// =======================
const classifier = async (text, labels) => {
  const chunkSize = 10;
  const labelChunks = [];

  // Split labels into chunks
  for (let i = 0; i < labels.length; i += chunkSize) {
    labelChunks.push(labels.slice(i, i + chunkSize));
  }

  let bestLabel = null;
  let bestScore = -1;

  // Process each chunk of labels
  for (const chunk of labelChunks) {
    try {
      const response = await axios.post(
        HF_API_URL,
        {
          inputs: text,
          parameters: {
            candidate_labels: chunk,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${HF_API_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.labels && response.data.scores) {
        const topLabel = response.data.labels[0];
        const topScore = response.data.scores[0];

        if (topScore > bestScore) {
          bestLabel = topLabel;
          bestScore = topScore;
        }
      }
    } catch (error) {
      logger.error("Error calling Hugging Face API: " + error);
    }
  }

  return {
    labels: [bestLabel],
    scores: [bestScore],
  };
};

// =======================
// Main classification function
// =======================
export const classifyIntent = async (text) => {
  const labels = [
    "research_analysis",
    "message_processing",
    "upload_file",
    "file_retrieval",
    "organize_files",
    "finance_analysis",
    "send_email",
    "fetch_unread_emails",
    "summarize_emails",
    "search_emails",
    "meeting_scheduling",
    "fetch_upcoming_events",
    "market_research",
    "quick_answers",
    "report_generation",
    "progress_tracking",
    "health_reminders",
  ];

  const textClean = text.toLowerCase().trim();

  // Pattern-based classification rules
  const taskPatterns = {
    // Email operations
    send_email: [
      /(send|write|compose|draft|create|prepare) (an |a |)(email|message|note) (to|for) \w+/,
      /email (to|for) \w+ (about|regarding|concerning)/,
      /(send|shoot|fire off) (a |an |)email (to|for)/,
    ],
    fetch_unread_emails: [
      /(get|check|retrieve|show|fetch|read|display) (my |the |)(unread|new|latest|recent) (emails|messages|inbox)/,
      /(any|what|are there) (new|unread|recent) (emails|messages)/,
      /(what'?s|what is) (in|new in) my inbox/,
      /check (my |the |)inbox/,
    ],
    summarize_emails: [
      /(summarize|condense|digest|give me a summary of) (my |the |)(emails|messages|inbox)/,
      /(make|create|generate) (a |an |)(summary|overview|digest) of (my |the |)(emails|messages)/,
      /(what's|what is) important in my (emails|inbox|messages)/,
    ],
    search_emails: [
      /(find|search|locate|look for) (emails|messages|mail) (from|about|containing|related to|with|that mention)/,
      /(find|search for) \w+'s email/,
      /(where is|can you locate) (the |that |)(email|message) (about|from|regarding)/,
    ],

    // Calendar and meeting operations
    meeting_scheduling: [
      /(schedule|set up|arrange|book|plan|organize|create) (a |an |)(meeting|call|appointment|session|google meet)/,
      /(add|put|create) (a |an |)(event|meeting|appointment) (on|in|to) (my |the |)calendar/,
      /(book|schedule|reserve) (a |an |)(time|slot|session) (with|for)/,
    ],
    fetch_upcoming_events: [
      /(what|which|any|are there) (meetings|events|appointments|calls) (scheduled|coming up|planned)/,
      /(show|check|list|display|get) (my |the |)(upcoming|scheduled|planned|future) (meetings|events|appointments)/,
      /(what's|what is) (on|in) (my |the |)calendar/,
      /(what|anything) (do I have|planned) (today|tomorrow|this week)/,
    ],

    // File operations
    upload_file: [
      /(save|store|upload|backup|put) (this |the |a |an |)(file|document|spreadsheet|presentation)/,
      /(create|make|start) (a |an |)(new |blank |)(file|document|folder|directory)/,
    ],
    organize_files: [
      /(arrange|organize|sort|tidy up|rearrange|clean up) (my |this |the |all |these |a |an )?(files?|documents?|folders?|spreadsheets?|presentations?|images?|videos?)/,
    ],
    file_retrieval: [
      /(find|get|retrieve|locate|fetch|download|open) (my |the |a |an |)(file|document|spreadsheet|presentation|pdf)/,
      /(where is|can you locate) (my |the |)(file|document) (about|named|called|titled)/,
    ],

    // Analysis tasks
    research_analysis: [
      /(research|analyze|investigate|look into|explore) (the |)(topic|subject|issue|matter|question) of/,
      /(find|gather|collect) (information|data|details|facts) (about|on|regarding)/,
      /(what|tell me) (is|about|do you know) (the |)(history|background|context) of/,
    ],
    finance_analysis: [
      /(analyze|review|check|examine) (my |the |)(finances|budget|expenses|spending|financial|accounts)/,
      /(calculate|compute|figure out) (my |the |)(roi|return|profit|loss|margins|taxes)/,
      /(track|monitor|follow) (my |the |)(spending|expenses|budget|investments)/,
    ],
    market_research: [
      /(research|analyze|investigate) (the |)(market|industry|sector|competition)/,
      /(what's|what is) (trending|popular|hot) (in|on) (the |)(market|industry)/,
      /(gather|collect|find) (information|data|intel) (on|about) (the |)(market|competitors|industry)/,
    ],

    // Reporting and tracking
    report_generation: [
      /(generate|create|make|prepare|produce) (a |an |)(report|summary|overview|analysis)/,
      /(compile|put together) (the |a |an |)(data|information|numbers|metrics) (into|for) (a |an |)(report|summary)/,
      /(need|want) (a |an |)(report|summary|analysis) (on|of|about)/,
    ],
    progress_tracking: [
      /(track|monitor|follow|check) (my |the |our |)(progress|status|advancement|development)/,
      /(how|what) (am I|are we) (doing|progressing) (on|with)/,
      /(update|status) (on|of|for|about) (the |my |our |)(project|task|work|assignment)/,
    ],

    // Health and wellbeing
    health_reminders: [
      /(remind|alert|notify) me (to|about) (take|drink|exercise|meditate|stretch)/,
      /(set|create) (a |an |)(health|medication|hydration|exercise) reminder/,
      /(track|monitor|log) (my |)(health|fitness|weight|calories|steps|sleep)/,
    ],

    // Quick answers
    quick_answers: [
      /(what|who|when|where|why|how) (is|are|was|were|do|does|did|can|could|should)/,
      /(tell|explain|define) (me |us |)(what|who|when|where|why|how)/,
      /(quick|short|brief) (question|query): /,
    ],

    // Message processing
    message_processing: [
      /(process|analyze|extract) (this |the |a |an |)(message|text|content)/,
      /(what are|extract) (the |)(key points|main ideas) (from|in) (this |the |)(message|text)/,
    ],
  };

  // First pass: High-precision pattern matching
  for (const [task, patterns] of Object.entries(taskPatterns)) {
    for (const pattern of patterns) {
      if (pattern.test(textClean)) {
        return task;
      }
    }
  }

  // Second pass: NLP model classification
  const result = await classifier(textClean, labels);
  const bestLabel = result.labels[0];
  const confidenceScore = result.scores[0];
  const secondBestLabel = result.labels[1];
  const secondBestScore = result.scores[1];

  // Keyword frequency and contextual analysis for ambiguous cases
  if (confidenceScore < 0.65 || confidenceScore - secondBestScore < 0.2) {
    const taskKeywords = {
      send_email: {
        primary: [
          "send",
          "compose",
          "draft",
          "write",
          "email to",
          "message to",
        ],
        context: [
          "attach",
          "recipient",
          "subject line",
          "signature",
          "reply",
          "forward",
        ],
        negative: ["find", "search", "unread", "inbox", "check"],
      },
      fetch_unread_emails: {
        primary: [
          "check inbox",
          "check emails",
          "read latest",
          "unread emails",
          "get emails",
        ],
        context: [
          "inbox",
          "unopened",
          "recent",
          "new messages",
          "notifications",
        ],
        negative: ["send", "compose", "summary", "search for"],
      },
      file_retrieval: {
        primary: ["find", "get", "retrieve", "locate", "download", "open"],
        context: ["file", "document", "pdf", "spreadsheet", "presentation"],
        negative: ["send", "compose", "create"],
      },
      organize_files: {
        primary: ["organize", "arrange", "sort", "tidy up", "clean up"],
        context: ["files", "documents", "folders", "directory"],
        negative: ["find", "search", "retrieve"],
      },
      message_processing: {
        primary: ["process", "analyze", "extract", "key points", "main ideas"],
        context: ["message", "text", "content"],
        negative: ["send", "compose", "email"],
      },
      search_emails: {
        primary: ["find", "search", "locate", "look for"],
        context: ["emails", "messages", "from", "about"],
        negative: ["send", "compose", "draft"],
      },
    };

    // Calculate weighted keyword scores
    const taskScores = {};
    for (const [task, keywords] of Object.entries(taskKeywords)) {
      let score = 0;
      // Check primary keywords (high weight)
      for (const word of keywords.primary) {
        if (textClean.includes(word)) {
          score += 3;
        }
      }
      // Check contextual keywords (medium weight)
      for (const word of keywords.context) {
        if (textClean.includes(word)) {
          score += 1;
        }
      }
      // Check negative keywords (negative weight)
      for (const word of keywords.negative) {
        if (textClean.includes(word)) {
          score -= 2;
        }
      }
      taskScores[task] = score;
    }

    // Find highest keyword score
    const maxScoreTask = Object.entries(taskScores).reduce((a, b) =>
      a[1] > b[1] ? a : b
    );
    if (maxScoreTask[1] > 3) {
      // Threshold for keyword-based classification
      return maxScoreTask[0];
    }
  }

  // Third pass: Domain-specific context detection
  const emailIndicators = [
    "email",
    "message",
    "inbox",
    "unread",
    "mailbox",
    "sender",
    "recipient",
  ];
  const calendarIndicators = [
    "calendar",
    "schedule",
    "meeting",
    "appointment",
    "event",
    "reminder",
  ];
  const fileIndicators = [
    "file",
    "document",
    "folder",
    "pdf",
    "spreadsheet",
    "presentation",
  ];

  const emailContext = emailIndicators.filter((word) =>
    textClean.includes(word)
  ).length;
  const calendarContext = calendarIndicators.filter((word) =>
    textClean.includes(word)
  ).length;
  const fileContext = fileIndicators.filter((word) =>
    textClean.includes(word)
  ).length;

  // If strong domain signal exists and model confidence is low
  if (confidenceScore < 0.55) {
    if (emailContext > calendarContext && emailContext > fileContext) {
      return "fetch_unread_emails";
    } else if (
      calendarContext > emailContext &&
      calendarContext > fileContext
    ) {
      return "fetch_upcoming_events";
    } else if (fileContext > emailContext && fileContext > calendarContext) {
      return "file_retrieval";
    }
  }

  return bestLabel;
};

// tests
// async function testPrompts() {
//   const testCases = [
//     {
//       prompt: "Can you research the history of artificial intelligence?",
//       expected: "research_analysis",
//     },
//     {
//       prompt: "Please process this message and extract the key points.",
//       expected: "message_processing",
//     },
//     {
//       prompt: "I need to upload this document to the cloud.",
//       expected: "upload_file",
//     },
//     {
//       prompt: "Where is the quarterly report PDF I saved last week?",
//       expected: "file_retrieval",
//     },
//     {
//       prompt: "Can you organize all the files in the 'Projects' folder?",
//       expected: "organize_files",
//     },
//     {
//       prompt: "Analyze my monthly expenses and identify trends.",
//       expected: "finance_analysis",
//     },
//     {
//       prompt: "Draft an email to John about the meeting tomorrow.",
//       expected: "send_email",
//     },
//     {
//       prompt: "Show me all the unread emails in my inbox.",
//       expected: "fetch_unread_emails",
//     },
//     {
//       prompt: "Summarize the emails I received today.",
//       expected: "summarize_emails",
//     },
//     {
//       prompt: "Find all emails from Sarah about the project deadline.",
//       expected: "search_emails",
//     },
//     {
//       prompt: "Schedule a meeting with the team for next Monday at 10 AM.",
//       expected: "meeting_scheduling",
//     },
//     {
//       prompt: "What events are on my calendar for this week?",
//       expected: "fetch_upcoming_events",
//     },
//     {
//       prompt: "Research the latest trends in the tech industry.",
//       expected: "market_research",
//     },
//     { prompt: "What is the capital of France?", expected: "quick_answers" },
//     {
//       prompt: "Generate a report on last month's sales data.",
//       expected: "report_generation",
//     },
//     {
//       prompt: "Track the progress of the ongoing project.",
//       expected: "progress_tracking",
//     },
//     {
//       prompt: "Remind me to drink water every hour.", "Remind me to drink water at 3:00 PM
//       expected: "health_reminders",
//     },
//   ];

//   for (const testCase of testCases) {
//     const result = await classifyIntent(testCase.prompt);
//     logger.info(`Prompt: "${testCase.prompt}"`);
//     logger.info(`Expected: ${testCase.expected} + Got: ${result}`);
//     logger.info(result === testCase.expected ? "✅ Passed" : "❌ Failed");
//     logger.info("---");
//   }
// }

// testPrompts();
