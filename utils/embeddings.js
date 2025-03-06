import { pipeline } from "@huggingface/transformers";

export const embedText = async (text) => {
  const embedder = await pipeline(
    "feature-extraction",
    "sentence-transformers/all-MiniLM-L6-v2"
  );
  const result = await embedder(text, { pooling: "mean", normalize: true });

  return Array.from(result.data);
};
