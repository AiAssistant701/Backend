import logger from "./logger.js";

// =======================
// Extracts event details from natural language input with improved accuracy.
// =======================
export const extractEventDetails = (text) => {
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  // ===== DATE EXTRACTION =====
  const textLower = text.toLowerCase();
  let parsedDate = null;

  const specificDatePatterns = [
    // Format: MM/DD or MM/DD/YYYY
    {
      pattern: /(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/,
      parser: (match) => new Date(match[1]),
    },
    // Format: Month Day (Jan 15, January 15)
    {
      pattern:
        /(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?(?:\s*,?\s*\d{2,4})?/i,
      parser: (match) => new Date(match[1]),
    },
  ];

  for (const { pattern, parser } of specificDatePatterns) {
    const match = textLower.match(pattern);
    if (match) {
      try {
        const possibleDate = parser(match);
        if (!isNaN(possibleDate.getTime())) {
          parsedDate = possibleDate;
          break;
        }
      } catch (e) {
        continue;
      }
    }
  }

  if (!parsedDate) {
    const relativeDates = [
      {
        pattern: /\b(?:today|tonight)\b/,
        handler: () => new Date(today),
      },
      {
        pattern: /\btomorrow\b/,
        handler: () => {
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          return tomorrow;
        },
      },
      {
        pattern: /\bday after tomorrow\b/,
        handler: () => {
          const dayAfterTomorrow = new Date(today);
          dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
          return dayAfterTomorrow;
        },
      },
      {
        pattern:
          /\bnext (?:week|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/,
        handler: () => handleNextDay(textLower, today),
      },
      {
        pattern: /\bin (\d+) days?\b/,
        handler: (match) => {
          const inDays = new Date(today);
          inDays.setDate(inDays.getDate() + parseInt(match[1]));
          return inDays;
        },
      },
      {
        pattern: /\bin (\d+) weeks?\b/,
        handler: (match) => {
          const inWeeks = new Date(today);
          inWeeks.setDate(inWeeks.getDate() + parseInt(match[1]) * 7);
          return inWeeks;
        },
      },
      {
        pattern: /\bin (\d+) months?\b/,
        handler: (match) => {
          const inMonths = new Date(today);
          inMonths.setMonth(inMonths.getMonth() + parseInt(match[1]));
          return inMonths;
        },
      },
    ];

    for (const { pattern, handler } of relativeDates) {
      const match = textLower.match(pattern);
      if (match) {
        try {
          parsedDate = handler(match);
          if (parsedDate) break;
        } catch (e) {
          continue;
        }
      }
    }
  }

  // Fallback to weekday detection if still no date
  if (!parsedDate) {
    const weekdays = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];
    for (let idx = 0; idx < weekdays.length; idx++) {
      const day = weekdays[idx];
      if (textLower.includes(day)) {
        const currentDay = today.getDay();
        const targetDay = idx + 1;

        // Calculate days ahead
        let daysAhead = (targetDay - currentDay) % 7;
        if (daysAhead <= 0) daysAhead += 7;

        // If today is the mentioned weekday
        if (daysAhead === 7) {
          // Check if past current time - if so, assume next week
          const currentHour = now.getHours();
          const timePattern = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i;
          const timeMatch = textLower.match(timePattern);

          if (timeMatch) {
            let hr = parseInt(timeMatch[1]);
            const meridiem = timeMatch[3];
            if (meridiem && meridiem.toLowerCase() === "pm" && hr < 12) {
              hr += 12;
            }
            if (hr <= currentHour) {
              daysAhead = 7;
            }
          } else {
            // No specific time mentioned, assume next week
            daysAhead = 7;
          }
        }

        parsedDate = new Date(today);
        parsedDate.setDate(parsedDate.getDate() + daysAhead);
        break;
      }
    }
  }

  // Last resort - try to parse the date from the text
  if (!parsedDate) {
    try {
      parsedDate = new Date(text);
    } catch (e) {
      // If still no date, default to tomorrow
      parsedDate = new Date(today);
      parsedDate.setDate(parsedDate.getDate() + 1);
    }
  }

  // If date parsing resulted in an invalid date, default to tomorrow
  if (!parsedDate || isNaN(parsedDate.getTime())) {
    parsedDate = new Date(today);
    parsedDate.setDate(parsedDate.getDate() + 1);
  }

  // ===== TIME EXTRACTION =====
  // Look for specific time patterns
  const timePatterns = [
    // 12-hour format (3pm, 3:30pm)
    /(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i,
    // 24-hour format (15:00)
    /(\d{2}):(\d{2})(?!\s*[ap]m)/i,
    // Words like "noon", "midnight"
    /\b(noon|midnight)\b/i,
    // Time ranges (from X to Y)
    /(?:from|between)?\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(?:to|until|till|-)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i,
  ];

  let foundTime = false;
  for (const pattern of timePatterns) {
    const timeMatch = textLower.match(pattern);
    if (timeMatch) {
      if (timeMatch[0].includes("noon")) {
        parsedDate.setHours(12, 0, 0, 0);
      } else if (timeMatch[0].includes("midnight")) {
        parsedDate.setHours(0, 0, 0, 0);
      } else if (pattern.source.includes("to|until|till|-")) {
        // Handle time ranges - extract start time
        let hour = parseInt(timeMatch[1]);
        const minute = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
        const meridiem = timeMatch[3] ? timeMatch[3].toLowerCase() : null;

        if (meridiem === "pm" && hour < 12) {
          hour += 12;
        } else if (meridiem === "am" && hour === 12) {
          hour = 0;
        }

        parsedDate.setHours(hour, minute, 0, 0);
      } else {
        // Standard time format
        let hour = parseInt(timeMatch[1]);
        const minute = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
        const meridiem = timeMatch[3] ? timeMatch[3].toLowerCase() : null;

        if (meridiem === "pm" && hour < 12) {
          hour += 12;
        } else if (meridiem === "am" && hour === 12) {
          hour = 0;
        }

        parsedDate.setHours(hour, minute, 0, 0);
      }

      foundTime = true;
      break;
    }
  }

  // If no specific time found, check for time periods
  if (!foundTime) {
    const timePeriods = [
      { pattern: /\b(?:in the )?morning\b/, hour: 9 },
      { pattern: /\b(?:in the )?afternoon\b/, hour: 14 },
      { pattern: /\b(?:in the )?evening\b/, hour: 18 },
      { pattern: /\b(?:at )?night\b/, hour: 20 },
    ];

    for (const { pattern, hour } of timePeriods) {
      if (pattern.test(textLower)) {
        parsedDate.setHours(hour, 0, 0, 0);
        foundTime = true;
        break;
      }
    }
  }

  // Default to 9 AM if no time specified
  if (!foundTime) {
    parsedDate.setHours(9, 0, 0, 0);
  }

  // ===== DURATION EXTRACTION =====
  // Advanced duration extraction
  const durationPatterns = [
    // Specific duration (2 hours, 30 minutes)
    /(?:for|lasting)?\s*(\d+)\s*(hour|hr|h|minute|min|m)s?/i,
    // Combined duration (1 hour and 30 minutes)
    /(?:for|lasting)?\s*(\d+)\s*(hour|hr|h)s?\s*(?:and)?\s*(\d+)\s*(minute|min|m)s?/i,
    // All day event
    /\b(?:all[- ]?day|full[- ]?day)\b/i,
  ];

  let durationHours = 1;
  let durationMinutes = 0;

  for (const pattern of durationPatterns) {
    const durationMatch = textLower.match(pattern);
    if (durationMatch) {
      if (
        pattern.source.includes("all[- ]?day|full[- ]?day") ||
        (durationMatch &&
          (durationMatch[0].includes("all-day") ||
            durationMatch[0].includes("full-day")))
      ) {
        // All-day event: set to end at 6 PM if starts in morning
        if (parsedDate.getHours() < 12) {
          durationHours = 9; // 9 AM to 6 PM
        } else {
          durationHours = 3; // Whatever time to +3 hours
        }
        durationMinutes = 0;
      } else if (pattern.source.includes("and") || durationMatch.length >= 5) {
        // Combined format: X hours and Y minutes
        durationHours = parseInt(durationMatch[1]);
        durationMinutes = parseInt(durationMatch[3]);
      } else {
        // Simple duration
        const value = parseInt(durationMatch[1]);
        const unit = durationMatch[2].toLowerCase();

        if (unit.startsWith("m") || unit.startsWith("min")) {
          durationHours = 0;
          durationMinutes = value;
        } else {
          durationHours = value;
          durationMinutes = 0;
        }
      }
      break;
    }
  }

  // ===== SUMMARY/TITLE EXTRACTION =====
  // First look for common event types
  const eventTypePatterns = [
    /(meeting|call|appointment|interview|coffee|lunch|dinner|discussion|session|review|presentation|conference|webinar|workshop|class|lesson|training|demo|celebration)/i,
    /(\w+)\s+(meeting|call|appointment|session)/i,
  ];

  let eventType = null;
  for (const pattern of eventTypePatterns) {
    const eventMatch = textLower.match(pattern);
    if (eventMatch) {
      eventType = eventMatch[1].trim();
      break;
    }
  }

  // Look for participants or topics
  const participantPattern = /(?:with|and)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/;
  const topicPattern =
    /(?:about|regarding|on|to discuss|for)\s+([a-zA-Z0-9\s]+?)(?=\s+(?:on|at|tomorrow|next|in|by)|\s*$)/i;

  const participantMatch = text.match(participantPattern);
  const topicMatch = text.match(topicPattern);

  const participants = participantMatch ? participantMatch[1] : "";
  const topic = topicMatch ? topicMatch[1] : "";

  // Construct a meaningful summary
  let summary;
  if (eventType && participants) {
    summary = `${capitalize(eventType)} with ${participants}`;
  } else if (eventType && topic) {
    summary = `${capitalize(eventType)} about ${topic}`;
  } else if (eventType) {
    summary = capitalize(eventType);
  } else if (topic) {
    summary = `Meeting about ${topic}`;
  } else if (participants) {
    summary = `Meeting with ${participants}`;
  } else {
    // Fallback to extracting nouns as potential summary
    const nounsPattern = /\b([A-Z][a-z]*(?:\s+[a-z]+)*)\b/;
    const nouns = text.match(nounsPattern);
    if (nouns && nouns[0].length > 3) {
      summary = nouns[0];
    } else {
      summary = "Scheduled Event";
    }
  }

  // ===== DESCRIPTION EXTRACTION =====
  let description = "";
  const descPatterns = [
    /(?:about|regarding|to discuss|to talk about)\s+(.+?)(?=\s+(?:on|at|tomorrow|next|in|by)|\s*$)/i,
    /(?:notes?|description|details?):\s*(.+?)(?=\s+(?:on|at|tomorrow|next|in|by)|\s*$)/i,
  ];

  for (const pattern of descPatterns) {
    const descMatch = text.match(pattern);
    if (descMatch) {
      description = descMatch[1].trim();
      break;
    }
  }

  // Create end time by adding duration to start time
  const endDate = new Date(parsedDate);
  endDate.setHours(
    endDate.getHours() + durationHours,
    endDate.getMinutes() + durationMinutes
  );

  // Format and return response
  return {
    summary: summary,
    description: description,
    startTime: parsedDate.toISOString(),
    endTime: endDate.toISOString(),
  };
};

// =======================
// Helper function for next day calculation
// =======================
function handleNextDay(text, today) {
  const weekdays = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  for (let idx = 0; idx < weekdays.length; idx++) {
    const day = weekdays[idx];
    if (text.includes(`next ${day}`)) {
      // "Next Monday" means the Monday after this week's Monday
      const currentWeekday = today.getDay();
      const targetWeekday = idx + 1;

      let daysAhead;
      if (targetWeekday <= currentWeekday) {
        daysAhead = 7 + (targetWeekday - currentWeekday);
      } else {
        daysAhead = targetWeekday - currentWeekday;
      }

      const nextDay = new Date(today);
      nextDay.setDate(nextDay.getDate() + daysAhead);
      return nextDay;
    }
  }

  // Generic "next week" means 7 days from today
  if (text.includes("next week")) {
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek;
  }

  return null;
}

// =======================
// Helper function to capitalize the first letter of a string
// =======================
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// const test1 = "Schedule a meeting tomorrow at 2pm";
// const result1 = extractEventDetails(test1);
// logger.info("Test 1: Basic meeting tomorrow");
// logger.info(result1);
