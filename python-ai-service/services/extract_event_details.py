import re
import dateparser
from datetime import datetime, timedelta

def extract_event_details(text):
    """Extracts event details from natural language input."""

    # Ensure dateparser prefers future dates
    parsed_date = dateparser.parse(
        text, 
        settings={"PREFER_DATES_FROM": "future", "RELATIVE_BASE": datetime.now()}
    )

    # Fallback: Manually detect weekday names if dateparser fails
    if not parsed_date:
        weekdays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
        for day in weekdays:
            if day in text.lower():
                today = datetime.today()
                days_ahead = (weekdays.index(day) - today.weekday()) % 7
                parsed_date = today + timedelta(days=days_ahead)
                break

    if not parsed_date:
        return {"error": "Could not detect a valid date or time."}

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
