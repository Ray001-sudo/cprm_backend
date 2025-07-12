# CPRM Backend

[![License: MIT & GPL](https://img.shields.io/badge/License-MIT%20%26%20GPL-blue.svg)](https://opensource.org/licenses/MIT)

<!-- PROJECT LOGO -->
<br />
<p align="center">
  <a href="https://example.com">
    <img src="https://via.placeholder.com/80" alt="CPRM Logo" width="80" height="80">
  </a>

  <h3 align="center">CPRM Backend</h3>

  <p align="center">
    A backend system for managing and processing critical patient related information, M-Pesa transactions, newsletter subscriptions, and contact form submissions.
    <br />
    <!-- Commenting out the demo link as it wasn't provided and might not exist yet
    <a href="https://example.com">View Demo</a>
    ·
    -->
    <a href="https://github.com/your_username/cprm_backend/issues">Report Bug</a>
    ·
    <a href="https://github.com/your_username/cprm_backend/issues">Request Feature</a>
  </p>
</p>

## Table of Contents

1.  [Description](#description)
2.  [Architecture](#architecture)
3.  [Installation](#installation)
4.  [Usage](#usage)
    *   [API Endpoints](#api-endpoints)
        *   [M-Pesa](#mpesa)
        *   [Newsletter](#newsletter)
        *   [Contact Form](#contact-form)
5.  [Testing](#testing)
6.  [Contributing](#contributing)
7.  [License](#license)
8.  [Additional Information](#additional-information)

## Description

The CPRM Backend is a Node.js and Express-based application designed to manage various functionalities for Christ Pentecostal Revival Ministry (CPRM). It handles M-Pesa payment processing, newsletter subscriptions, and contact form submissions. The backend prioritizes security, error handling, and clear communication with the frontend.

## Architecture

The CPRM Backend utilizes a modular architecture with dedicated routes and controllers for each feature: M-Pesa, Newsletter, and Contact Form.  It leverages environment variables for configuration and uses `nodemailer` for email services.  Error handling is implemented globally to ensure consistent responses. CORS is configured to allow requests only from the specified frontend origin(s) in production.

### Component Diagram

*   **Client**: The frontend application that interacts with the backend.
*   **API Gateway/Express Server**: Handles routing, middleware, and overall request processing.
*   **M-Pesa Routes/Controller**: Handles M-Pesa STK Push requests and callbacks.
*   **Newsletter Routes/Controller**: Manages newsletter subscriptions.
*   **Contact Routes/Controller**: Processes contact form submissions.
*   **Safaricom API**:  The M-Pesa API for initiating and processing payments.
*   **Email Service**: Sends confirmation emails and admin notifications using `nodemailer`.
*   **SMTP Server**: The email server used to send emails (e.g., Gmail, SendGrid).

bash
    git clone https://github.com/your_username/cprm_backend.git
    cd cprm_backend
    3.  Configure environment variables:

    *   Create a `.env` file in the root directory.
    *   Add the following environment variables (replace the placeholder values):

    NEWSLETTER_ADMIN_RECIPIENT=your_admin_email_address # Where newsletter subscription notifications are sent
    CONTACT_FORM_RECIPIENT=your_admin_email_address # Where contact form submissions are sent

    > **Important Notes:**
    > *   For Gmail, you need to create an **App Password** in your Google Account settings and use that as the `EMAIL_PASS`.  Enable "Less secure app access" is no longer recommended.
    > *   In `development` mode, for local testing of M-Pesa callbacks, use [ngrok](https://ngrok.com/) to expose your local port and update the `MPESA_CALLBACK_URL_BASE` accordingly.  **Ensure `MPESA_CALLBACK_URL_BASE` uses `https` in production.**
    > *   Double-check that all environment variables are correctly set. Missing or incorrect values will cause the application to fail.
    > *   The `NODE_ENV` variable should be set to `production` in your production environment.

4.  Run the application:

        The server will start at `http://localhost:5000` (or the port specified in your `.env` file).

## Usage

### API Endpoints

The CPRM Backend provides the following API endpoints:

#### M-Pesa

*   **`POST /api/mpesa/stkpush`**: Initiates an M-Pesa STK Push request.

    *   **Authentication:** No authentication required (Public endpoint).  Consider implementing rate limiting and other security measures in production.
    *   **Request Body:**

json
    {
      "amount": 100,
      "mpesaPhone": "2547XXXXXXXX",
      "givingType": "Donation",  // Optional
      "accountReference": "CPRM Donation" // Optional
    }
    json
    {
      "message": "STK Push initiated. Please check your phone to enter M-Pesa PIN.",
      "data": {
        "MerchantRequestID": "xxxxx-xxxxx",
        "CheckoutRequestID": "xxxxx",
        "ResponseCode": "0",
        "ResponseDescription": "Success. Request accepted for processing",
        "CustomerMessage": "Success. Request accepted for processing"
      }
    }
        *   **Error Responses:**
        *   **400 Bad Request:** Invalid amount or phone number.
        *   **500 Internal Server Error:**  Failed to get access token or initiate STK push.  Check server logs for details.

    *   **`POST /api/mpesa/callback`**:  M-Pesa callback URL (Safaricom will POST to this endpoint).

        *   **Authentication:**  None.  This endpoint *must* be publicly accessible by Safaricom's servers.
        *   **Request Body:** Safaricom sends a JSON payload to this endpoint. The structure is complex; refer to the Safaricom Daraja API documentation for details. The backend logs the full request body for debugging.
        *   **Success Response (200 OK):**

        > **Important:** Your server *must* respond with a `200 OK` status to acknowledge receipt of the callback. Safaricom will retry if it doesn't receive a success response. The response body should follow the format above. The backend logs the callback data for debugging and needs to parse the important pieces of data like `MpesaReceiptNumber` and `Amount` for storage.

#### Newsletter

*   **`POST /api/newsletter/subscribe`**: Subscribes an email address to the newsletter.

json
    {
      "email": "user@example.com"
    }
    json
    {
      "message": "Thank you for subscribing! Please check your inbox for a confirmation (if applicable)."
    }
        *   **Error Responses:**
        *   **400 Bad Request:** Invalid email address.
        *   **500 Internal Server Error:** Failed to process the subscription.

#### Contact Form

*   **`POST /api/contact/submit`**: Handles contact form submissions.

    *   **Authentication:** No authentication required (Public endpoint).
    *   **Request Body:**

    *   **Example Request (using `curl`):**

bash
    curl -X POST -H "Content-Type: application/json" -d '{
      "name": "Jane Doe",
      "email": "jane.doe@example.com",
      "phone": "254700000000",
      "subject": "Donation Question",
      "message": "I have a question about donations."
    }' http://localhost:5000/api/contact/submit
        *   **Error Responses:**
        *   **400 Bad Request:** Missing required fields or invalid email address.
        *   **500 Internal Server Error:** Failed to send the message.

## Testing

> Describe how to run tests for your application. If you don't have tests yet, consider adding them using Jest and Supertest. Example:

1.  Install testing dependencies:

bash
    npm install --save-dev jest supertest
    1.  Fork the repository.
2.  Create a new branch for your feature or bug fix: `git checkout -b feature/your-feature-name`.
3.  Make your changes, ensuring they adhere to the project's coding style.
4.  Write tests for your changes.
5.  Run all tests to ensure everything is working correctly.
6.  Commit your changes with a clear and descriptive commit message.
7.  Push your branch to your forked repository: `git push origin feature/your-feature-name`.
8.  Submit a pull request to the main branch of the CPRM Backend repository.

> Add any specific coding style guidelines or testing procedures. Mention code formatting tools like Prettier, if used.  Clarify the pull request review process.

## License

This project is licensed under the MIT and GPL licenses. See the `LICENSE` file for details.

## Additional Information
