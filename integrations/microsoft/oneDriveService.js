import axios from "axios";

export const uploadFileToOneDrive = async (
  accessToken,
  fileName,
  fileContent
) => {
  const response = await axios.put(
    `https://graph.microsoft.com/v1.0/me/drive/root:/${fileName}:/content`,
    fileContent,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/octet-stream",
      },
    }
  );
  return response.data;
};
