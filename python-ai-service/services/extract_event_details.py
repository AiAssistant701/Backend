import re
import dateparser
from datetime import datetime, timedelta

def extract_event_details(text):
    """
    Extracts event details from natural language input with improved accuracy.
    
    Args:
        text (str): Natural language text describing an event
        
    Returns:
        dict: Structured event details including summary, description, startTime, and endTime
    """
    # Set a consistent timezone and current reference time
    local_tz = datetime.now().astimezone().tzinfo
    now = datetime.now(local_tz)
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    
    # ===== DATE EXTRACTION =====
    text_lower = text.lower()
    parsed_date = None
    
    # Special pattern handling for common date formats
    specific_date_patterns = [
        # Format: MM/DD or MM/DD/YYYY
        (r'(\d{1,2}/\d{1,2}(?:/\d{2,4})?)', lambda m: dateparser.parse(m.group(1))),
        # Format: Month Day (Jan 15, January 15)
        (r'(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?(?:\s*,?\s*\d{2,4})?', 
         lambda m: dateparser.parse(m.group(1))),
    ]
    
    for pattern, parser_func in specific_date_patterns:
        match = re.search(pattern, text_lower, re.IGNORECASE)
        if match:
            try:
                parsed_date = parser_func(match)
                if parsed_date:
                    break
            except:
                continue
    
    # Handle common relative date expressions
    if not parsed_date:
        relative_dates = {
            r'\b(?:today|tonight)\b': lambda: today,
            r'\btomorrow\b': lambda: today + timedelta(days=1),
            r'\bday after tomorrow\b': lambda: today + timedelta(days=2),
            r'\bnext (?:week|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b': 
                lambda: _handle_next_day(text_lower, today),
            r'\bin (\d+) days?\b': lambda m: today + timedelta(days=int(m.group(1))),
            r'\bin (\d+) weeks?\b': lambda m: today + timedelta(weeks=int(m.group(1))),
            r'\bin (\d+) months?\b': lambda m: today.replace(month=(today.month + int(m.group(1)) - 1) % 12 + 1, 
                                                year=today.year + (today.month + int(m.group(1)) - 1) // 12)
        }
        
        for pattern, handler in relative_dates.items():
            match = re.search(pattern, text_lower)
            if match:
                try:
                    parsed_date = handler() if callable(handler) else handler(match)
                    break
                except:
                    continue
    
    # Fallback to weekday detection if still no date
    if not parsed_date:
        weekdays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
        for idx, day in enumerate(weekdays):
            if day in text_lower:
                days_ahead = (idx - today.weekday()) % 7
                if days_ahead == 0:  # If today is the mentioned weekday
                    # Check if past current time - if so, assume next week
                    current_hour = now.hour
                    time_pattern = r'(\d{1,2})(?::(\d{2}))?\s*(am|pm)?'
                    time_match = re.search(time_pattern, text_lower, re.IGNORECASE)
                    
                    if time_match:
                        hr = int(time_match.group(1))
                        meridiem = time_match.group(3)
                        if meridiem and meridiem.lower() == 'pm' and hr < 12:
                            hr += 12
                        if hr <= current_hour:
                            days_ahead = 7
                    else:
                        # No specific time mentioned, assume next week
                        days_ahead = 7
                
                parsed_date = today + timedelta(days=days_ahead)
                break
    
    # Last resort - use dateparser's general capabilities
    if not parsed_date:
        parsed_date = dateparser.parse(text, settings={
            "PREFER_DATES_FROM": "future",
            "PREFER_DAY_OF_MONTH": "current",
            "RELATIVE_BASE": now
        })
    
    # If still no date, default to tomorrow
    if not parsed_date:
        parsed_date = today + timedelta(days=1)
    
    # Ensure we're working with a timezone-aware datetime
    if parsed_date.tzinfo is None:
        parsed_date = parsed_date.replace(tzinfo=local_tz)
    
    # ===== TIME EXTRACTION =====
    # Look for specific time patterns
    time_patterns = [
        # 12-hour format (3pm, 3:30pm)
        r'(\d{1,2})(?::(\d{2}))?\s*(am|pm)',
        # 24-hour format (15:00)
        r'(\d{2}):(\d{2})(?!\s*[ap]m)',
        # Words like "noon", "midnight"
        r'\b(noon|midnight)\b',
        # Time ranges (from X to Y)
        r'(?:from|between)?\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(?:to|until|till|-)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)'
    ]
    
    found_time = False
    for pattern in time_patterns:
        time_match = re.search(pattern, text_lower, re.IGNORECASE)
        if time_match:
            if "noon" in time_match.group(0):
                parsed_date = parsed_date.replace(hour=12, minute=0)
            elif "midnight" in time_match.group(0):
                parsed_date = parsed_date.replace(hour=0, minute=0)
            elif "to" in pattern or "until" in pattern or "till" in pattern or "-" in pattern:
                # Handle time ranges - extract start time
                hour = int(time_match.group(1))
                minute = int(time_match.group(2)) if time_match.group(2) else 0
                meridiem = time_match.group(3).lower() if time_match.group(3) else None
                
                if meridiem == 'pm' and hour < 12:
                    hour += 12
                elif meridiem == 'am' and hour == 12:
                    hour = 0
                    
                parsed_date = parsed_date.replace(hour=hour, minute=minute, second=0, microsecond=0)
            else:
                # Standard time format
                hour = int(time_match.group(1))
                minute = int(time_match.group(2)) if time_match.group(2) else 0
                meridiem = time_match.group(3).lower() if time_match.group(3) else None
                
                if meridiem == 'pm' and hour < 12:
                    hour += 12
                elif meridiem == 'am' and hour == 12:
                    hour = 0
                    
                parsed_date = parsed_date.replace(hour=hour, minute=minute, second=0, microsecond=0)
            
            found_time = True
            break
    
    # If no specific time found, check for time periods
    if not found_time:
        time_periods = {
            r'\b(?:in the )?morning\b': 9,
            r'\b(?:in the )?afternoon\b': 14,
            r'\b(?:in the )?evening\b': 18,
            r'\b(?:at )?night\b': 20
        }
        
        for pattern, hour in time_periods.items():
            if re.search(pattern, text_lower):
                parsed_date = parsed_date.replace(hour=hour, minute=0, second=0, microsecond=0)
                found_time = True
                break
    
    # Default to 9 AM if no time specified
    if not found_time:
        parsed_date = parsed_date.replace(hour=9, minute=0, second=0, microsecond=0)
    
    # ===== DURATION EXTRACTION =====
    # Advanced duration extraction
    duration_patterns = [
        # Specific duration (2 hours, 30 minutes)
        r'(?:for|lasting)?\s*(\d+)\s*(hour|hr|h|minute|min|m)s?',
        # Combined duration (1 hour and 30 minutes)
        r'(?:for|lasting)?\s*(\d+)\s*(hour|hr|h)s?\s*(?:and)?\s*(\d+)\s*(minute|min|m)s?',
        # All day event
        r'\b(?:all[- ]?day|full[- ]?day)\b'
    ]
    
    duration = timedelta(hours=1)  # Default duration
    
    for pattern in duration_patterns:
        duration_match = re.search(pattern, text_lower)
        if duration_match:
            if "all-day" in pattern or "full-day" in pattern or (duration_match and ("all-day" in duration_match.group(0) or "full-day" in duration_match.group(0))):
                # All-day event: set to end at 6 PM if starts in morning
                if parsed_date.hour < 12:
                    duration = timedelta(hours=9)  # 9 AM to 6 PM
                else:
                    duration = timedelta(hours=3)  # Whatever time to +3 hours
            elif "and" in pattern or (len(duration_match.groups()) >= 4):
                # Combined format: X hours and Y minutes
                hours = int(duration_match.group(1))
                minutes = int(duration_match.group(3))
                duration = timedelta(hours=hours, minutes=minutes)
            else:
                # Simple duration
                value = int(duration_match.group(1))
                unit = duration_match.group(2).lower()
                
                if unit.startswith(('m', 'min')):
                    duration = timedelta(minutes=value)
                else:
                    duration = timedelta(hours=value)
            break
    
    # ===== SUMMARY/TITLE EXTRACTION =====
    # First look for common event types
    event_type_patterns = [
        r'(meeting|call|appointment|interview|coffee|lunch|dinner|discussion|session|review|presentation|conference|webinar|workshop|class|lesson|training|demo|celebration)',
        r'(\w+)\s+(meeting|call|appointment|session)'
    ]
    
    event_type = None
    for pattern in event_type_patterns:
        event_match = re.search(pattern, text_lower)
        if event_match:
            event_type = event_match.group(1).strip()
            break
    
    # Look for participants or topics
    participant_pattern = r'(?:with|and)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)'
    topic_pattern = r'(?:about|regarding|on|to discuss|for)\s+([a-zA-Z0-9\s]+?)(?=\s+(?:on|at|tomorrow|next|in|by)|\s*$)'
    
    participant_match = re.search(participant_pattern, text)
    topic_match = re.search(topic_pattern, text, re.IGNORECASE)
    
    participants = participant_match.group(1) if participant_match else ""
    topic = topic_match.group(1) if topic_match else ""
    
    # Construct a meaningful summary
    if event_type and participants:
        summary = f"{event_type.title()} with {participants}"
    elif event_type and topic:
        summary = f"{event_type.title()} about {topic}"
    elif event_type:
        summary = f"{event_type.title()}"
    elif topic:
        summary = f"Meeting about {topic}"
    elif participants:
        summary = f"Meeting with {participants}"
    else:
        # Fallback to extracting nouns as potential summary
        nouns_pattern = r'\b([A-Z][a-z]*(?:\s+[a-z]+)*)\b'
        nouns = re.findall(nouns_pattern, text)
        if nouns and len(nouns[0]) > 3:  # Ensure it's meaningful
            summary = nouns[0]
        else:
            summary = "Scheduled Event"
    
    # ===== DESCRIPTION EXTRACTION =====
    description = ""
    desc_patterns = [
        r'(?:about|regarding|to discuss|to talk about)\s+(.+?)(?=\s+(?:on|at|tomorrow|next|in|by)|\s*$)',
        r'(?:notes?|description|details?):\s*(.+?)(?=\s+(?:on|at|tomorrow|next|in|by)|\s*$)'
    ]
    
    for pattern in desc_patterns:
        desc_match = re.search(pattern, text, re.IGNORECASE)
        if desc_match:
            description = desc_match.group(1).strip()
            break
    
    # Format and return response
    start_time = parsed_date.isoformat()
    end_time = (parsed_date + duration).isoformat()
    
    return {
        "summary": summary,
        "description": description,
        "startTime": start_time,
        "endTime": end_time,
    }

# Helper function for next day calculation
def _handle_next_day(text, today):
    weekdays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    
    for idx, day in enumerate(weekdays):
        if f"next {day}" in text:
            # "Next Monday" means the Monday after this week's Monday
            current_weekday = today.weekday()
            target_weekday = idx
            
            if target_weekday <= current_weekday:
                days_ahead = 7 + (target_weekday - current_weekday)
            else:
                days_ahead = target_weekday - current_weekday
            
            return today + timedelta(days=days_ahead)
    
    # Generic "next week" means 7 days from today
    if "next week" in text:
        return today + timedelta(days=7)
    
    return None