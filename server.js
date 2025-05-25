// cprm-mpesa-backend/server.js
    import express from 'express';
    import dotenv from 'dotenv';
    import cors from 'cors';

    import mpesaRoutes from './routes/mpesaRoutes.js';
    import newsletterRoutes from './routes/newsletterRoutes.js';
    import contactRoutes from './routes/contactRoutes.js';

    // Load environment variables from .env file
    dotenv.config();

    const app = express();
    const PORT = process.env.PORT || 5000;

    // Middleware
    // Configure CORS for production: specify allowed origins
    const allowedOrigins = [
        process.env.FRONTEND_URL, // Your frontend URL from .env
        // Add other origins if needed, e.g., a staging frontend
    ];
    const corsOptions = {
        origin: function (origin, callback) {
            // Allow requests with no origin (like mobile apps or curl requests) during development
            if (!origin && process.env.NODE_ENV !== 'production') return callback(null, true);
            if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        optionsSuccessStatus: 200 // For legacy browser support
    };
    app.use(cors(process.env.NODE_ENV === 'production' ? corsOptions : undefined));


    app.use(express.json({ limit: '10kb' })); // Limit request body size
    app.use(express.urlencoded({ extended: true, limit: '10kb' }));

    // Basic Security Headers (can be expanded with helmet.js)
    app.use((req, res, next) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        // Add more headers like CSP if needed
        next();
    });


    // API Routes
    app.get('/', (req, res) => {
      res.send('CPRM API Backend is running!');
    });

    app.use('/api/mpesa', mpesaRoutes);
    app.use('/api/newsletter', newsletterRoutes);
    app.use('/api/contact', contactRoutes);

    // Catch-all for undefined API routes
    app.all('/api/*', (req, res) => {
        res.status(404).json({ message: `API endpoint not found: ${req.originalUrl}` });
    });

    // Global Error Handling Middleware
    app.use((err, req, res, next) => {
      console.error("GLOBAL ERROR HANDLER:", err.stack || err.message || err);
      
      // Sanitize error message for production
      const errorMessage = process.env.NODE_ENV === 'production' && !err.isOperational
        ? 'An unexpected error occurred on the server.'
        : err.message;

      res.status(err.statusCode || 500).json({
        status: err.status || 'error',
        message: errorMessage,
        // Optionally include stack trace in development
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
      });
    });

    app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
      if (process.env.NODE_ENV !== 'production') {
        console.log(`For local M-Pesa callbacks, use ngrok to expose port ${PORT}.`);
      }
    });
    