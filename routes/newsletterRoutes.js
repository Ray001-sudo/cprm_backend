// cprm-mpesa-backend/routes/newsletterRoutes.js
    import express from 'express';
    import { subscribeToNewsletter } from '../controllers/newsletterController.js';
    // import { validateEmail } from '../utils/validation.js'; // Optional validation middleware

    const router = express.Router();

    // @route   POST /api/newsletter/subscribe
    // @desc    Subscribe a user to the newsletter
    // @access  Public
    router.post('/subscribe', /* validateEmail, */ subscribeToNewsletter);

    export default router;