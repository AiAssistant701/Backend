import { pipeline } from "@huggingface/transformers";
import os from "os";

// Cache the embedder to avoid reloading the model for each request
let embedderCache = null;

// Function to check available memory
const checkMemory = () => {
  const totalMem = Math.round(os.totalmem() / (1024 * 1024 * 1024));
  const freeMem = Math.round(os.freemem() / (1024 * 1024 * 1024));
  console.log(`Memory stats - Total: ${totalMem}GB, Free: ${freeMem}GB`);
  return { totalMem, freeMem };
};

export const embedText = async (text) => {
  try {
    // Log memory before loading model
    const memoryBefore = checkMemory();

    // Use cached embedder if available
    if (!embedderCache) {
      console.log("Initializing embedder model...");

      // Explicit configuration for the model loading using the correct dtype value
      embedderCache = await pipeline(
        "feature-extraction",
        "sentence-transformers/all-MiniLM-L6-v2",
        {
          // Use "fp32" instead of "float32" as per the error message
          dtype: "fp32",
          revision: "main",
          cache_dir: "./model-cache",
          progress_callback: (progress) => {
            if (progress.status) {
              console.log(`Model loading: ${progress.status}`);
            }
          },
        }
      );

      console.log("Embedder model loaded successfully");
    }

    // Check memory after loading
    const memoryAfter = checkMemory();
    console.log(
      `Memory used by model: ~${memoryBefore.freeMem - memoryAfter.freeMem}GB`
    );

    // Process the text with proper error handling
    const result = await embedderCache(text, {
      pooling: "mean",
      normalize: true,
      truncation: true,
      max_length: 512, // Limit text length to save memory
    });

    // Ensure we return the data in the expected format
    return Array.from(result.data);
  } catch (error) {
    console.error("Error in embedding text:", error);

    // Check if it's a dtype-related error
    if (error.message.includes("Invalid dtype")) {
      // Try again with a different dtype if that was the issue
      try {
        console.log("Retrying with 'auto' dtype...");
        if (!embedderCache) {
          embedderCache = await pipeline(
            "feature-extraction",
            "sentence-transformers/all-MiniLM-L6-v2",
            {
              dtype: "auto", // Try with auto instead
              revision: "main",
              cache_dir: "./model-cache",
            }
          );
        }

        const result = await embedderCache(text, {
          pooling: "mean",
          normalize: true,
          truncation: true,
          max_length: 512,
        });

        return Array.from(result.data);
      } catch (retryError) {
        console.error("Retry also failed:", retryError);
        return generateSimpleEmbedding(text);
      }
    }

    // For any other errors, use the fallback
    console.log("Using fallback embedding method due to error");
    return generateSimpleEmbedding(text);
  }
};

// Simple fallback embedding function that doesn't require ML models
const generateSimpleEmbedding = (text) => {
  console.log("Using simple embedding fallback");
  // Create a vector of 384 dimensions (matching all-MiniLM-L6-v2 output size)
  const embedding = new Array(384).fill(0);

  // Generate embedding from character codes (very basic approach)
  const words = text.toLowerCase().split(/\s+/);
  words.forEach((word, i) => {
    if (i < embedding.length) {
      let sum = 0;
      for (const char of word) {
        sum += char.charCodeAt(0);
      }
      embedding[i % embedding.length] = sum / 255; // Normalize to 0-1 range
    }
  });

  // Normalize the vector (L2 norm)
  const magnitude = Math.sqrt(
    embedding.reduce((sum, val) => sum + val * val, 0)
  );
  return embedding.map((val) => (magnitude > 0 ? val / magnitude : 0));
};
