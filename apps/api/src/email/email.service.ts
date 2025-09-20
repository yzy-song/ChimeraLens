import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '@chimeralens/db';
import { Resend } from 'resend';
@Injectable()
export class EmailService {
  private readonly resend: Resend;
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) {
    this.resend = new Resend(configService.get<string>('RESEND_API_KEY'));
  }

  async sendPasswordResetEmail(email: string, token: string) {
    const resetLink = `${this.configService.get<string>('FRONTEND_URL')}/reset-password/${token}`;
    const subject = 'Password Reset Request';
    const html = `<p>Hello,</p>
      <p>Please click the link below to reset your password:</p>
      <p><a href="${resetLink}">${resetLink}</a></p>
      <p>This link will expire in 15 minutes.</p>`;
    await this.sendEmail(email, subject, html);
  }

  private async sendEmail(to: string, subject: string, html: string) {
    try {
      const from = this.configService.get<string>('EMAIL_FROM');
      if (!from) {
        throw new Error('EMAIL_FROM environment variable is not set');
      }
      await this.resend.emails.send({
        from,
        to,
        subject,
        html,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to send email to ${to}: ${errorMessage}`);
    }
  }

  async sendNewAccountInfoEmail(email: string, name: string, temporaryPassword: string) {
    const subject = 'Your New Account at ChimeraLens';
    const html = `
        <h3>Welcome, ${name}!</h3>
        <p>Thank you for registering with us. We look forward to serving you!</p>
        <p>An account has been created for you.</p>
        <p>You can log in using the following credentials:</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Temporary Password:</strong> ${temporaryPassword}</p>
        <p>We recommend you log in and change your password at your earliest convenience.</p>
      `;
    await this.sendEmail(email, subject, html);
  }
}
