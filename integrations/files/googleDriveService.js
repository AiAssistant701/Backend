import fs from "fs";
import { google } from "googleapis";
import logger from "../../utils/logger.js";
import { getUserByGoogleID } from "../../usecases/users.js";
import { classifyFile } from "../../utils/fileClassifier.js";
import { extractFilenameFromQuery } from "../../utils/helpers.js";

// =======================
// Uploads a file to Google Drive
// =======================
export const uploadFileToGoogleDrive = async (googleId, filePath, fileName) => {
  try {
    const user = await getUserByGoogleID(googleId);
    if (!user || !user.tokens)
      throw new Error("No Google authentication found for user.");

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    oauth2Client.setCredentials(user.tokens);
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
  } catch (error) {
    logger.error("Error: " + error.message);
    throw new Error("Failed to upload file to Google Drive");
  }
};

// =======================
// Retrieves a list of files from Google Drive
// =======================
export const getGoogleDriveFiles = async (googleId, query = "") => {
  try {
    const user = await getUserByGoogleID(googleId);
    if (!user || !user.tokens)
      throw new Error("No Google authentication found for user.");

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    oauth2Client.setCredentials(user.tokens);

    const drive = google.drive({ version: "v3", auth: oauth2Client });

    const fetchAllFilesKeywords = [
      "all files",
      "list everything",
      "show all",
      "get all",
    ];
    const shouldFetchAllFiles =
      !query ||
      fetchAllFilesKeywords.some((keyword) =>
        query.toLowerCase().includes(keyword)
      );

    if (shouldFetchAllFiles) {
      const response = await drive.files.list({
        fields: "files(id, name, webViewLink)",
        spaces: "drive",
      });
      return response.data.files;
    }

    const fileName = extractFilenameFromQuery(query);
    if (!fileName) {
      const response = await drive.files.list({
        fields: "files(id, name, webViewLink)",
        spaces: "drive",
      });
      return response.data.files;
    }

    const response = await drive.files.list({
      q: `name contains '${fileName}'`,
      fields: "files(id, name, webViewLink)",
      spaces: "drive",
    });
    return response.data.files;
  } catch (error) {
    throw new Error(`Google Drive API Error: ${error.message}`);
  }
};

// =======================
// Finds or creates a folder in Google Drive
// =======================
export const getOrCreateFolder = async (googleId, folderName) => {
  try {
    const user = await getUserByGoogleID(googleId);
    if (!user || !user.tokens)
      throw new Error("No Google authentication found for user.");

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    oauth2Client.setCredentials(user.tokens);
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
  } catch (error) {
    throw new Error(`Google Drive API Error: ${error.message}`);
  }
};

// =======================
// Organizes all files in Google Drive into categorized folders.
// =======================
export const organizeFilesInDrive = async (googleId) => {
  try {
    const user = await getUserByGoogleID(googleId);
    if (!user || !user.tokens)
      throw new Error("No Google authentication found for user.");

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    oauth2Client.setCredentials(user.tokens);
    const drive = google.drive({ version: "v3", auth: oauth2Client });

    // Step 1: Retrieve all files in Google Drive (excluding folders)
    const response = await drive.files.list({
      q: "mimeType != 'application/vnd.google-apps.folder'", // Exclude folders
      fields: "files(id, name, parents)",
      spaces: "drive",
    });

    const files = response.data.files;

    if (files.length === 0) {
      return { message: "No files found in Google Drive." };
    }

    // Step 2: Classify and move each file
    let movedFiles = [];

    for (const file of files) {
      const category = classifyFile(file.name);
      const folderId = await getOrCreateFolder(googleId, category);

      // If file is already in the correct folder, skip moving it
      if (file.parents && file.parents.includes(folderId)) {
        continue;
      }

      // Step 3: Move file to the correct folder
      await drive.files.update({
        fileId: file.id,
        addParents: folderId,
        removeParents: file.parents ? file.parents.join(",") : "",
        fields: "id, name, parents",
      });

      movedFiles.push({ id: file.id, name: file.name, category });
    }

    return {
      message: "Files successfully organized in Google Drive.",
      movedFiles,
    };
  } catch (error) {
    throw new Error(`Google Drive API Error: ${error.message}`);
  }
};
