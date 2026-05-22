// utils/emailTemplates.js

export const renderEmailOtpTemplate = (otp: string) => {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 440px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      
      <!-- Top Centered Highlighted Branding -->
      <div style="text-align: center; margin-bottom: 28px;">
        <h1 style="font-size: 26px; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -0.5px; text-transform: uppercase;">
          Indian Digital Nomads
        </h1>
        <div style="height: 3px; w-index: 100%; max-width: 60px; background-color: #2563eb; margin: 8px auto 0 auto; border-radius: 2px;"></div>
      </div>

      <!-- Main Body Content -->
      <div style="border-top: 1px solid #f1f5f9; padding-top: 20px;">
        <h2 style="font-size: 18px; font-weight: 600; color: #1e293b; margin-top: 0;">Confirm your email address</h2>
        <p style="color: #475569; font-size: 14px; line-height: 1.5; margin-bottom: 24px;">
          Thank you for joining our community. Use the verification code below to secure your account. This code is valid for <strong>60 minutes</strong>.
        </p>
        
        <!-- OTP Display Box -->
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; text-align: center; font-size: 28px; font-weight: 700; letter-spacing: 6px; color: #1e293b; margin: 24px 0; border-radius: 8px;">
          ${otp}
        </div>
        
        <p style="color: #94a3b8; font-size: 12px; line-height: 1.4; margin-top: 28px; text-align: center;">
          If you didn't request this code, you can safely ignore this email.
        </p>
      </div>

    </div>
  `;
};