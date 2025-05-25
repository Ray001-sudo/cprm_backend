// cprm-mpesa-backend/routes/contactRoutes.js
    import express from 'express';
    import { handleContactForm } from '../controllers/contactController.js';
    // import { validateContactForm } from '../utils/validation.js'; // Optional

    const router = express.Router();

    // @route   POST /api/contact/submit
    // @desc    Handle contact form submission
    // @access  Public
    router.post('/submit', /* validateContactForm, */ handleContactForm);

    export default router;