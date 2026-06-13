import nodemailer from 'nodemailer';

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    // Return a test/ethereal transporter for local dev without SMTP credentials
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

const transporter = createTransporter();

const CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'hello@adamworkcraft.com';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const BRAND_NAME = 'Adam Workcraft';

export interface SendReviewEmailOptions {
  to: string;
  clientName: string;
  service: string;
  reviewCode: string;
}

export async function sendReviewInviteEmail(options: SendReviewEmailOptions): Promise<{ success: boolean; message: string }> {
  const { to, clientName, service, reviewCode } = options;
  const reviewLink = `${SITE_URL}/submit-review?code=${encodeURIComponent(reviewCode)}`;

  if (!transporter) {
    // Dev mode: log to console instead of sending
    console.log('[MAILER DEV] Would send review invite email:');
    console.log(`  To: ${to}`);
    console.log(`  Name: ${clientName}`);
    console.log(`  Code: ${reviewCode}`);
    console.log(`  Link: ${reviewLink}`);
    return { success: true, message: 'Email simulated (SMTP not configured)' };
  }

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Share Your Experience</title>
</head>
<body style="margin:0;padding:0;background:#0c0a09;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0c0a09;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#1c1917;border:1px solid #292524;border-radius:16px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 24px;border-bottom:1px solid #292524;">
              <p style="margin:0;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;color:#d97706;font-weight:600;">${BRAND_NAME}</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;">
              <h1 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#f5f5f4;letter-spacing:-0.02em;">
                We'd love your feedback
              </h1>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#a8a29e;">
                Hi ${clientName},<br/><br/>
                Thank you for choosing ${BRAND_NAME} for your <strong style="color:#f5f5f4;">${service}</strong>. 
                We hope we exceeded your expectations and created something truly memorable together.
              </p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#a8a29e;">
                If you have a moment, we'd be deeply grateful if you shared your experience. 
                Your review helps others find us and means the world to our small team.
              </p>
              <!-- Code block -->
              <div style="background:#0c0a09;border:1px solid #292524;border-radius:12px;padding:20px;text-align:center;margin:0 0 28px;">
                <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#57534e;">Your unique review code</p>
                <p style="margin:0;font-size:28px;font-weight:800;letter-spacing:0.25em;color:#fbbf24;font-family:monospace;">${reviewCode}</p>
              </div>
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${reviewLink}" style="display:inline-block;background:#f5f5f4;color:#0c0a09;font-size:14px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:100px;letter-spacing:0.02em;">
                      Share Your Experience &rarr;
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;font-size:12px;color:#57534e;text-align:center;">
                Or copy this link: <a href="${reviewLink}" style="color:#a8a29e;">${reviewLink}</a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #292524;">
              <p style="margin:0;font-size:11px;color:#57534e;">
                You received this because you recently worked with ${BRAND_NAME}. 
                If this was a mistake, you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    await transporter.sendMail({
      from: `"${BRAND_NAME}" <${CONTACT_EMAIL}>`,
      to,
      subject: `Share your experience with ${BRAND_NAME}`,
      html,
    });
    return { success: true, message: 'Email sent successfully' };
  } catch (err) {
    console.error('[MAILER] Failed to send email:', err);
    return { success: false, message: 'Failed to send email' };
  }
}
