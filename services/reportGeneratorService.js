import axios from "axios";

export const generateReport = async ({ data }) => {
  const response = await axios.post(`${process.env.PYTHON_API_URL}/generate-report`, {
    data,
  });

  console.log("report", response.data);

  return response.data.content;
};
