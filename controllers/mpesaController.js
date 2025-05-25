// cprm-mpesa-backend/controllers/mpesaController.js
    import axios from 'axios';
    import moment from 'moment';
    import dotenv from 'dotenv';

    dotenv.config();

    const SAFARICOM_API_BASE_URL = process.env.NODE_ENV === 'production'
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke';

    class AppError extends Error {
        constructor(message, statusCode) {
            super(message);
            this.statusCode = statusCode;
            this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
            this.isOperational = true; // Errors we create are operational
            Error.captureStackTrace(this, this.constructor);
        }
    }

    const getAccessToken = async () => {
      const consumerKey = process.env.MPESA_CONSUMER_KEY;
      const consumerSecret = process.env.MPESA_CONSUMER_SECRET;

      if (!consumerKey || !consumerSecret) {
        console.error('CRITICAL: Missing M-Pesa API Consumer Key or Secret in .env file.');
        throw new AppError('M-Pesa API credentials are not configured on the server.', 500);
      }
      const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
      try {
        const response = await axios.get(
          `${SAFARICOM_API_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
          { headers: { Authorization: `Basic ${auth}` } }
        );
        console.log("Access token obtained successfully.");
        return response.data.access_token;
      } catch (error) {
        const errorMsg = error.response ? JSON.stringify(error.response.data) : error.message;
        console.error('Error getting M-Pesa access token:', errorMsg);
        throw new AppError(`Failed to get M-Pesa access token: ${errorMsg}`, 500);
      }
    };

    export const initiateSTKPush = async (req, res, next) => {
      console.log("STK Push request received:", req.body);
      try {
        const { amount, mpesaPhone, givingType = "Donation", accountReference = "CPRM Donation" } = req.body;

        if (!amount || !mpesaPhone) {
          throw new AppError('Amount and M-Pesa phone number are required.', 400);
        }
        
        let formattedPhone = String(mpesaPhone).trim();
        if (formattedPhone.startsWith('0')) {
            formattedPhone = `254${formattedPhone.substring(1)}`;
        } else if (formattedPhone.startsWith('+254')) {
            formattedPhone = formattedPhone.substring(1);
        }
        
        if (!formattedPhone.startsWith('254') || formattedPhone.length !== 12 || !/^\d+$/.test(formattedPhone)) {
            throw new AppError('Invalid phone number format. Expected format: 254XXXXXXXXX.', 400);
        }
        if (isNaN(parseFloat(amount)) || parseFloat(amount) < 1) {
            throw new AppError('Invalid amount. Amount must be a number greater than or equal to 1.', 400);
        }

        const accessToken = await getAccessToken();
        const shortCode = process.env.MPESA_BUSINESS_SHORTCODE;
        const passkey = process.env.MPESA_PASSKEY;
        const transactionType = process.env.MPESA_TRANSACTION_TYPE;
        const callbackURLBase = process.env.MPESA_CALLBACK_URL_BASE;
        const partyB = process.env.MPESA_PARTYB || shortCode;

        if (!shortCode || !passkey || !transactionType || !callbackURLBase) {
            console.error("CRITICAL: Missing M-Pesa STK Push configuration in .env.");
            throw new AppError("Server configuration error for M-Pesa processing.", 500);
        }
        
        const callbackURL = `${callbackURLBase}/api/mpesa/callback`;
        const timestamp = moment().format('YYYYMMDDHHmmss');
        const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString('base64');

        const stkPushPayload = {
          BusinessShortCode: shortCode,
          Password: password,
          Timestamp: timestamp,
          TransactionType: transactionType,
          Amount: String(Math.round(parseFloat(amount))),
          PartyA: formattedPhone,
          PartyB: partyB,
          PhoneNumber: formattedPhone,
          CallBackURL: callbackURL,
          AccountReference: String(accountReference).substring(0, 12),
          TransactionDesc: String(givingType).substring(0, 13),
        };

        console.log("Initiating STK Push with payload:", JSON.stringify(stkPushPayload, null, 2));
        
        const response = await axios.post(
          `${SAFARICOM_API_BASE_URL}/mpesa/stkpush/v1/processrequest`,
          stkPushPayload,
          { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
        );

        console.log('STK Push initiated successfully by Daraja:', response.data);
        res.status(200).json({ 
            message: 'STK Push initiated. Please check your phone to enter M-Pesa PIN.',
            data: response.data 
        });

      } catch (error) {
        // If it's an AppError we created, it's already operational and has a status code
        if (error.isOperational) return next(error);

        // Handle Axios errors or other unexpected errors
        const errorData = error.response ? error.response.data : null;
        const errorMessageDetail = errorData ? JSON.stringify(errorData) : error.message;
        console.error('Unhandled Error in initiateSTKPush:', errorMessageDetail, error.stack);
        
        if (errorData && (errorData.errorCode || errorData.errorMessage)) {
            next(new AppError(`M-Pesa Error: ${errorData.errorMessage || 'Unknown Daraja Error'} (Code: ${errorData.errorCode || 'N/A'})`, error.response?.status || 500));
        } else {
            next(new AppError('Failed to initiate M-Pesa STK push due to a server error.', 500));
        }
      }
    };

    export const mpesaCallback = (req, res, next) => {
      console.log('--- M-Pesa Callback Received ---');
      console.log('Headers:', JSON.stringify(req.headers, null, 2));
      console.log('Body:', JSON.stringify(req.body, null, 2));
      try {
        if (!req.body || !req.body.Body || !req.body.Body.stkCallback) {
          console.error('Invalid callback format received from M-Pesa.');
          // Still respond with success to Safaricom to prevent retries for malformed requests.
          return res.status(200).json({ ResponseCode: "0", ResponseDesc: "Callback received but format was unexpected." });
        }

        const callbackData = req.body.Body.stkCallback;
        const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc } = callbackData;

        console.log(`Callback for MerchantRequestID: ${MerchantRequestID}, CheckoutRequestID: ${CheckoutRequestID}`);
        console.log(`Result Code: ${ResultCode}, Result Description: ${ResultDesc}`);

        if (ResultCode === 0) {
          console.log('Payment Successful!');
          if (callbackData.CallbackMetadata && callbackData.CallbackMetadata.Item) {
              const metadataItems = callbackData.CallbackMetadata.Item;
              const amount = metadataItems.find(item => item.Name === 'Amount')?.Value;
              const mpesaReceiptNumber = metadataItems.find(item => item.Name === 'MpesaReceiptNumber')?.Value;
              const transactionDate = metadataItems.find(item => item.Name === 'TransactionDate')?.Value;
              const phoneNumber = metadataItems.find(item => item.Name === 'PhoneNumber')?.Value;

              console.log('  Amount:', amount);
              console.log('  MpesaReceiptNumber:', mpesaReceiptNumber);
              // TODO: Store these details securely in your database, associated with the CheckoutRequestID.
              // Example: recordPaymentSuccess(CheckoutRequestID, mpesaReceiptNumber, amount, transactionDate, phoneNumber);
          } else {
              console.warn("Successful M-Pesa payment but CallbackMetadata is missing or malformed.");
          }
        } else {
          console.error('M-Pesa Payment Failed or Cancelled by User.');
          // TODO: Update your database with the failure.
          // Example: recordPaymentFailure(CheckoutRequestID, ResultCode, ResultDesc);
        }

        res.status(200).json({ ResponseCode: "0", ResponseDesc: "Callback received and acknowledged." });
      } catch (error) {
        console.error("Error processing M-Pesa callback:", error.message, error.stack);
        // Even if our processing fails, we should try to acknowledge Safaricom if possible,
        // but log the internal error.
        // If res headers already sent, this might not execute.
        if (!res.headersSent) {
            res.status(200).json({ ResponseCode: "0", ResponseDesc: "Callback received but internal processing error occurred." });
        }
        // No next(error) here as we are responding to Safaricom, not the client directly.
      }
    };
    