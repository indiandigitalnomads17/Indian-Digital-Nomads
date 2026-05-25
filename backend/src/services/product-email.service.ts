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

interface EmailPayload {
  to: string;
  businessName: string;
  productTitle: string;
  productImage: string;
  action: "DELISTED" | "RELISTED";
  reason: string;
}

export const sendProductModerationEmail = async ({ to, businessName, productTitle, productImage, action, reason }: EmailPayload) => {
  try {
    const isDelisted = action === "DELISTED";
    const statusColor = isDelisted ? "#EF4444" : "#10B981"; // Red for delist, green for restore
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
        <title>Product Management Update</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F9FAFB; margin: 0; padding: 40px 20px;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 540px; background-color: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <!-- Header Banner -->
          <tr>
            <td style="background-color: ${statusColor}; padding: 32px; text-align: center;">
              <h1 style="color: #FFFFFF; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">
                Product ${isDelisted ? "Notice: Delisted" : "Update: Reactivated"}
              </h1>
            </td>
          </tr>
          
          <!-- Content Body -->
          <tr>
            <td style="padding: 40px 32px;">
              <p style="font-size: 16px; color: #111827; margin-top: 0; margin-bottom: 24px; line-height: 1.5;">
                Hello <strong>${businessName}</strong>,
              </p>
              <p style="font-size: 15px; color: #4B5563; margin-bottom: 32px; line-height: 1.6;">
                This automated system update is to notify you regarding an administrative decision made on <strong>${formattedDate}</strong> concerning your platform product marketplace listing.
              </p>

              <!-- Product Overview Card Horizontal Box Layout -->
              <table border="0" cellpadding="0" cellspacing="0" width="100__" style="background-color: #F3F4F6; border-radius: 8px; margin-bottom: 32px;">
                <tr>
                  <td style="padding: 16px; width: 80px; vertical-align: top;">
                    <img src="${productImage || "https://cdn.platform.com/default-placeholder.png"}" alt="${productTitle}" width="80" height="80" style="border-radius: 6px; object-cover: cover; display: block; border: 1px solid #D1D5DB;" />
                  </td>
                  <td style="padding: 16px 16px 16px 8px; vertical-align: middle;">
                    <span style="font-size: 12px; font-weight: 600; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px;">Product Listing</span>
                    <h3 style="font-size: 16px; color: #111827; margin: 4px 0 0 0; font-weight: 600;">${productTitle}</h3>
                  </td>
                </tr>
              </table>

              <!-- Action Notice Reason Field Box -->
              <h4 style="font-size: 13px; text-transform: uppercase; color: #374151; letter-spacing: 0.5px; margin-bottom: 8px; margin-top: 0;">
                Reason Given by Administration:
              </h4>
              <div style="background-color: #FFFBEB; border-left: 4px solid #F59E0B; padding: 16px; border-radius: 4px; font-size: 14px; color: #78350F; line-height: 1.6; margin-bottom: 32px;">
                "${reason}"
              </div>

              <hr style="border: 0; border-top: 1px solid #E5E7EB; margin-bottom: 32px;" />

              <p style="font-size: 13px; color: #6B7280; line-height: 1.5; margin: 0;">
                ${isDelisted 
                  ? "If you want to appeal this decision, resolve conflicts noted above, or open a review ticket, please reach out to our platform moderation desk." 
                  : "Your product status has been completely restored and is now fully searchable on the community catalog index."
                }
              </p>
            </td>
          </tr>
          
          <!-- Small Footer -->
          <tr>
            <td style="background-color: #F9FAFB; padding: 20px; text-align: center; border-top: 1px solid #E5E7EB; font-size: 12px; color: #9CA3AF;">
              &copy; 2026 Indian Digital Nomads Marketplace platform. All rights reserved.
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const subjectText = isDelisted 
      ? `⚠️ Action Required: Product Delisted - ${productTitle}` 
      : `✨ Marketplace Update: Product Reactivated - ${productTitle}`;

    await transporter.sendMail({
      from: `"Platform Moderation" <moderation@indiandigitalnomads.com>`,
      to,
      subject: subjectText,
      html: htmlContent,
    });

    console.log(`✉️ Moderation email dispatched successfully to ${to}`);
  } catch (error) {
    // Non-blocking catch-all log block ensures system continues even if mail servers decline
    console.error("❌ Secondary non-blocking operation warning: Mail server failed to deliver payload:", error);
  }
};