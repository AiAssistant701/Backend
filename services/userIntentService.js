import axios from "axios";

export const userIntent = async (text) => {
  const response = await axios.post("http://localhost:8000/classify", { text });

  return response.data.classification;
};
