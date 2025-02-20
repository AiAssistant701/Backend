import re
import dateparser
from datetime import datetime, timedelta

def extract_event_details(text):
    """Extracts event details from natural language input."""

    # Manually detect relative dates
    text_lower = text.lower()
    today = datetime.today()

    if "tomorrow" in text_lower:
        parsed_date = today + timedelta(days=1)
    elif "next week" in text_lower:
        parsed_date = today + timedelta(weeks=1)
    else:
        parsed_date = dateparser.parse(text, settings={"PREFER_DATES_FROM": "future", "RELATIVE_BASE": today})

    # Fallback: Detect weekday names (Monday-Friday)
    if not parsed_date:
        weekdays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
        for day in weekdays:
            if day in text_lower:
                days_ahead = (weekdays.index(day) - today.weekday()) % 7
                parsed_date = today + timedelta(days=days_ahead)
                break

    if not parsed_date:
        return {"error": "Could not detect a valid date or time."}

    # Extract time (default to 9 AM if no time is given)
    time_match = re.search(r"(\d{1,2}(:\d{2})?\s?(AM|PM)?)", text, re.IGNORECASE)
    if time_match:
        parsed_time = dateparser.parse(time_match.group(1))
        parsed_date = parsed_date.replace(hour=parsed_time.hour, minute=parsed_time.minute)
    else:
        parsed_date = parsed_date.replace(hour=9, minute=0)  # Default 9 AM

    # Extract duration (default: 1 hour)
    duration_match = re.search(r"(\d+)\s?(hour|minute|hr|min|h|m)", text, re.IGNORECASE)
    duration = timedelta(hours=1)  # Default 1 hour

    if duration_match:
        duration_value = int(duration_match.group(1))
        duration_unit = duration_match.group(2).lower()
        if "min" in duration_unit or "m" == duration_unit:
            duration = timedelta(minutes=duration_value)
        elif "hour" in duration_unit or "hr" in duration_unit or "h" == duration_unit:
            duration = timedelta(hours=duration_value)

    # Extract event summary
    summary_match = re.search(r"(meeting|call|appointment|event|conference)\s?(with|about)?\s?([a-zA-Z\s]+)?", text, re.IGNORECASE)
    summary = summary_match.group(3).strip() if summary_match and summary_match.group(3) else "Untitled Event"

    # Extract event description
    description_match = re.search(r"for ([a-zA-Z\s]+)", text, re.IGNORECASE)
    description = description_match.group(1).strip() if description_match else ""

    # Format response
    start_time = parsed_date.isoformat() + "Z"
    end_time = (parsed_date + duration).isoformat() + "Z"

    return {
        "summary": summary,
        "description": description,
        "startTime": start_time,
        "endTime": end_time,
    }
