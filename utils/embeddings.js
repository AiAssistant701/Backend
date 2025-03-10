import { HfInference } from "@huggingface/inference";

const hf = new HfInference(process.env.HUGGINGFACE_TOKEN);

export const embedText = async (text) => {
  const model = "sentence-transformers/all-MiniLM-L6-v2";
  const inputs = text;

  const result = await hf.featureExtraction({
    model,
    inputs,
  });

  return result;
};
