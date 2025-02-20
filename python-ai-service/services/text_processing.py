import re
from transformers import pipeline

# Initialize AI Models
summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")
qa_pipeline = pipeline("question-answering", model="distilbert-base-cased-distilled-squad")

def summarize_text(text):
    """Summarizes text using Hugging Face BART model."""
    return summarizer(text, max_length=130, min_length=30, do_sample=False)[0]["summary_text"]


def classify_text(text):
    """
    Classifies user input into specific task categories with enhanced accuracy through
    a combination of NLP classification and rule-based pattern matching.
    
    Args:
        text (str): User's natural language prompt
        
    Returns:
        str: The classified task type label
    """
    labels = [
        "research_analysis",
        "message_processing",
        "file_management",
        "finance_analysis",
        "send_email",
        "fetch_unread_emails",
        "summarize_emails", 
        "search_emails", 
        "meeting_scheduling",
        "fetch_upcoming_events",
        "file_retrieval",
        "market_research",
        "quick_answers",
        "report_generation",
        "progress_tracking",
        "health_reminders",
    ]
    
    # Load classifier (assuming this is defined elsewhere)
    classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")
    
    # Clean and normalize input text
    text_clean = text.lower().strip()
    
    # Pattern-based classification rules (apply first for high-precision cases)
    task_patterns = {
        # Email operations with contextual patterns
        "send_email": [
            r"(send|write|compose|draft|create|prepare) (an |a |)(email|message|note) (to|for) \w+",
            r"email (to|for) \w+ (about|regarding|concerning)",
            r"(send|shoot|fire off) (a |an |)email (to|for)",
        ],
        "fetch_unread_emails": [
            r"(get|check|retrieve|show|fetch|read|display) (my |the |)(unread|new|latest|recent) (emails|messages|inbox)",
            r"(any|what|are there) (new|unread|recent) (emails|messages)",
            r"(what'?s|what is) (in|new in) my inbox",
            r"check (my |the |)inbox"
        ],
        "summarize_emails": [
            r"(summarize|condense|digest|give me a summary of) (my |the |)(emails|messages|inbox)",
            r"(make|create|generate) (a |an |)(summary|overview|digest) of (my |the |)(emails|messages)",
            r"(what's|what is) important in my (emails|inbox|messages)"
        ],
        "search_emails": [
            r"(find|search|locate|look for) (emails|messages|mail) (from|about|containing|related to|with|that mention)",
            r"(find|search for) \w+'s email",
            r"(where is|can you locate) (the |that |)(email|message) (about|from|regarding)"
        ],
        
        # Calendar and meeting operations
        "meeting_scheduling": [
            r"(schedule|set up|arrange|book|plan|organize) (a |an |)(meeting|call|appointment|session)",
            r"(add|put|create) (a |an |)(event|meeting|appointment) (on|in|to) (my |the |)calendar",
            r"(book|schedule|reserve) (a |an |)(time|slot|session) (with|for)"
        ],
        "fetch_upcoming_events": [
            r"(what|which|any|are there) (meetings|events|appointments|calls) (scheduled|coming up|planned)",
            r"(show|check|list|display|get) (my |the |)(upcoming|scheduled|planned|future) (meetings|events|appointments)",
            r"(what's|what is) (on|in) (my |the |)calendar",
            r"(what|anything) (do I have|planned) (today|tomorrow|this week)"
        ],
        
        # File operations
        "file_management": [
            r"(save|store|upload|backup|organize|put) (this |the |a |an |)(file|document|spreadsheet|presentation)",
            r"(create|make|start) (a |an |)(new |blank |)(file|document|folder|directory)"
        ],
        "file_retrieval": [
            r"(find|get|retrieve|locate|fetch|download|open) (my |the |a |an |)(file|document|spreadsheet|presentation|pdf)",
            r"(where is|can you locate) (my |the |)(file|document) (about|named|called|titled)"
        ],
        
        # Analysis tasks
        "research_analysis": [
            r"(research|analyze|investigate|look into|explore) (the |)(topic|subject|issue|matter|question) of",
            r"(find|gather|collect) (information|data|details|facts) (about|on|regarding)",
            r"(what|tell me) (is|about|do you know) (the |)(history|background|context) of"
        ],
        "finance_analysis": [
            r"(analyze|review|check|examine) (my |the |)(finances|budget|expenses|spending|financial|accounts)",
            r"(calculate|compute|figure out) (my |the |)(roi|return|profit|loss|margins|taxes)",
            r"(track|monitor|follow) (my |the |)(spending|expenses|budget|investments)"
        ],
        "market_research": [
            r"(research|analyze|investigate) (the |)(market|industry|sector|competition)",
            r"(what's|what is) (trending|popular|hot) (in|on) (the |)(market|industry)",
            r"(gather|collect|find) (information|data|intel) (on|about) (the |)(market|competitors|industry)"
        ],
        
        # Reporting and tracking
        "report_generation": [
            r"(generate|create|make|prepare|produce) (a |an |)(report|summary|overview|analysis)",
            r"(compile|put together) (the |a |an |)(data|information|numbers|metrics) (into|for) (a |an |)(report|summary)",
            r"(need|want) (a |an |)(report|summary|analysis) (on|of|about)"
        ],
        "progress_tracking": [
            r"(track|monitor|follow|check) (my |the |our |)(progress|status|advancement|development)",
            r"(how|what) (am I|are we) (doing|progressing) (on|with)",
            r"(update|status) (on|of|for|about) (the |my |our |)(project|task|work|assignment)"
        ],
        
        # Health and wellbeing
        "health_reminders": [
            r"(remind|alert|notify) me (to|about) (take|drink|exercise|meditate|stretch)",
            r"(set|create) (a |an |)(health|medication|hydration|exercise) reminder",
            r"(track|monitor|log) (my |)(health|fitness|weight|calories|steps|sleep)"
        ],
        
        # Quick answers
        "quick_answers": [
            r"(what|who|when|where|why|how) (is|are|was|were|do|does|did|can|could|should)",
            r"(tell|explain|define) (me |us |)(what|who|when|where|why|how)",
            r"(quick|short|brief) (question|query): "
        ]
    }
    
    # First pass: High-precision pattern matching
    for task, patterns in task_patterns.items():
        for pattern in patterns:
            if re.search(pattern, text_clean):
                return task
    
    # Second pass: NLP model classification
    result = classifier(text, labels)
    best_label = result["labels"][0]
    confidence_score = result["scores"][0]
    second_best_label = result["labels"][1]
    second_best_score = result["scores"][1]
    
    # Keyword frequency and contextual analysis for ambiguous cases
    if confidence_score < 0.65 or (confidence_score - second_best_score < 0.2):
        # Define contextual keyword sets with weights
        task_keywords = {
            "send_email": {
                "primary": ["send", "compose", "draft", "write", "email to", "message to"],
                "context": ["attach", "recipient", "subject line", "signature", "reply", "forward"],
                "negative": ["find", "search", "unread", "inbox", "check"]
            },
            "fetch_unread_emails": {
                "primary": ["check inbox", "check emails", "read latest", "unread emails", "get emails"],
                "context": ["inbox", "unopened", "recent", "new messages", "notifications"],
                "negative": ["send", "compose", "summary", "search for"]
            },
            "summarize_emails": {
                "primary": ["summarize", "summary of", "brief of", "condense", "digest"],
                "context": ["insights", "key points", "important messages", "highlight", "takeaway"],
                "negative": ["find specific", "search for", "reply", "send"]
            },
            "search_emails": {
                "primary": ["find email", "search email", "look up email", "locate message"],
                "context": ["from person", "about topic", "containing attachment", "dated", "with keyword"],
                "negative": ["send new", "compose", "draft", "unread"]
            },
            "meeting_scheduling": {
                "primary": ["schedule", "book", "set up meeting", "create appointment", "calendar"],
                "context": ["time slot", "availability", "duration", "participants", "zoom", "teams"],
                "negative": ["summary", "check", "find", "search for"]
            },
            "file_retrieval": {
                "primary": ["find file", "get document", "retrieve", "download", "access"],
                "context": ["document", "spreadsheet", "presentation", "folder", "storage"],
                "negative": ["create new", "write", "compose", "send"]
            }
        }
        
        # Calculate weighted keyword scores
        task_scores = {}
        for task, keywords in task_keywords.items():
            score = 0
            # Check primary keywords (high weight)
            for word in keywords["primary"]:
                if word in text_clean:
                    score += 3
            # Check contextual keywords (medium weight)
            for word in keywords["context"]:
                if word in text_clean:
                    score += 1
            # Check negative keywords (negative weight)
            for word in keywords["negative"]:
                if word in text_clean:
                    score -= 2
            
            task_scores[task] = score
        
        # Find highest keyword score
        max_score_task = max(task_scores.items(), key=lambda x: x[1])
        if max_score_task[1] > 3:  # Threshold for keyword-based classification
            return max_score_task[0]
    
    # Third pass: Domain-specific context detection
    email_indicators = ["email", "message", "inbox", "unread", "mailbox", "sender", "recipient"]
    calendar_indicators = ["calendar", "schedule", "meeting", "appointment", "event", "reminder"]
    file_indicators = ["file", "document", "folder", "pdf", "spreadsheet", "presentation"]
    
    # Check domain context to improve classification for ambiguous cases
    email_context = sum(1 for word in email_indicators if word in text_clean)
    calendar_context = sum(1 for word in calendar_indicators if word in text_clean)
    file_context = sum(1 for word in file_indicators if word in text_clean)
    
    # If strong domain signal exists and model confidence is low
    if confidence_score < 0.55:
        if email_context > calendar_context and email_context > file_context:
            # Default to fetch_unread_emails as safest email operation if ambiguous
            return "fetch_unread_emails"
        elif calendar_context > email_context and calendar_context > file_context:
            return "fetch_upcoming_events"
        elif file_context > email_context and file_context > calendar_context:
            return "file_retrieval"
    
    # Final fallback: Use model prediction
    return best_label




def answer_question(question, context):
    """Performs question answering based on provided context."""
    return qa_pipeline(question=question, context=context)["answer"]
