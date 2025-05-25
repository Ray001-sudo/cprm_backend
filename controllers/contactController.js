// cprm-mpesa-backend/controllers/contactController.js
    import { sendEmail } from '../services/emailService.js';
    import { isValidEmail } from '../utils/validation.js';

    class AppError extends Error { // Local AppError
        constructor(message, statusCode) {
            super(message);
            this.statusCode = statusCode;
            this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
            this.isOperational = true;
            Error.captureStackTrace(this, this.constructor);
        }
    }

    export const handleContactForm = async (req, res, next) => {
      const { name, email, phone, subject, message } = req.body;
      console.log("Contact form submission received:", req.body);

      try {
        // Basic Validation
        if (!name || !email || !subject || !message) {
          throw new AppError('Name, email, subject, and message are required fields.', 400);
        }
        if (!isValidEmail(email)) {
          throw new AppError('Please provide a valid email address.', 400);
        }

        const recipientEmail = process.env.CONTACT_FORM_RECIPIENT;
        if (!recipientEmail) {
            console.error("CRITICAL: CONTACT_FORM_RECIPIENT is not set in .env. Cannot process contact form.");
            throw new AppError('Unable to process contact form due to server configuration error.', 500);
        }

        // 1. Send email to admin (bensonray25@gmail.com)
        const emailSubjectToAdmin = `New Contact Form Submission: ${subject}`;
        const emailTextToAdmin = `
          You have received a new message from the CPRM Website contact form:
          --------------------------------------------------
          Name: ${name}
          Email: ${email}
          Phone: ${phone || 'Not provided'}
          Subject: ${subject}
          --------------------------------------------------
          Message:
          ${message}
          --------------------------------------------------
        `;
        const emailHtmlToAdmin = `
          <h3>New Contact Form Submission</h3>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <hr>
          <h4>Message:</h4>
          <p>${message.replace(/\n/g, '<br>')}</p>
          <hr>
        `;

        await sendEmail({
          to: recipientEmail,
          subject: emailSubjectToAdmin,
          text: emailTextToAdmin,
          html: emailHtmlToAdmin,
        });
        console.log(`Contact form data sent to admin: ${recipientEmail}`);

        // 2. Send a confirmation auto-reply to the user (optional but good practice)
        try {
            const confirmationSubjectToUser = 'Message Received - CPRM Contact Form';
            const confirmationTextToUser = `
            Dear ${name},

            Thank you for contacting Christ Pentecostal Revival Ministry. We have received your message regarding "${subject}" and will get back to you as soon as possible.

            If your query is urgent, please feel free to call us.

            Blessings,
            The CPRM Team
            ${process.env.FRONTEND_URL || ''}
            `;
            const confirmationHtmlToUser = `
            <p>Dear ${name},</p>
            <p>Thank you for contacting <strong>Christ Pentecostal Revival Ministry</strong>. We have received your message regarding "<em>${subject}</em>" and will get back to you as soon as possible.</p>
            <p>If your query is urgent, please feel free to call us.</p>
            <p>Blessings,<br/>The CPRM Team</p>
            <p><a href="${process.env.FRONTEND_URL || '#'}">Visit our website</a></p>
            `;
            await sendEmail({
                to: email,
                subject: confirmationSubjectToUser,
                text: confirmationTextToUser,
                html: confirmationHtmlToUser
            });
            console.log(`Confirmation email sent to user: ${email}`);
        } catch (userEmailError) {
            console.warn(`Failed to send confirmation email to user ${email}: ${userEmailError.message}. Admin notification was successful.`);
            // Do not fail the whole request if only user confirmation fails
        }


        res.status(200).json({ message: 'Thank you for your message! We will get back to you soon.' });

      } catch (error) {
         if (error.isOperational) return next(error);
        
        console.error("Unexpected error in contact form submission:", error.message, error.stack);
        next(new AppError('Could not send your message at this time. Please try again later.', 500));
      }
    };