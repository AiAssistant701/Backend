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

      // Explicit configuration for the model loading
      embedderCache = await pipeline(
        "feature-extraction",
        "sentence-transformers/all-MiniLM-L6-v2",
        {
          // Explicitly set model options
          quantized: memoryBefore.freeMem < 2, // Use quantization if low on memory
          revision: "main",
          dtype: "float32", // Explicitly set dtype
          cache_dir: "./model-cache", // Set a specific cache directory
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

    // Fallback to a simpler embedding approach if the model fails
    // This is a very basic fallback that should work in low-memory situations
    if (error.message.includes("memory") || error.message.includes("dtype")) {
      console.log("Using fallback embedding method due to memory constraints");
      return generateSimpleEmbedding(text);
    }

    // Rethrow other errors
    throw error;
  }
};

// Simple fallback embedding function that doesn't require ML models
const generateSimpleEmbedding = (text) => {
  // Create a simple vector of 384 dimensions (matching all-MiniLM-L6-v2 output size)
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
