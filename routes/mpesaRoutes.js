// cprm-mpesa-backend/routes/mpesaRoutes.js
    import express from 'express';
    import { initiateSTKPush, mpesaCallback } from '../controllers/mpesaController.js';
    // import { validateSTKPushRequest } from '../utils/validation.js'; // Optional: if you add validation middleware

    const router = express.Router();

    // @route   POST /api/mpesa/stkpush
    // @desc    Initiate M-Pesa STK Push
    // @access  Public (Consider rate limiting and other security measures for production)
    router.post('/stkpush', /* validateSTKPushRequest, */ initiateSTKPush); // Example with optional validation middleware

    // @route   POST /api/mpesa/callback
    // @desc    Callback URL for M-Pesa to send transaction status
    // @access  Public (Must be publicly accessible by Safaricom's servers)
    router.post('/callback', mpesaCallback);

    export default router;
    