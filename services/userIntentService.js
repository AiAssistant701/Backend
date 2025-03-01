import axios from "axios";

export const userIntent = async (text) => {
  const response = await axios.post(`${process.env.PYTHON_AI_URL}/classify`, {
    text,
  });

  return response.data.classification;
};
