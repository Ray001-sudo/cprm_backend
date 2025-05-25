// cprm-mpesa-backend/controllers/newsletterController.js
    import { sendEmail } from '../services/emailService.js';
    import { isValidEmail } from '../utils/validation.js'; // Using basic validation

    class AppError extends Error { // Local AppError for this controller
        constructor(message, statusCode) {
            super(message);
            this.statusCode = statusCode;
            this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
            this.isOperational = true;
            Error.captureStackTrace(this, this.constructor);
        }
    }

    // In a real app, you'd save this to a database or a newsletter service.
    // For this example, we'll just log it and send notifications.
    const subscribedEmails = new Set(); 

    export const subscribeToNewsletter = async (req, res, next) => {
      const { email } = req.body;
      console.log(`Newsletter subscription request for: ${email}`);

      try {
        if (!email || !isValidEmail(email)) {
          throw new AppError('Please provide a valid email address.', 400);
        }

        if (subscribedEmails.has(email.toLowerCase())) {
            // Idempotent: if already subscribed, still return success to user
            console.log(`Email ${email} is already subscribed. Sending success response.`);
            return res.status(200).json({ message: 'You are already subscribed to our newsletter!' });
        }

        // Simulate saving to a list/database
        subscribedEmails.add(email.toLowerCase());
        console.log(`Email ${email} added to subscription list. Total subscribers: ${subscribedEmails.size}`);

        // 1. Send a confirmation email to the subscriber (optional but good practice)
        try {
            await sendEmail({
                to: email,
                subject: 'Subscription Confirmed - CPRM Newsletter',
                text: `Hello,\n\nThank you for subscribing to the Christ Pentecostal Revival Ministry newsletter! You'll now receive our latest updates, event announcements, and spiritual encouragement.\n\nBlessings,\nThe CPRM Team\n\n${process.env.FRONTEND_URL || ''}`,
                html: `<p>Hello,</p><p>Thank you for subscribing to the <strong>Christ Pentecostal Revival Ministry</strong> newsletter! You'll now receive our latest updates, event announcements, and spiritual encouragement.</p><p>Blessings,<br/>The CPRM Team</p><p><a href="${process.env.FRONTEND_URL || '#'}">Visit our website</a></p>`,
            });
        } catch (emailError) {
            console.warn(`Failed to send confirmation email to ${email}: ${emailError.message}. Subscription still processed.`);
            // Don't let this fail the whole request if admin notification is more critical
        }
        
        // 2. Notify admin (bensonray25@gmail.com)
        const adminEmail = process.env.NEWSLETTER_ADMIN_RECIPIENT;
        if (adminEmail) {
            try {
                await sendEmail({
                    to: adminEmail,
                    subject: 'New Newsletter Subscription - CPRM Website',
                    text: `A new user has subscribed to the newsletter:\nEmail: ${email}`,
                    html: `<p>A new user has subscribed to the newsletter:</p><p><strong>Email:</strong> ${email}</p>`,
                });
            } catch (adminEmailError) {
                 console.error(`Failed to send admin notification for new subscriber ${email}: ${adminEmailError.message}`);
                 // Log this error, but the user's subscription was successful.
            }
        }

        res.status(200).json({ message: 'Thank you for subscribing! Please check your inbox for a confirmation (if applicable).' });

      } catch (error) {
        // Pass operational errors to the global error handler
        if (error.isOperational) return next(error);
        
        // For non-operational errors (e.g., unexpected email service failure not caught above)
        console.error("Unexpected error in newsletter subscription:", error.message, error.stack);
        next(new AppError('Could not process your subscription at this time. Please try again later.', 500));
      }
    };