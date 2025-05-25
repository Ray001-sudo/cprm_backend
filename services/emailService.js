import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || "465", 10),
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports like 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // This should be an App Password if using Gmail
  },
  // This TLS option is crucial for bypassing self-signed certificate errors
  // in local development environments (e.g., due to proxies or antivirus).
  // For production, ensure rejectUnauthorized is effectively true (its default)
  // and that your server has a clean network path to the SMTP server.
  tls: {
    // If NODE_ENV in your .env is 'development', rejectUnauthorized will be false.
    // If NODE_ENV is 'production', rejectUnauthorized will be true.
    rejectUnauthorized: process.env.NODE_ENV === 'production'
    // For direct testing if the above conditional doesn't seem to work in your dev env,
    // you could temporarily use: rejectUnauthorized: false
    // BUT REMEMBER TO CHANGE IT BACK OR USE THE CONDITIONAL FOR PRODUCTION.
  }
});

transporter.verify((error, success) => {
    if (error) {
        console.error('Error with email transporter configuration:', error.message);
        console.warn('Emails may not be sent. Please check your .env email settings (EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_SECURE).');
        if (error.message.includes('self-signed certificate')) {
            console.warn('The "self-signed certificate" error often means a proxy or antivirus is intercepting SSL. Ensure the tls.rejectUnauthorized option in emailService.js is correctly set for local development (should be false).');
        }
    } else {
        console.log('Email transporter is configured correctly and ready to send emails.');
    }
});

/**
 * Sends an email.
 * @param {object} mailDetails - Details for the email.
 * @param {string} mailDetails.to Recipient's email address.
 * @param {string} mailDetails.subject Email subject.
 * @param {string} mailDetails.text Plain text body.
 * @param {string} mailDetails.html HTML body.
 * @returns {Promise<object>} Nodemailer response object.
 * @throws {Error} If email sending fails.
 */
export const sendEmail = async ({ to, subject, text, html }) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM_ADDRESS || `"CPRM Ministry" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  };

  try {
    console.log(`Attempting to send email to: ${to} with subject: ${subject}`);
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully: %s', info.messageId);
    // Example: Preview URL (only works with ethereal.email or similar test accounts)
    // console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    return info;
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error.message, error.stack);
    // This error will be caught by the controller and handled.
    // It's important that the error message is clear.
    throw new Error(`Failed to send email. Reason: ${error.message}`);
  }
};
