import { google } from 'googleapis';
import { Readable } from 'stream';
import fs from 'fs';

export interface DriveUploadResult {
  fileId: string;
  fileName: string;
  mimeType: string;
  size: number;
  folderId?: string;
  webUrl?: string;
  downloadUrl?: string;
  thumbnailUrl?: string;
}

export type DriveFolderCategory =
  | 'COURSES'
  | 'STUDY_MATERIALS'
  | 'STUDY_MATERIALS_NCERT'
  | 'STUDY_MATERIALS_CURRENT_AFFAIRS'
  | 'STUDY_MATERIALS_EBOOKS'
  | 'VIDEOS'
  | 'LIVE_CLASSES'
  | 'TESTS'
  | 'UPLOADS_IMAGES'
  | 'UPLOADS_PDFS'
  | 'UPLOADS_DOCS'
  | 'GENERAL';

class GoogleDriveService {
  private driveClient: any = null;
  private folderCache: Map<string, string> = new Map();
  private rootFolderId: string | null = null;

  constructor() {
    this.rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || null;
  }

  public isConfigured(): boolean {
    const hasServiceAccount = Boolean(
      (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) ||
      process.env.GOOGLE_SERVICE_ACCOUNT_KEY
    );
    const hasOAuth = Boolean(
      process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REFRESH_TOKEN
    );
    return hasServiceAccount || hasOAuth;
  }

  private getClient() {
    if (this.driveClient) return this.driveClient;

    if (!this.isConfigured()) {
      return null;
    }

    const scopes = ['https://www.googleapis.com/auth/drive'];

    // 1. Service Account authentication (Preferred)
    if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      try {
        const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
        const auth = new google.auth.JWT({
          email: credentials.client_email,
          key: credentials.private_key,
          scopes,
        });
        this.driveClient = google.drive({ version: 'v3', auth });
        return this.driveClient;
      } catch (err: any) {
        console.error('Failed to parse GOOGLE_SERVICE_ACCOUNT_KEY JSON:', err.message);
      }
    }

    if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) {
      const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, '\n');
      const auth = new google.auth.JWT({
        email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: privateKey,
        scopes,
      });
      this.driveClient = google.drive({ version: 'v3', auth });
      return this.driveClient;
    }

    // 2. OAuth2 Refresh Token authentication
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REFRESH_TOKEN) {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI || 'https://developers.google.com/oauthplayground'
      );
      oauth2Client.setCredentials({
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
      });
      this.driveClient = google.drive({ version: 'v3', auth: oauth2Client });
      return this.driveClient;
    }

    return null;
  }

  public async testConnection(): Promise<{ connected: boolean; message: string }> {
    const drive = this.getClient();
    if (!drive) {
      return { connected: false, message: 'Google Drive credentials are not configured in environment.' };
    }

    try {
      const res = await drive.files.list({
        pageSize: 1,
        fields: 'files(id, name)',
      });
      return { connected: true, message: `Successfully connected to Google Drive. (${res.data.files?.length || 0} files accessible)` };
    } catch (error: any) {
      return { connected: false, message: `Google Drive connection failed: ${error.message}` };
    }
  }

  public async getOrCreateFolder(folderName: string, parentId?: string): Promise<string | null> {
    const drive = this.getClient();
    if (!drive) return null;

    const cacheKey = `${parentId || 'root'}_${folderName}`;
    if (this.folderCache.has(cacheKey)) {
      return this.folderCache.get(cacheKey)!;
    }

    try {
      const parentQuery = parentId ? `'${parentId}' in parents and ` : '';
      const query = `${parentQuery}name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;

      const searchRes = await drive.files.list({
        q: query,
        fields: 'files(id, name)',
        spaces: 'drive',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });

      if (searchRes.data.files && searchRes.data.files.length > 0) {
        const existingId = searchRes.data.files[0].id!;
        this.folderCache.set(cacheKey, existingId);
        return existingId;
      }

      // Create folder
      const fileMetadata: any = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
      };
      if (parentId) {
        fileMetadata.parents = [parentId];
      }

      const createRes = await drive.files.create({
        requestBody: fileMetadata,
        fields: 'id, name',
        supportsAllDrives: true,
      });

      const newId = createRes.data.id!;
      this.folderCache.set(cacheKey, newId);
      return newId;
    } catch (err: any) {
      console.error(`Error resolving folder '${folderName}':`, err.message);
      return null;
    }
  }

  public async resolveCategoryFolder(category: DriveFolderCategory): Promise<string | null> {
    const drive = this.getClient();
    if (!drive) return null;

    const rootId = this.rootFolderId
      ? this.rootFolderId
      : await this.getOrCreateFolder('LoSamajhLo');

    switch (category) {
      case 'COURSES':
        return this.getOrCreateFolder('Courses', rootId || undefined);
      case 'STUDY_MATERIALS':
      case 'STUDY_MATERIALS_NCERT':
      case 'STUDY_MATERIALS_CURRENT_AFFAIRS':
      case 'STUDY_MATERIALS_EBOOKS': {
        const matRoot = await this.getOrCreateFolder('Study-Materials', rootId || undefined);
        if (category === 'STUDY_MATERIALS_NCERT') return this.getOrCreateFolder('NCERT', matRoot || undefined);
        if (category === 'STUDY_MATERIALS_CURRENT_AFFAIRS') return this.getOrCreateFolder('Current-Affairs', matRoot || undefined);
        if (category === 'STUDY_MATERIALS_EBOOKS') return this.getOrCreateFolder('E-Books', matRoot || undefined);
        return matRoot;
      }
      case 'VIDEOS':
        return this.getOrCreateFolder('Videos', rootId || undefined);
      case 'LIVE_CLASSES':
        return this.getOrCreateFolder('Live-Classes', rootId || undefined);
      case 'TESTS':
        return this.getOrCreateFolder('Test-Series', rootId || undefined);
      case 'UPLOADS_IMAGES':
      case 'UPLOADS_PDFS':
      case 'UPLOADS_DOCS': {
        const uploadsRoot = await this.getOrCreateFolder('Uploads', rootId || undefined);
        if (category === 'UPLOADS_IMAGES') return this.getOrCreateFolder('Images', uploadsRoot || undefined);
        if (category === 'UPLOADS_PDFS') return this.getOrCreateFolder('PDFs', uploadsRoot || undefined);
        if (category === 'UPLOADS_DOCS') return this.getOrCreateFolder('Documents', uploadsRoot || undefined);
        return uploadsRoot;
      }
      default:
        return rootId;
    }
  }

  public async uploadFile(options: {
    streamOrBuffer: NodeJS.ReadableStream | Buffer | string;
    fileName: string;
    mimeType: string;
    category?: DriveFolderCategory;
    isPublic?: boolean;
  }): Promise<DriveUploadResult> {
    const drive = this.getClient();
    if (!drive) {
      throw new Error('Google Drive service is not configured. Configure credentials in environment.');
    }

    const category = options.category || 'GENERAL';
    const folderId = await this.resolveCategoryFolder(category);

    let body: any;
    if (Buffer.isBuffer(options.streamOrBuffer)) {
      body = Readable.from(options.streamOrBuffer);
    } else if (typeof options.streamOrBuffer === 'string') {
      // Path to file
      body = fs.createReadStream(options.streamOrBuffer);
    } else {
      body = options.streamOrBuffer;
    }

    const fileMetadata: any = {
      name: options.fileName,
      parents: folderId ? [folderId] : undefined,
    };

    const media = {
      mimeType: options.mimeType,
      body,
    };

    const res = await drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: 'id, name, mimeType, size, webViewLink, webContentLink, thumbnailLink',
      supportsAllDrives: true,
    });

    const file = res.data;

    // Set permissions: allow read if public
    if (options.isPublic !== false && file.id) {
      try {
        await drive.permissions.create({
          fileId: file.id,
          requestBody: {
            role: 'reader',
            type: 'anyone',
          },
          supportsAllDrives: true,
        });
      } catch (permErr: any) {
        console.warn(`Could not set public permission on Google Drive file ${file.id}:`, permErr.message);
      }
    }

    return {
      fileId: file.id!,
      fileName: file.name || options.fileName,
      mimeType: file.mimeType || options.mimeType,
      size: Number(file.size || 0),
      folderId: folderId || undefined,
      webUrl: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
      downloadUrl: file.webContentLink || `https://drive.google.com/uc?export=download&id=${file.id}`,
      thumbnailUrl: file.thumbnailLink || undefined,
    };
  }

  public async trashFile(fileId: string): Promise<boolean> {
    const drive = this.getClient();
    if (!drive) return false;

    try {
      await drive.files.update({
        fileId,
        requestBody: { trashed: true },
        supportsAllDrives: true,
      });
      return true;
    } catch (err: any) {
      console.error(`Failed to move file ${fileId} to Google Drive trash:`, err.message);
      return false;
    }
  }

  public async getFileStream(fileId: string): Promise<Readable> {
    const drive = this.getClient();
    if (!drive) throw new Error('Google Drive service is not configured.');

    const res = await drive.files.get(
      { fileId, alt: 'media', supportsAllDrives: true },
      { responseType: 'stream' }
    );
    return res.data;
  }
}

export const googleDriveService = new GoogleDriveService();
