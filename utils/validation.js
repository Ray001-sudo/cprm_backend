 // cprm-mpesa-backend/utils/validation.js

    /**
     * Checks if an email is valid using a simple regex.
     * For production, consider a more robust validation library.
     * @param {string} email
     * @returns {boolean}
     */
    export const isValidEmail = (email) => {
      if (!email || typeof email !== 'string') return false;
      // Basic regex for email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email.trim());
    };

    /**
     * Middleware to validate email in request body.
     * Example: router.post('/subscribe', validateEmail, subscribeToNewsletter);
     */
    // export const validateEmailMiddleware = (req, res, next) => {
    //   const { email } = req.body;
    //   if (!email || !isValidEmail(email)) {
    //     return res.status(400).json({ message: 'A valid email address is required.' });
    //   }
    //   next();
    // };

    /**
     * Middleware for STK Push request validation (basic example)
     */
    // export const validateSTKPushRequest = (req, res, next) => {
    //     const { amount, mpesaPhone } = req.body;
    //     if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) < 1) {
    //         return res.status(400).json({ message: 'Valid amount is required.' });
    //     }
    //     if (!mpesaPhone || !/^(254\d{9}|0\d{9})$/.test(String(mpesaPhone).trim())) {
    //         return res.status(400).json({ message: 'Valid M-Pesa phone number is required (e.g., 2547... or 07...).' });
    //     }
    //     next();
    // };

    // Add more validation functions or middleware as needed
    