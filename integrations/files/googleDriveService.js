import fs from "fs";
import { google } from "googleapis";
import { getUserTokens } from "../../usecases/users.js";

// =======================
// Uploads a file to Google Drive
// =======================
export const uploadFileToGoogleDrive = async (googleId, filePath, fileName, folderId = "root") => {
  const tokens = await getUserTokens(googleId);
  if (!tokens) throw new Error("No Google authentication found for user.");

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials(tokens);

  const drive = google.drive({ version: "v3", auth: oauth2Client });

  const fileMetadata = {
    name: fileName,
    parents: [folderId], // Upload to a specific folder (default is root)
  };

  const media = {
    mimeType: "application/octet-stream",
    body: fs.createReadStream(filePath),
  };

  const response = await drive.files.create({
    resource: fileMetadata,
    media: media,
    fields: "id, name, webViewLink",
  });

  return response.data;
};

// =======================
// Retrieves a list of files from Google Drive
// =======================
export const getGoogleDriveFiles = async (googleId, query = "") => {
    const tokens = await getUserTokens(googleId);
    if (!tokens) throw new Error("No Google authentication found for user.");
  
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials(tokens);
  
    const drive = google.drive({ version: "v3", auth: oauth2Client });
  
    // Querying files
    const response = await drive.files.list({
      q: query ? `name contains '${query}'` : "",
      fields: "files(id, name, webViewLink)",
      spaces: "drive",
    });
  
    return response.data.files;
  };
