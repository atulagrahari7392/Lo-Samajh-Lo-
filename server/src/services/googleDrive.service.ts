import { google } from 'googleapis';
import { Readable } from 'stream';
import fs from 'fs';
import { prisma } from '../db';

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
  | 'STUDY_MATERIALS_OTHER'
  | 'VIDEOS'
  | 'LIVE_CLASSES'
  | 'TESTS'
  | 'TYPING'
  | 'IMAGES'
  | 'PDFS'
  | 'DOCUMENTS'
  | 'GENERAL';

class GoogleDriveService {
  private driveClient: any = null;
  private folderCache: Map<string, string> = new Map();
  private rootFolderId: string | null = null;
  private connectedEmail: string | null = null;

  constructor() {
    this.rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || null;
  }

  public resetClient() {
    this.driveClient = null;
    this.folderCache.clear();
  }

  public async isConfigured(): Promise<boolean> {
    const status = await this.getConnectionStatus();
    return status.connected;
  }

  public async getConnectionStatus(): Promise<{
    connected: boolean;
    storageProvider: string;
    authMethod: 'OAUTH2' | 'SERVICE_ACCOUNT' | 'NONE';
    connectedEmail?: string | null;
    rootFolderId?: string | null;
    rootFolderConfigured: boolean;
    hasClientCredentials: boolean;
  }> {
    const hasClientCredentials = Boolean(
      process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    );

    // 1. Check for OAuth refresh token in environment
    const envRefreshToken =
      process.env.GOOGLE_OAUTH_REFRESH_TOKEN || process.env.GOOGLE_REFRESH_TOKEN;

    if (hasClientCredentials && envRefreshToken) {
      return {
        connected: true,
        storageProvider: 'Google Drive (OAuth 2.0 - 5 TB Storage)',
        authMethod: 'OAUTH2',
        connectedEmail: this.connectedEmail || 'Environment Configured Account',
        rootFolderId: this.rootFolderId,
        rootFolderConfigured: Boolean(this.rootFolderId),
        hasClientCredentials: true,
      };
    }

    // 2. Check for OAuth refresh token saved in database
    try {
      const setting = await prisma.siteSetting.findUnique({
        where: { key: 'google_drive_oauth' },
      });
      if (setting && setting.value) {
        const parsed = JSON.parse(setting.value);
        if (parsed.refreshToken) {
          this.connectedEmail = parsed.connectedEmail || null;
          return {
            connected: true,
            storageProvider: 'Google Drive (OAuth 2.0 - 5 TB Storage)',
            authMethod: 'OAUTH2',
            connectedEmail: parsed.connectedEmail || 'Connected Google Account',
            rootFolderId: this.rootFolderId,
            rootFolderConfigured: Boolean(this.rootFolderId),
            hasClientCredentials,
          };
        }
      }
    } catch (e) {
      // Database query failed or table not ready
    }

    // 3. Fallback: Check for Service Account if explicitly present
    const hasServiceAccount = Boolean(
      (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) ||
      process.env.GOOGLE_SERVICE_ACCOUNT_KEY
    );

    if (hasServiceAccount) {
      return {
        connected: true,
        storageProvider: 'Google Drive (Service Account)',
        authMethod: 'SERVICE_ACCOUNT',
        connectedEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || 'Service Account',
        rootFolderId: this.rootFolderId,
        rootFolderConfigured: Boolean(this.rootFolderId),
        hasClientCredentials,
      };
    }

    return {
      connected: false,
      storageProvider: 'Local Storage',
      authMethod: 'NONE',
      connectedEmail: null,
      rootFolderId: null,
      rootFolderConfigured: false,
      hasClientCredentials,
    };
  }

  private async getClient() {
    if (this.driveClient) return this.driveClient;

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.CLIENT_URL || 'http://localhost:5000'}/api/google-drive/callback`;

    // 1. Primary: OAuth 2.0 User Account (User's 5 TB Google Drive)
    let refreshToken =
      process.env.GOOGLE_OAUTH_REFRESH_TOKEN || process.env.GOOGLE_REFRESH_TOKEN;

    if (!refreshToken && clientId && clientSecret) {
      try {
        const setting = await prisma.siteSetting.findUnique({
          where: { key: 'google_drive_oauth' },
        });
        if (setting && setting.value) {
          const parsed = JSON.parse(setting.value);
          refreshToken = parsed.refreshToken;
          this.connectedEmail = parsed.connectedEmail || null;
        }
      } catch (err: any) {
        console.warn('Could not read google_drive_oauth setting from DB:', err.message);
      }
    }

    if (clientId && clientSecret && refreshToken) {
      const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
      oauth2Client.setCredentials({ refresh_token: refreshToken });
      this.driveClient = google.drive({ version: 'v3', auth: oauth2Client });
      return this.driveClient;
    }

    // 2. Secondary Fallback: Service Account (only if OAuth is not configured)
    if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) {
      const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, '\n');
      const auth = new google.auth.JWT({
        email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/drive'],
      });
      this.driveClient = google.drive({ version: 'v3', auth });
      return this.driveClient;
    }

    return null;
  }

  public async testConnection(): Promise<{ connected: boolean; message: string; email?: string; rootFolderId?: string }> {
    const drive = await this.getClient();
    if (!drive) {
      return { connected: false, message: 'Google Drive OAuth is not connected. Please authorize via Admin Panel or environment variables.' };
    }

    try {
      // Test listing root folder or files
      const res = await drive.files.list({
        pageSize: 5,
        fields: 'files(id, name, mimeType)',
      });

      // Ensure root LoSamajhLo folder exists
      const rootId = await this.resolveCategoryFolder('GENERAL');

      const status = await this.getConnectionStatus();

      return {
        connected: true,
        message: `Successfully connected to Google Drive. Accessible files: ${res.data.files?.length || 0}`,
        email: status.connectedEmail || undefined,
        rootFolderId: rootId || undefined,
      };
    } catch (error: any) {
      console.error('Google Drive connection test error:', error.message);
      return { connected: false, message: `Google Drive connection failed: ${error.message}` };
    }
  }

  public async getOrCreateFolder(folderName: string, parentId?: string): Promise<string | null> {
    const drive = await this.getClient();
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
    const drive = await this.getClient();
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
      case 'STUDY_MATERIALS_EBOOKS':
      case 'STUDY_MATERIALS_OTHER': {
        const matRoot = await this.getOrCreateFolder('Study-Materials', rootId || undefined);
        if (category === 'STUDY_MATERIALS_NCERT') return this.getOrCreateFolder('NCERT', matRoot || undefined);
        if (category === 'STUDY_MATERIALS_CURRENT_AFFAIRS') return this.getOrCreateFolder('Current-Affairs', matRoot || undefined);
        if (category === 'STUDY_MATERIALS_EBOOKS') return this.getOrCreateFolder('E-Books', matRoot || undefined);
        if (category === 'STUDY_MATERIALS_OTHER') return this.getOrCreateFolder('Other', matRoot || undefined);
        return matRoot;
      }

      case 'VIDEOS':
        return this.getOrCreateFolder('Videos', rootId || undefined);

      case 'LIVE_CLASSES':
        return this.getOrCreateFolder('Live-Classes', rootId || undefined);

      case 'TESTS':
        return this.getOrCreateFolder('Test-Series', rootId || undefined);

      case 'TYPING':
        return this.getOrCreateFolder('Typing', rootId || undefined);

      case 'IMAGES':
        return this.getOrCreateFolder('Images', rootId || undefined);

      case 'PDFS':
        return this.getOrCreateFolder('PDFs', rootId || undefined);

      case 'DOCUMENTS':
        return this.getOrCreateFolder('Documents', rootId || undefined);

      default:
        return rootId;
    }
  }

  public async getDriveFolderForCategory(category: DriveFolderCategory): Promise<string | null> {
    return this.resolveCategoryFolder(category);
  }

  public async uploadFile(options: {
    streamOrBuffer: NodeJS.ReadableStream | Buffer | string;
    fileName: string;
    mimeType: string;
    category?: DriveFolderCategory;
    isPublic?: boolean;
  }): Promise<DriveUploadResult> {
    const drive = await this.getClient();
    if (!drive) {
      throw new Error('Google Drive service is not connected. Please authorize Google Drive in Admin Panel Settings.');
    }

    const category = options.category || 'GENERAL';
    const folderId = await this.resolveCategoryFolder(category);

    let body: any;
    if (Buffer.isBuffer(options.streamOrBuffer)) {
      body = Readable.from(options.streamOrBuffer);
    } else if (typeof options.streamOrBuffer === 'string') {
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
    const drive = await this.getClient();
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
    const drive = await this.getClient();
    if (!drive) throw new Error('Google Drive service is not connected.');

    const res = await drive.files.get(
      { fileId, alt: 'media', supportsAllDrives: true },
      { responseType: 'stream' }
    );
    return res.data;
  }

  public async streamVideo(
    fileId: string,
    rangeHeader?: string
  ): Promise<{
    stream: NodeJS.ReadableStream;
    status: number;
    headers: Record<string, string | number>;
  }> {
    const drive = await this.getClient();
    if (!drive) throw new Error('Google Drive service is not connected.');

    const requestHeaders: Record<string, string> = {};
    if (rangeHeader) {
      requestHeaders['Range'] = rangeHeader;
    }

    const response = await drive.files.get(
      {
        fileId,
        alt: 'media',
        supportsAllDrives: true,
      },
      {
        headers: requestHeaders,
        responseType: 'stream',
      }
    );

    const outHeaders: Record<string, string | number> = {
      'Content-Type': (response.headers['content-type'] as string) || 'video/mp4',
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
    };

    if (response.headers['content-range']) {
      outHeaders['Content-Range'] = response.headers['content-range'] as string;
    }
    if (response.headers['content-length']) {
      outHeaders['Content-Length'] = response.headers['content-length'] as string;
    }

    const status = response.status || (rangeHeader ? 206 : 200);

    return {
      stream: response.data as NodeJS.ReadableStream,
      status,
      headers: outHeaders,
    };
  }
}

export const googleDriveService = new GoogleDriveService();
