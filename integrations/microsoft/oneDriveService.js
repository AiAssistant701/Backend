import axios from "axios";

export const uploadFileToOneDrive = async (
  accessToken,
  fileName,
  fileContent
) => {
  try {
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
  } catch (error) {
    console.error("Error uploading file to OneDrive:", error.message);
    throw new Error("Failed to upload file to OneDrive.");
  }
};
