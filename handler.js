'use strict';

require('dotenv').config();
const nodemailer = require('nodemailer');

/**
 * POST /send
 * Body JSON: { receiver_email, subject, body_text }
 * Responses:
 *  - 200 OK     { message: "Email sent" }
 *  - 400 Bad Request { error: "reason" }
 *  - 401 Unauthorized { error: "SMTP authentication failed" }
 *  - 500 Internal Server Error { error: "Internal server error" }
 */

const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.FROM_EMAIL;

  if (!host || !user || !pass || !from) {
    throw new Error(
      'SMTP configuration incomplete. Please set SMTP_HOST, SMTP_USER, SMTP_PASS, and FROM_EMAIL.'
    );
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 5000, // abort if SMTP unresponsive after 5s
  });
};


const validatePayload = (body) => {
  if (!body) return 'Request body is required';
  const { receiver_email, subject, body_text } = body;
  if (!receiver_email) return 'receiver_email is required';
  if (!subject) return 'subject is required';
  if (!body_text) return 'body_text is required';

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRe.test(receiver_email))
    return 'receiver_email is not a valid email address';

  return null;
};

module.exports.sendEmail = async (event) => {
  try {
    // Parse body
    const rawBody = event.body;
    let body;
    if (!rawBody) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    try {
      body = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
    } catch {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Request body must be valid JSON' }),
      };
    }

    const validationError = validatePayload(body);
    if (validationError) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: validationError }),
      };
    }

    const { receiver_email, subject, body_text } = body;

    // Create transporter
    const transporter = createTransporter();

    // Verify SMTP connection (for demo purposes)
    await transporter.verify();

    // Send mail
    const info = await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: receiver_email,
      subject,
      text: body_text,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Email sent successfully',
        accepted: info.accepted,
        rejected: info.rejected || [],
        messageId: info.messageId || null,
      }),
    };
  } catch (err) {
    console.error('sendEmail error:', err);

    let statusCode = 500;
    let message = 'Internal server error';

    if (err.code === 'EAUTH') {
      statusCode = 401;
      message = 'SMTP authentication failed. Please check credentials.';
    } else if (err.code === 'ECONNECTION' || err.code === 'ETIMEDOUT') {
      statusCode = 502;
      message = 'Failed to connect to SMTP server.';
    } else if (err.responseCode === 550) {
      statusCode = 400;
      message = 'Invalid receiver email address.';
    }

    return {
      statusCode,
      body: JSON.stringify({
        error: message,
        details: err.message,
      }),
    };
  }
};
