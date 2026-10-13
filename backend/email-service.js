import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Creates and returns the Nodemailer transporter using Brevo / configured SMTP
 */
function createTransporter() {
    dotenv.config();
    const user = process.env.SMTP_USER;
    const rawPass = process.env.SMTP_PASS;

    if (!user || !rawPass) {
        console.warn('[Netrave Email] Warning: SMTP_USER or SMTP_PASS is missing in .env. Real email delivery will be paused until configured.');
        return null;
    }

    // Strip whitespace from passwords (such as Google App Passwords "xxxx yyyy zzzz wwww")
    const pass = rawPass.trim().replace(/\s+/g, '');
    const host = process.env.SMTP_HOST || (user.includes('@gmail.com') ? 'smtp.gmail.com' : 'smtp-relay.brevo.com');
    const port = parseInt(process.env.SMTP_PORT, 10) || (host.includes('gmail') ? 465 : 587);

    if (host.includes('gmail') || user.includes('@gmail.com')) {
        return nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user,
                pass
            }
        });
    }

    return nodemailer.createTransport({
        host,
        port,
        secure: port === 465, // true for 465, false for 587
        auth: {
            user,
            pass
        },
        tls: {
            rejectUnauthorized: false
        }
    });
}

/**
 * Generates the Netrave luxury-branded HTML email template for OTP
 */
function getOtpEmailHtml(name, otp, purpose) {
    const isRegister = purpose === 'registration';
    const title = isRegister ? 'Verify Your Netrave Account' : 'Reset Your Netrave Password';
    const subtitle = isRegister 
        ? 'Welcome to Netrave Clothing & Style. Please use the verification code below to activate your account.' 
        : 'We received a request to reset your password. Use the verification code below to proceed.';
    const actionLabel = isRegister ? 'Account Registration Code' : 'Password Reset Code';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #05070a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #05070a; padding: 40px 15px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" style="max-width: 540px; background: linear-gradient(145deg, #0d111a, #090c14); border: 1px solid rgba(245, 158, 11, 0.25); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.8);">
                    <!-- Brand Header Banner -->
                    <tr>
                        <td style="padding: 36px 30px 24px; text-align: center; border-bottom: 1px solid rgba(255, 255, 255, 0.08);">
                            <div style="display: inline-block; text-align: center;">
                                <div style="font-size: 28px; font-weight: 900; letter-spacing: -0.5px; text-transform: uppercase;">
                                    <span style="color: #f59e0b;">Ne</span><span style="color: #ffffff;">trave</span>
                                </div>
                                <div style="font-size: 10px; font-weight: 700; color: #94a3b8; letter-spacing: 4px; margin-top: 4px; text-transform: uppercase;">
                                    CLOTHING &amp; STYLE
                                </div>
                            </div>
                        </td>
                    </tr>

                    <!-- Email Body -->
                    <tr>
                        <td style="padding: 36px 32px 28px;">
                            <h1 style="margin: 0 0 12px; font-size: 22px; font-weight: 800; color: #ffffff; text-align: center;">
                                ${title}
                            </h1>
                            <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #94a3b8; text-align: center;">
                                Hi ${name ? name : 'there'}, ${subtitle}
                            </p>

                            <!-- OTP Box -->
                            <div style="background: rgba(245, 158, 11, 0.06); border: 1.5px dashed rgba(245, 158, 11, 0.4); border-radius: 12px; padding: 24px; text-align: center; margin: 28px 0;">
                                <div style="font-size: 11px; font-weight: 700; color: #f59e0b; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px;">
                                    ${actionLabel}
                                </div>
                                <div style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 900; letter-spacing: 12px; color: #fbbf24; padding-left: 12px; text-shadow: 0 0 20px rgba(245, 158, 11, 0.4);">
                                    ${otp}
                                </div>
                                <div style="font-size: 12px; color: #cbd5e1; margin-top: 12px;">
                                    ⏱️ <strong>Valid for 5 minutes only</strong>
                                </div>
                            </div>

                            <!-- Security Warnings -->
                            <div style="background: #111522; border-radius: 10px; padding: 16px; margin-bottom: 24px; border-left: 3px solid #f59e0b;">
                                <p style="margin: 0; font-size: 12.5px; line-height: 1.5; color: #cbd5e1;">
                                    🔒 <strong>Security Warning:</strong> Never share this OTP with anyone. Netrave customer representatives will never ask for your one-time verification password.
                                </p>
                            </div>

                            <p style="margin: 0; font-size: 12.5px; color: #64748b; text-align: center; line-height: 1.5;">
                                If you did not initiate this request on Netrave, please disregard this email safely. Your account remains secure.
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 20px 30px; background-color: #07090e; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.06);">
                            <p style="margin: 0; font-size: 11px; color: #64748b; line-height: 1.6;">
                                &copy; ${new Date().getFullYear()} Netrave Fashion Studio. All rights reserved.<br>
                                Kozhikode, Kerala, India &bull; Express Streetwear Luxury
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;
}

/**
 * Sends a 6-digit OTP email to recipient
 */
export async function sendOtpEmail({ to, name = '', otp, purpose = 'registration' }) {
    if (!to) {
        throw new Error('Recipient email address is required.');
    }
    if (!otp) {
        throw new Error('OTP code is required.');
    }

    const transporter = createTransporter();
    const fromAddress = process.env.SMTP_FROM || '"Netrave Fashion" <no-reply@netravefashion.com>';
    const isRegister = purpose === 'registration';
    const subject = isRegister 
        ? `${otp} is your Netrave verification code` 
        : `${otp} is your Netrave password reset code`;

    const htmlContent = getOtpEmailHtml(name, otp, purpose);

    // If transporter is available, send via SMTP
    if (transporter) {
        try {
            const info = await transporter.sendMail({
                from: fromAddress,
                to,
                subject,
                html: htmlContent,
                text: `Your Netrave verification code is: ${otp}. It is valid for 5 minutes. Please do not share it with anyone.`
            });
            console.log(`[Netrave Email] Successfully sent OTP email to ${to} (MessageId: ${info.messageId})`);
            return { success: true, messageId: info.messageId, delivered: true };
        } catch (err) {
            console.error(`[Netrave Email] Failed to send email via SMTP to ${to}:`, err.message);
            throw new Error(`Email delivery failed: ${err.message}`);
        }
    } else {
        // Fallback for development if credentials are pending
        console.log(`\n==================================================`);
        console.log(`[NETRAVE DEV OTP PREVIEW]`);
        console.log(`To: ${to}`);
        console.log(`Purpose: ${purpose}`);
        console.log(`OTP Code: ${otp}`);
        console.log(`==================================================\n`);
        return { success: true, delivered: false, devPreview: true };
    }
}

/**
 * Verifies SMTP connection health
 */
export async function testSmtpConnection() {
    const transporter = createTransporter();
    if (!transporter) {
        return { connected: false, error: 'SMTP_USER or SMTP_PASS not set in environment.' };
    }
    try {
        await transporter.verify();
        return { connected: true };
    } catch (err) {
        return { connected: false, error: err.message };
    }
}
