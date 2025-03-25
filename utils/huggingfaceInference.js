import path from "path";
import fs from "fs/promises";
import logger from "./logger.js";
import { promisify } from "util";
import { exec } from "child_process";
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import { HfInference } from "@huggingface/inference";
import { insertTransactions } from "../usecases/transactions.js";

const execPromise = promisify(exec);
const hf = new HfInference(process.env.HUGGINGFACE_TOKEN);

// =======================
// to return an embedding
// =======================
export const embedText = async (text) => {
  const model = "sentence-transformers/all-MiniLM-L6-v2";
  const inputs = text;

  const result = await hf.featureExtraction({
    model,
    inputs,
  });

  return result;
};

// =======================
// Main function to analyze any statement file
// =======================
export const analyzeStatement = async (filePath, userId) => {
  try {
    const fileExtension = path.extname(filePath).toLowerCase();

    if (fileExtension === ".pdf") {
      return await analyzePdfStatement(filePath, userId);
    } else if (fileExtension === ".csv") {
      return await analyzeCsvStatement(filePath, userId);
    } else {
      throw new Error(
        `Unsupported file format: ${fileExtension}. Please upload a PDF or CSV file.`
      );
    }
  } catch (error) {
    logger.error("Error analyzing statement:", error);
    throw new Error("Failed to analyze statement: " + error.message);
  }
};

// =======================
// PDF-specific analyzer with multiple fallback methods
// =======================
export const analyzePdfStatement = async (filePath, userId) => {
  try {
    const buffer = await fs.readFile(filePath);

    let textContent = null;
    let parsingError = null;

    // Method 1: pdf-parse
    try {
      const pdfData = await pdfParse(buffer);
      textContent = pdfData.text;
      logger.info("Successfully parsed PDF with pdf-parse");
    } catch (error) {
      logger.error("Primary PDF parsing error:", error);
      parsingError = error;
    }

    // Method 2: Try fallback PDF extraction method if primary method failed
    if (!textContent) {
      try {
        textContent = await extractPdfTextWithPdfJs(buffer);
        logger.info("Successfully parsed PDF with pdf.js fallback");
      } catch (fallbackError) {
        logger.error("Fallback PDF.js parsing error:", fallbackError);
      }
    }

    // Method 3: Try external tool extraction if all JavaScript methods failed
    if (!textContent) {
      try {
        textContent = await extractPdfTextWithExternalTool(filePath);
        logger.info("Successfully parsed PDF with external tool");
      } catch (externalToolError) {
        logger.error("External tool parsing error:", externalToolError);
      }
    }

    // If all methods failed, throw an appropriate error
    if (!textContent) {
      logger.error("All PDF parsing methods failed for file:", filePath);
      throw new Error(
        "Unable to extract text from the PDF. The file may be corrupted, password-protected, or in an unsupported format. Please try a CSV export instead."
      );
    }

    logger.info(
      "Extracted text from PDF (sample):",
      textContent.substring(0, 200) + "..."
    );

    // Extract transactions from text
    const transactions = extractTransactionsFromText(textContent, userId);

    // If no transactions were found
    if (transactions.length === 0) {
      throw new Error(
        "No transactions could be identified in this statement. The format may not be supported."
      );
    }

    // Save transactions to database
    await insertTransactions(transactions);

    return transactions;
  } catch (error) {
    logger.error("Error analyzing PDF statement:", error);
    throw error;
  }
};

// =======================
// PDF.js fallback method
// =======================
const extractPdfTextWithPdfJs = async (buffer) => {
  // This is a placeholder - install pdfjs-dist package
  /*
  const pdfjsLib = await import('pdfjs-dist/build/pdf.js');
  const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.js');
  
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
  
  try {
    const loadingTask = pdfjsLib.getDocument({data: buffer});
    const pdf = await loadingTask.promise;
    
    let fullText = '';
    
    // Extract text from each page
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }
    
    return fullText;
  } catch (error) {
    logger.error("PDF.js extraction failed:", error);
    throw error;
  }
  */

  throw new Error("PDF.js extraction not implemented");
};

// =======================
// External tool fallback
// =======================
const extractPdfTextWithExternalTool = async (filePath) => {
  try {
    try {
      await execPromise("pdftotext -v");
    } catch (err) {
      throw new Error("External PDF tools not available");
    }

    // Create temp output file path
    const textFilePath = filePath + ".txt";

    // Execute pdftotext command
    await execPromise(`pdftotext -layout "${filePath}" "${textFilePath}"`);

    // Read the extracted text
    const textContent = await fs.readFile(textFilePath, "utf-8");

    // Clean up temp file
    try {
      await fs.unlink(textFilePath);
    } catch (unlinkError) {
      console.warn("Failed to delete temporary text file:", unlinkError);
    }

    return textContent;
  } catch (error) {
    logger.error("External tool extraction failed:", error);
    throw error;
  }
};

// =======================
// CSV-specific analyzer
// =======================
export const analyzeCsvStatement = async (filePath, userId) => {
  try {
    // Read the CSV file as text
    const csvContent = await fs.readFile(filePath, "utf-8");

    // Parse CSV content
    const transactions = parseCsvToTransactions(csvContent, userId);

    // Check if we found any transactions
    if (transactions.length === 0) {
      throw new Error(
        "No transactions could be identified in the CSV file. Please check the format."
      );
    }

    // Save transactions to database
    await insertTransactions(transactions);

    return transactions;
  } catch (error) {
    logger.error("Error analyzing CSV statement:", error);
    throw new Error("Failed to analyze CSV statement: " + error.message);
  }
};

// =======================
// Function to parse CSV content into transactions
// =======================
const parseCsvToTransactions = (csvContent, userId) => {
  // Split by lines and filter out empty lines
  const lines = csvContent.split("\n").filter((line) => line.trim().length > 0);

  if (lines.length <= 1) {
    throw new Error("CSV file appears to be empty or has only headers.");
  }

  // Extract header (first line)
  const header = lines[0].split(",").map((field) => field.trim().toLowerCase());

  // Find relevant column indices
  let dateIndex = header.findIndex(
    (field) => field.includes("date") || field.includes("time")
  );
  let descriptionIndex = header.findIndex(
    (field) =>
      field.includes("description") ||
      field.includes("merchant") ||
      field.includes("details") ||
      field.includes("transaction") ||
      field.includes("name") ||
      field.includes("payee")
  );
  let amountIndex = header.findIndex(
    (field) =>
      field.includes("amount") ||
      field.includes("sum") ||
      field.includes("value") ||
      field.includes("payment") ||
      field.includes("deposit") ||
      field.includes("withdrawal")
  );

  // If we can't find the columns automatically, try to guess based on content
  if (dateIndex === -1 || descriptionIndex === -1 || amountIndex === -1) {
    logger.info(
      "CSV columns not clearly identified, attempting to guess based on content..."
    );

    // Try to identify columns based on content in the first few rows
    const sampleRows = lines.slice(1, Math.min(5, lines.length));

    // Create sample fields for each row
    const samples = sampleRows.map((row) => parseCSVLine(row));

    if (samples.length > 0 && samples[0].length > 2) {
      // Check each column for patterns
      for (let i = 0; i < samples[0].length; i++) {
        const columnValues = samples.map((row) => row[i] || "");

        // Check if column has date patterns
        if (dateIndex === -1) {
          const hasDatePattern = columnValues.some(
            (value) =>
              /\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/.test(value) ||
              /\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}/.test(value)
          );

          if (hasDatePattern) {
            dateIndex = i;
            logger.info(`Guessed date column at index ${i}`);
          }
        }

        // Check if column has amount patterns (numbers with decimal points, possibly with currency symbols)
        if (amountIndex === -1) {
          const hasAmountPattern = columnValues.some(
            (value) =>
              /[-+]?\$?\s?\d+\.\d{2}/.test(value) ||
              /[-+]?\$?\s?\d{1,3}(,\d{3})*\.\d{2}/.test(value)
          );

          if (hasAmountPattern) {
            amountIndex = i;
            logger.info(`Guessed amount column at index ${i}`);
          }
        }
      }

      // If we found date and amount, guess description as the column with longest average text
      if (dateIndex !== -1 && amountIndex !== -1 && descriptionIndex === -1) {
        let maxAvgLength = 0;
        let likelyDescCol = -1;

        for (let i = 0; i < samples[0].length; i++) {
          if (i !== dateIndex && i !== amountIndex) {
            const avgLength =
              samples.reduce((sum, row) => sum + (row[i]?.length || 0), 0) /
              samples.length;

            if (avgLength > maxAvgLength) {
              maxAvgLength = avgLength;
              likelyDescCol = i;
            }
          }
        }

        if (likelyDescCol !== -1) {
          descriptionIndex = likelyDescCol;
          logger.info(`Guessed description column at index ${likelyDescCol}`);
        }
      }
    }
  }

  // Validate required columns exist
  if (dateIndex === -1 || amountIndex === -1) {
    throw new Error(
      "CSV format not recognized. Required columns (date, amount) not found."
    );
  }

  // If description still not found, use the first available column that's not date or amount
  if (descriptionIndex === -1) {
    for (let i = 0; i < header.length; i++) {
      if (i !== dateIndex && i !== amountIndex) {
        descriptionIndex = i;
        logger.info(`Using column ${i} for description as fallback`);
        break;
      }
    }

    // If we still don't have a description column, use a placeholder
    if (descriptionIndex === -1) {
      logger.info("No suitable description column found, using placeholder");
    }
  }

  const transactions = [];

  // Process each data row (skip header)
  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]);

    // Skip if line is too short
    if (fields.length <= Math.max(dateIndex, amountIndex)) {
      continue;
    }

    // Extract values from fields
    const dateStr = fields[dateIndex]?.trim() || "";
    const description =
      descriptionIndex !== -1 && fields[descriptionIndex]
        ? fields[descriptionIndex].trim()
        : "Transaction";
    let amountStr = fields[amountIndex]?.trim() || "";

    // Skip empty rows
    if (!dateStr || !amountStr) {
      continue;
    }

    // Process amount (remove currency symbols, handle negative values)
    amountStr = amountStr.replace(/[^\d.-]/g, "");
    const amount = parseFloat(amountStr);

    // Skip if amount is not a valid number
    if (isNaN(amount)) continue;

    // Parse date (try different formats)
    const parsedDate = parseDate(dateStr);

    // Skip if date is not valid
    if (!parsedDate) continue;

    // Create transaction object
    transactions.push({
      userId,
      date: parsedDate,
      description: description || "Transaction",
      category: "Uncategorized", // Will be categorized later
      amount: amount,
    });
  }

  return transactions;
};

// =======================
// Helper function to parse CSV line
// =======================
const parseCSVLine = (line) => {
  const fields = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      // Toggle quote state
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      // End of field
      fields.push(currentField);
      currentField = "";
    } else {
      // Add character to current field
      currentField += char;
    }
  }

  // Add the last field
  fields.push(currentField);

  return fields;
};

// =======================
// Helper function to parse date strings in various formats
// =======================
const parseDate = (dateStr) => {
  // Try parsing with built-in Date
  let date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date;
  }

  // Try common date formats
  const formats = [
    // MM/DD/YYYY
    {
      regex: /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
      fn: (m) => new Date(m[3], m[1] - 1, m[2]),
    },
    // DD/MM/YYYY
    {
      regex: /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
      fn: (m) => new Date(m[3], m[2] - 1, m[1]),
    },
    // YYYY-MM-DD
    {
      regex: /(\d{4})-(\d{1,2})-(\d{1,2})/,
      fn: (m) => new Date(m[1], m[2] - 1, m[3]),
    },
    // MM-DD-YYYY
    {
      regex: /(\d{1,2})-(\d{1,2})-(\d{4})/,
      fn: (m) => new Date(m[3], m[1] - 1, m[2]),
    },
    // DD-MM-YYYY
    {
      regex: /(\d{1,2})-(\d{1,2})-(\d{4})/,
      fn: (m) => new Date(m[3], m[2] - 1, m[1]),
    },
    // MM.DD.YYYY
    {
      regex: /(\d{1,2})\.(\d{1,2})\.(\d{4})/,
      fn: (m) => new Date(m[3], m[1] - 1, m[2]),
    },
    // DD.MM.YYYY
    {
      regex: /(\d{1,2})\.(\d{1,2})\.(\d{4})/,
      fn: (m) => new Date(m[3], m[2] - 1, m[1]),
    },
  ];

  for (const format of formats) {
    const match = dateStr.match(format.regex);
    if (match) {
      date = format.fn(match);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }

  // Try to extract date from text format (e.g., "Jan 15, 2023")
  const monthNames = [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
    "jan",
    "feb",
    "mar",
    "apr",
    "may",
    "jun",
    "jul",
    "aug",
    "sep",
    "oct",
    "nov",
    "dec",
  ];

  const monthTextRegex = new RegExp(
    `(${monthNames.join(
      "|"
    )})\\s+(\\d{1,2})(?:\\s*,?\\s*|[\\s,.-])\\s*(\\d{4})`,
    "i"
  );
  const textMatch = dateStr.match(monthTextRegex);

  if (textMatch) {
    const monthText = textMatch[1].toLowerCase();
    const day = parseInt(textMatch[2]);
    const year = parseInt(textMatch[3]);

    let monthIndex = monthNames.findIndex((m) => m === monthText);
    if (monthIndex >= 12) {
      // Adjust for abbreviated month names (they start at index 12 in our array)
      monthIndex = monthIndex - 12;
    }

    if (monthIndex !== -1 && day >= 1 && day <= 31 && year >= 1900) {
      date = new Date(year, monthIndex, day);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }

  // No valid date found
  return null;
};

// =======================
// Function to extract transaction info from text
// =======================
const extractTransactionsFromText = (text, userId) => {
  const lines = text.split("\n").filter((line) => line.trim().length > 0);
  const transactions = [];

  const datePatterns = [
    /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/, // MM/DD/YYYY or DD/MM/YYYY format
    /([A-Za-z]{3,9})\s+(\d{1,2})[,\s]+(\d{2,4})/, // Month DD, YYYY format
    /(\d{1,2})\s+([A-Za-z]{3,9})[,\s]+(\d{2,4})/, // DD Month YYYY format
  ];

  for (const line of lines) {
    // Skip header lines or lines that are too short
    if (line.length < 10) continue;

    // Try to detect date formats in the line
    let dateMatch = null;
    let dateStr = null;
    let parsedDate = null;

    // Try each date pattern
    for (const pattern of datePatterns) {
      dateMatch = line.match(pattern);
      if (dateMatch) {
        // Different parsing strategies based on the pattern
        if (pattern.toString().includes("[A-Za-z]{3,9}")) {
          // Handle text month format (e.g., "Jan 15, 2023" or "15 Jan 2023")
          const groups = dateMatch.slice(1);
          if (isNaN(parseInt(groups[0]))) {
            // First group is month name
            dateStr = `${groups[0]} ${groups[1]}, ${groups[2]}`;
          } else {
            // First group is day
            dateStr = `${groups[1]} ${groups[0]}, ${groups[2]}`;
          }
        } else {
          // Handle numeric date format (e.g., "01/15/2023")
          const [_, g1, g2, g3] = dateMatch;

          let month, day, year;

          if (parseInt(g1) <= 12) {
            month = g1;
            day = g2;
          } else {
            month = g2;
            day = g1;
          }

          year = g3.length === 2 ? `20${g3}` : g3;
          dateStr = `${month}/${day}/${year}`;
        }

        parsedDate = new Date(dateStr);

        // Check if date is valid
        if (parsedDate instanceof Date && !isNaN(parsedDate.getTime())) {
          // Valid date found, break out of the pattern loop
          break;
        }
      }
    }

    // No valid date found in this line, skip it
    if (!parsedDate || isNaN(parsedDate.getTime())) {
      continue;
    }

    // Look for amount pattern
    const amountMatch = line.match(
      /[-+]?\$?\s?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)|\$?\s?(\d+\.\d{2})/
    );

    if (amountMatch) {
      // Get the amount value, removing non-numeric characters except decimal point
      const amountStr = amountMatch[0].replace(/[^\d.-]/g, "");
      const amount = parseFloat(amountStr);

      // Skip if amount is not a valid number
      if (isNaN(amount)) continue;

      let description = line;

      if (dateMatch && amountMatch) {
        // Remove the date part
        description = description.replace(dateMatch[0], "");
        // Remove the amount part
        description = description.replace(amountMatch[0], "");
        // Clean up extra spaces
        description = description.replace(/\s+/g, " ").trim();
      }

      // If description is too long or empty, try to extract a meaningful part
      if (description.length > 100 || description.length === 0) {
        // Take middle part of the line if possible
        const middleStart = line.indexOf(dateMatch[0]) + dateMatch[0].length;
        const middleEnd = line.indexOf(amountMatch[0]);

        if (middleEnd > middleStart) {
          description = line.substring(middleStart, middleEnd).trim();
        } else {
          // Just use a generic description if we can't extract a good one
          description = "Transaction";
        }
      }

      // Create transaction object with valid date
      transactions.push({
        userId,
        date: parsedDate,
        description: description || "Transaction",
        category: "Uncategorized",
        amount: amount,
      });
    }
  }

  return transactions;
};

// =======================
// Function to categorize transaction
// =======================
export const categorizeTransactions = async (transactions) => {
  if (!transactions || transactions.length === 0) {
    return [];
  }

  try {
    const descriptions = transactions.map(
      (transaction) => transaction.description
    );

    const candidateLabels = [
      "Housing",
      "Utilities",
      "Transportation",
      "Food",
      "Dining",
      "Groceries",
      "Entertainment",
      "Shopping",
      "Health",
      "Insurance",
    ];

    const response = await hf.textClassification({
      model: "facebook/bart-large-mnli",
      inputs: descriptions,
      parameters: {
        candidate_labels: candidateLabels,
      },
    });

    // Log the response for debugging
    logger.info("Text classification response:", response);

    // Validate the response format
    if (
      !Array.isArray(response) ||
      !response[0]?.label ||
      !response[0]?.score
    ) {
      throw new Error("Invalid text classification response format");
    }

    // Map categories to transactions
    const categorizedTransactions = transactions.map((transaction, index) => ({
      ...transaction,
      category: response[index]?.label || "Uncategorized",
    }));

    return categorizedTransactions;
  } catch (error) {
    logger.error("Error categorizing transactions:", error);
    return transactions.map((t) => ({
      ...t,
      category: "Uncategorized",
    }));
  }
};
