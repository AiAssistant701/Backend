import fs from "fs";
import { google } from "googleapis";
import { getUserTokens } from "../../usecases/users.js";
import { classifyFile } from "../../utils/fileClassifier.js";

// =======================
// Uploads a file to Google Drive
// =======================
export const uploadFileToGoogleDrive = async (googleId, filePath, fileName) => {
  const tokens = await getUserTokens(googleId);
  if (!tokens) throw new Error("No Google authentication found for user.");

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials(tokens);
  const drive = google.drive({ version: "v3", auth: oauth2Client });

  // Classify the file
  const category = classifyFile(fileName);
  const folderId = await getOrCreateFolder(googleId, category);

  const fileMetadata = {
    name: fileName,
    parents: [folderId],
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

  return { ...response.data, category };
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

// =======================
// Finds or creates a folder in Google Drive
// =======================
export const getOrCreateFolder = async (googleId, folderName) => {
  const tokens = await getUserTokens(googleId);
  if (!tokens) throw new Error("No Google authentication found for user.");

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials(tokens);
  const drive = google.drive({ version: "v3", auth: oauth2Client });

  // Check if folder already exists
  const folderQuery = `mimeType='application/vnd.google-apps.folder' and name='${folderName}'`;
  const response = await drive.files.list({
    q: folderQuery,
    fields: "files(id, name)",
  });

  if (response.data.files.length > 0) {
    return response.data.files[0].id;
  }

  // If folder doesn't exist, create it
  const folderMetadata = {
    name: folderName,
    mimeType: "application/vnd.google-apps.folder",
  };
  const folder = await drive.files.create({
    resource: folderMetadata,
    fields: "id",
  });

  return folder.data.id;
};
