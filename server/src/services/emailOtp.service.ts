import crypto from 'crypto';
import { google } from 'googleapis';
import { prisma } from '../db';

export interface OtpResult {
  success: boolean;
  message: string;
  cooldownSeconds?: number;
  remainingAttempts?: number;
}

export interface VerifyResult {
  success: boolean;
  message: string;
  verificationToken?: string;
}

class EmailOtpService {
  private hashOtp(otp: string): string {
    return crypto.createHash('sha256').update(otp.trim()).digest('hex');
  }

  private generate6DigitOtp(): string {
    // Generate secure 6 digit number between 100000 and 999999
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Send email using Gmail API (Google OAuth messages.send flow)
   * Falls back to console log if Gmail credentials or scope not yet authorized
   */
  private async sendGmailMessage(toEmail: string, subject: string, htmlContent: string, plainText: string): Promise<boolean> {
    try {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      let refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN || process.env.GOOGLE_REFRESH_TOKEN;

      if (!refreshToken && clientId && clientSecret) {
        try {
          const setting = await prisma.siteSetting.findUnique({ where: { key: 'google_drive_oauth' } });
          if (setting && setting.value) {
            const parsed = JSON.parse(setting.value);
            refreshToken = parsed.refreshToken;
          }
        } catch (e) {
          // ignore
        }
      }

      if (clientId && clientSecret && refreshToken) {
        const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
        oauth2Client.setCredentials({ refresh_token: refreshToken });
        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

        const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
        const messageParts = [
          `To: ${toEmail}`,
          `Subject: ${utf8Subject}`,
          'MIME-Version: 1.0',
          'Content-Type: text/html; charset=utf-8',
          'Content-Transfer-Encoding: 7bit',
          '',
          htmlContent,
        ];
        const message = messageParts.join('\n');
        const encodedMessage = Buffer.from(message)
          .toString('base64')
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');

        await gmail.users.messages.send({
          userId: 'me',
          requestBody: { raw: encodedMessage },
        });

        console.log(`📧 [Gmail API] OTP sent successfully to ${toEmail}`);
        return true;
      }
    } catch (err: any) {
      console.warn('⚠️ [Gmail API] Notice sending email via OAuth (using dev fallback):', err.message);
    }

    // Dev / Fallback log
    console.log(`\n======================================================`);
    console.log(`📧 [GMAIL OTP DISPATCH]`);
    console.log(`To: ${toEmail}`);
    console.log(`Subject: ${subject}`);
    console.log(`Content: ${plainText}`);
    console.log(`======================================================\n`);
    return true;
  }

  /**
   * Request a 6-digit OTP for teacher email verification or forgot password
   */
  public async sendOtp(
    email: string,
    purpose: 'TEACHER_VERIFICATION' | 'FORGOT_PASSWORD' = 'TEACHER_VERIFICATION'
  ): Promise<OtpResult> {
    const cleanEmail = email.toLowerCase().trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, message: 'Please provide a valid email address.' };
    }

    // 1. Duplicate email detection
    if (purpose === 'TEACHER_VERIFICATION') {
      const existingUser = await prisma.user.findFirst({
        where: { email: cleanEmail },
      });

      if (existingUser) {
        const application = await prisma.teacherApplication.findUnique({
          where: { userId: existingUser.id },
        });

        if (application && application.status === 'APPROVED') {
          return {
            success: false,
            message: 'This email is already an approved teacher account. Please login directly.',
          };
        }
        if (application && application.status === 'PENDING_REVIEW') {
          return {
            success: false,
            message: 'An application with this email is already under review by administrator.',
          };
        }
        return {
          success: false,
          message: 'This email address is already registered on Lo Samajh Lo. Please use another email or login.',
        };
      }
    }

    if (purpose === 'FORGOT_PASSWORD') {
      const existingUser = await prisma.user.findFirst({
        where: { email: cleanEmail },
      });
      if (!existingUser) {
        return { success: false, message: 'No registered account found with this email address.' };
      }
    }

    // 2. Check existing OTP for cooldown & rate limiting
    const existingOtp = await prisma.emailOtp.findFirst({
      where: { email: cleanEmail, purpose },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();

    if (existingOtp) {
      const diffMs = now.getTime() - new Date(existingOtp.lastSentAt).getTime();
      const cooldownSec = 60;
      if (diffMs < cooldownSec * 1000) {
        const waitLeft = Math.ceil((cooldownSec * 1000 - diffMs) / 1000);
        return {
          success: false,
          message: `Please wait ${waitLeft} seconds before requesting a new OTP.`,
          cooldownSeconds: waitLeft,
        };
      }
    }

    // 3. Generate 6 digit OTP & hash it
    const otp = this.generate6DigitOtp();
    const otpHash = this.hashOtp(otp);
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes expiry

    // 4. Save hashed OTP to database (never plain text!)
    await prisma.emailOtp.deleteMany({
      where: { email: cleanEmail, purpose },
    });

    await prisma.emailOtp.create({
      data: {
        email: cleanEmail,
        otpHash,
        purpose,
        expiresAt,
        attempts: 0,
        maxAttempts: 5,
        isVerified: false,
        lastSentAt: now,
      },
    });

    // 5. Send Email via Gmail API
    const maskedEmail = cleanEmail.replace(/^(.)(.*)(@.*)$/, (_, first, middle, domain) => {
      return `${first}${'*'.repeat(Math.max(middle.length, 3))}${domain}`;
    });

    const title =
      purpose === 'TEACHER_VERIFICATION'
        ? 'Lo Samajh Lo — Teacher Email Verification OTP'
        : 'Lo Samajh Lo — Password Reset OTP';

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 540px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
        <div style="background: linear-gradient(135deg, #0B2A63 0%, #1D4ED8 100%); padding: 28px 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px;">Lo Samajh Lo</h1>
          <p style="color: #93c5fd; margin: 6px 0 0 0; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">India's Trusted Learning & Faculty Platform</p>
        </div>
        <div style="padding: 32px 28px;">
          <h2 style="color: #0f172a; margin: 0 0 12px 0; font-size: 18px; font-weight: 700;">${purpose === 'TEACHER_VERIFICATION' ? 'Faculty Application Verification' : 'Password Reset Request'}</h2>
          <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
            Use the 6-digit one-time password (OTP) below to verify your email address <strong>${maskedEmail}</strong>. This OTP is valid for <strong>10 minutes</strong>.
          </p>
          <div style="background: #f8fafc; border: 2px dashed #0B2A63; border-radius: 12px; padding: 18px; text-align: center; margin: 0 0 24px 0;">
            <span style="font-family: monospace; font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #0B2A63;">${otp}</span>
          </div>
          <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin: 0;">
            Security Notice: Never share this OTP with anyone. Lo Samajh Lo administrators will never ask for your verification codes or passwords.
          </p>
        </div>
        <div style="background: #f1f5f9; padding: 16px 28px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="color: #94a3b8; font-size: 11px; margin: 0;">&copy; 2026 Lo Samajh Lo LMS. All rights reserved.</p>
        </div>
      </div>
    `;

    const plainText = `Your Lo Samajh Lo verification code is: ${otp}. Valid for 10 minutes. Do not share this code.`;

    await this.sendGmailMessage(cleanEmail, title, htmlContent, plainText);

    return {
      success: true,
      message: `Verification code sent to ${maskedEmail}`,
      cooldownSeconds: 60,
    };
  }

  /**
   * Verify the 6-digit OTP entered by the teacher
   */
  public async verifyOtp(
    email: string,
    enteredOtp: string,
    purpose: 'TEACHER_VERIFICATION' | 'FORGOT_PASSWORD' = 'TEACHER_VERIFICATION'
  ): Promise<VerifyResult> {
    const cleanEmail = email.toLowerCase().trim();
    const cleanOtp = enteredOtp.trim();

    if (!cleanOtp || cleanOtp.length !== 6) {
      return { success: false, message: 'Please enter a valid 6-digit verification code.' };
    }

    const record = await prisma.emailOtp.findFirst({
      where: { email: cleanEmail, purpose },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      return { success: false, message: 'No active verification code found. Please request a new OTP.' };
    }

    // Check expiry
    const now = new Date();
    if (now > new Date(record.expiresAt)) {
      return { success: false, message: 'This OTP has expired. Please request a new one.' };
    }

    // Check max attempts
    if (record.attempts >= record.maxAttempts) {
      return {
        success: false,
        message: 'Maximum verification attempts exceeded. Please request a new code.',
      };
    }

    const candidateHash = this.hashOtp(cleanOtp);
    if (candidateHash !== record.otpHash) {
      const updatedAttempts = record.attempts + 1;
      await prisma.emailOtp.update({
        where: { id: record.id },
        data: { attempts: updatedAttempts },
      });
      const attemptsRemaining = Math.max(0, record.maxAttempts - updatedAttempts);
      return {
        success: false,
        message: `Incorrect OTP. ${attemptsRemaining} attempt(s) remaining.`,
      };
    }

    // Mark verified
    await prisma.emailOtp.update({
      where: { id: record.id },
      data: { isVerified: true },
    });

    // Generate verified token
    const verificationToken = crypto
      .createHmac('sha256', process.env.JWT_SECRET || 'lsl_otp_secret_key')
      .update(`${cleanEmail}:${purpose}:${record.id}`)
      .digest('hex');

    return {
      success: true,
      message: 'Email verified successfully!',
      verificationToken,
    };
  }

  /**
   * Confirm that an email has been verified via OTP within the last 30 minutes
   */
  public async checkEmailVerified(
    email: string,
    purpose: 'TEACHER_VERIFICATION' | 'FORGOT_PASSWORD' = 'TEACHER_VERIFICATION'
  ): Promise<boolean> {
    const cleanEmail = email.toLowerCase().trim();
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);

    const verified = await prisma.emailOtp.findFirst({
      where: {
        email: cleanEmail,
        purpose,
        isVerified: true,
        createdAt: { gte: thirtyMinsAgo },
      },
    });

    return Boolean(verified);
  }
}

export const emailOtpService = new EmailOtpService();
