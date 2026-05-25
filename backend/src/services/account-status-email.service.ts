import nodemailer from "nodemailer";


const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, 
  auth: {
    user: 'indiandigitalnomads17@gmail.com',    
    pass: process.env.GMAIL_APP_PASSWORD,       
  },
  tls: {
    rejectUnauthorized: true
  }
});

interface AccountStatusEmailPayload {
  to: string;
  fullName: string;
  action: "SUSPENDED" | "DEACTIVATED" | "UNSUSPENDED" | "REACTIVATED";
  reason: string;
}

export const sendAccountStatusEmail = async ({ to, fullName, action, reason }: AccountStatusEmailPayload) => {
  try {
    const isNegativeAction = action === "SUSPENDED" || action === "DEACTIVATED";
    const statusColor = isNegativeAction ? "#EF4444" : "#10B981";
    
    let actionTitle = "Account Active";
    if (action === "SUSPENDED") actionTitle = "Account Temporarily Suspended";
    if (action === "DEACTIVATED") actionTitle = "Account Deactivated";
    if (action === "UNSUSPENDED") actionTitle = "Suspension Lifted / Active";
    if (action === "REACTIVATED") actionTitle = "Account Reactivated / Active";

    const formattedDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Account Management Notice</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F9FAFB; margin: 0; padding: 40px 20px;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 540px; background-color: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          
          <!-- Colored Status Banner Head -->
          <tr>
            <td style="background-color: ${statusColor}; padding: 32px; text-align: center;">
              <h1 style="color: #FFFFFF; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">
                ${actionTitle}
              </h1>
            </td>
          </tr>
          
          <!-- Content Block -->
          <tr>
            <td style="padding: 40px 32px;">
              <p style="font-size: 16px; color: #111827; margin-top: 0; margin-bottom: 24px; line-height: 1.5;">
                Hello <strong>${fullName}</strong>,
              </p>
              <p style="font-size: 15px; color: #4B5563; margin-bottom: 32px; line-height: 1.6;">
                This formal platform update is to notify you that an administrative change was executed on your profile account status on <strong>${formattedDate}</strong>.
              </p>

              <!-- Moderation Statement Reason Container Box -->
              <h4 style="font-size: 12px; text-transform: uppercase; color: #374151; letter-spacing: 0.5px; margin-bottom: 8px; margin-top: 0;">
                Official Decision Reason / Notes:
              </h4>
              <div style="background-color: ${isNegativeAction ? "#FFF5F5" : "#F0FDF4"}; border-left: 4px solid ${statusColor}; padding: 18px; border-radius: 6px; font-size: 14px; color: ${isNegativeAction ? "#991B1B" : "#166534"}; line-height: 1.6; margin-bottom: 32px;">
                "${reason}"
              </div>

              <hr style="border: 0; border-top: 1px solid #E5E7EB; margin-bottom: 32px;" />

              <p style="font-size: 13px; color: #6B7280; line-height: 1.5; margin: 0;">
                ${isNegativeAction 
                  ? "If you believe this administrative decision was made in error or would like to submit an official appeal request, please contact our platform support helpdesk team."
                  : "You can now log back into the system securely using your existing verified credentials. Welcome back to the marketplace!"
                }
              </p>
            </td>
          </tr>
          
          <!-- Micro Footer -->
          <tr>
            <td style="background-color: #F9FAFB; padding: 20px; text-align: center; border-top: 1px solid #E5E7EB; font-size: 12px; color: #9CA3AF;">
              &copy; 2026 Indian Digital Nomads Marketplace. All rights reserved.
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"Platform Administration" <admin@indiandigitalnomads.com>`,
      to,
      subject: `[Account Status Update] - ${actionTitle}`,
      html: htmlContent,
    });

    console.log(`✉️ Operational account change mail dispatched cleanly to ${to}`);
  } catch (error) {
    console.error("Secondary non-blocking operation warning: SMTP engine failed to deliver payload safely:", error);
  }
};