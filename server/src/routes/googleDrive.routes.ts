import { Router, Request, Response } from 'express';
import { google } from 'googleapis';
import { authenticate, requireAdmin } from '../middleware/auth';
import { googleDriveService } from '../services/googleDrive.service';
import { prisma } from '../db';

const router = Router();

// Helper to get OAuth2 Client
function getOAuth2Client(): any {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.CLIENT_URL || 'http://localhost:5000'}/api/google-drive/callback`;

  if (!clientId || !clientSecret) {
    return null;
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

// GET /api/google-drive/auth (Generate OAuth authorization URL)
router.get('/auth', authenticate, requireAdmin, (req: Request, res: Response) => {
  try {
    const oauth2Client = getOAuth2Client();
    if (!oauth2Client) {
      res.status(400).json({
        success: false,
        message: 'Google OAuth credentials (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET) are not configured in environment variables.',
      });
      return;
    }

    // Request drive scopes and user email scope
    const scopes = [
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ];

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent', // Force consent prompt to guarantee refresh_token is returned
      scope: scopes,
    });

    res.json({
      success: true,
      authUrl,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/google-drive/callback (Handle OAuth callback from Google)
router.get('/callback', async (req: Request, res: Response) => {
  const { code, error } = req.query;

  const clientBaseUrl = process.env.CLIENT_URL || '';
  const redirectTarget = `${clientBaseUrl}/admin/storage`;

  if (error) {
    console.error('Google OAuth callback error:', error);
    res.redirect(`${redirectTarget}?status=error&message=${encodeURIComponent(String(error))}`);
    return;
  }

  if (!code || typeof code !== 'string') {
    res.redirect(`${redirectTarget}?status=error&message=Authorization+code+missing`);
    return;
  }

  try {
    const oauth2Client = getOAuth2Client();
    if (!oauth2Client) {
      res.redirect(`${redirectTarget}?status=error&message=OAuth+client+not+configured`);
      return;
    }

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Fetch user email for display in Admin UI
    let userEmail = 'Authorized Google Account';
    try {
      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
      const userInfo = await oauth2.userinfo.get();
      if (userInfo.data.email) {
        userEmail = userInfo.data.email;
      }
    } catch (userErr: any) {
      console.warn('Could not fetch Google user info:', userErr.message);
    }

    // Securely persist refresh token & connected email in database
    const oauthData = {
      refreshToken: tokens.refresh_token,
      connectedEmail: userEmail,
      connectedAt: new Date().toISOString(),
      tokenType: tokens.token_type,
    };

    await prisma.siteSetting.upsert({
      where: { key: 'google_drive_oauth' },
      update: { value: JSON.stringify(oauthData) },
      create: { key: 'google_drive_oauth', value: JSON.stringify(oauthData) },
    });

    // Reset Google Drive client instance so it loads the new credentials
    googleDriveService.resetClient();

    // Verify & ensure root folder exists
    try {
      await googleDriveService.resolveCategoryFolder('GENERAL');
    } catch (initErr: any) {
      console.warn('Root folder initialization notice:', initErr.message);
    }

    res.redirect(`${redirectTarget}?status=success&email=${encodeURIComponent(userEmail)}`);
  } catch (exchangeErr: any) {
    console.error('Failed to exchange Google OAuth code:', exchangeErr.message);
    res.redirect(`${redirectTarget}?status=error&message=${encodeURIComponent(exchangeErr.message || 'Token exchange failed')}`);
  }
});

// GET /api/google-drive/status (Safe connection status for Admin Panel)
router.get('/status', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const status = await googleDriveService.getConnectionStatus();
    res.json({
      success: true,
      ...status,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/google-drive/test (Test live access to user's 5TB Google Drive)
router.post('/test', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const result = await googleDriveService.testConnection();
    res.json({
      success: result.connected,
      ...result,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, connected: false, message: error.message });
  }
});

// POST /api/google-drive/disconnect (Disconnect Google Drive)
router.post('/disconnect', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    await prisma.siteSetting.deleteMany({
      where: { key: 'google_drive_oauth' },
    });

    googleDriveService.resetClient();

    res.json({
      success: true,
      message: 'Google Drive account disconnected successfully.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
